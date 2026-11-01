const express = require("express");
const router = express.Router();
const pool = require("../db");

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Dashboard statistics
router.get("/dashboard", asyncRoute(async (req, res) => {
  const [[students]] = await pool.query("SELECT COUNT(*) AS total FROM students");
  const [[departments]] = await pool.query("SELECT COUNT(*) AS total FROM departments");
  const [[sections]] = await pool.query("SELECT COUNT(*) AS total FROM class_sections");
  const [[courses]] = await pool.query("SELECT COUNT(*) AS total FROM courses");
  const [[enrollments]] = await pool.query("SELECT COUNT(*) AS total FROM enrollments");
  const [[marksStat]] = await pool.query(`
    SELECT ROUND(AVG(internal_marks + external_marks), 1) AS avgMarks 
    FROM enrollments 
    WHERE internal_marks IS NOT NULL AND external_marks IS NOT NULL
  `);
  const [[attStat]] = await pool.query(`
    SELECT ROUND(100 * SUM(status IN ('Present', 'Late')) / NULLIF(COUNT(*), 0), 1) AS attendanceRate 
    FROM attendance
  `);
  const [divisionCounts] = await pool.query(`
    SELECT d.department_name, cs.division, cs.study_year, ay.year_label,
           COUNT(s.student_id) AS student_count
    FROM class_sections cs
    JOIN departments d ON d.department_id = cs.department_id
    JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
    LEFT JOIN students s ON s.section_id = cs.section_id
    GROUP BY cs.section_id, d.department_name, cs.division, cs.study_year, ay.year_label
    ORDER BY d.department_name, cs.study_year, cs.division
  `);
  res.json({
    totals: {
      students: students.total,
      departments: departments.total,
      sections: sections.total,
      courses: courses.total,
      enrollments: enrollments.total,
      avgMarks: marksStat.avgMarks ?? "—",
      attendanceRate: attStat.attendanceRate != null ? `${attStat.attendanceRate}%` : "—"
    },
    divisionCounts
  });
}));

// Reference data
router.get("/departments", asyncRoute(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM departments ORDER BY department_name");
  res.json(rows);
}));

router.get("/academic-years", asyncRoute(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM academic_years ORDER BY start_date DESC");
  res.json(rows);
}));

router.get("/sections", asyncRoute(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT cs.section_id, cs.department_id, cs.academic_year_id, cs.study_year, cs.division,
           d.department_name, ay.year_label
    FROM class_sections cs
    JOIN departments d ON d.department_id = cs.department_id
    JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
    ORDER BY d.department_name, cs.study_year, cs.division
  `);
  res.json(rows);
}));

router.get("/courses", asyncRoute(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.*, d.department_name
    FROM courses c JOIN departments d ON d.department_id = c.department_id
    ORDER BY c.course_name
  `);
  res.json(rows);
}));

// Students: search, read, create, update, delete
router.get("/students", asyncRoute(async (req, res) => {
  const search = `%${(req.query.search || "").trim()}%`;
  const [rows] = await pool.query(`
    SELECT s.student_id, s.roll_no, s.full_name, s.email, s.phone, s.admission_year,
           cs.section_id, cs.division, cs.study_year, ay.year_label,
           d.department_id, d.department_name
    FROM students s
    JOIN class_sections cs ON cs.section_id = s.section_id
    JOIN departments d ON d.department_id = cs.department_id
    JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
    WHERE s.roll_no LIKE ? OR s.full_name LIKE ? OR s.email LIKE ?
    ORDER BY s.roll_no
  `, [search, search, search]);
  res.json(rows);
}));

router.post("/students", asyncRoute(async (req, res) => {
  const { roll_no, full_name, email, phone, admission_year, section_id } = req.body;
  if (!roll_no || !full_name || !section_id) return res.status(400).json({ error: "Roll number, full name and section are required." });
  const [result] = await pool.query(
    `INSERT INTO students (roll_no, full_name, email, phone, admission_year, section_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [roll_no.trim(), full_name.trim(), email || null, phone || null, admission_year || null, Number(section_id)]
  );
  res.status(201).json({ message: "Student added successfully.", student_id: result.insertId });
}));

router.put("/students/:id", asyncRoute(async (req, res) => {
  const { roll_no, full_name, email, phone, admission_year, section_id } = req.body;
  if (!roll_no || !full_name || !section_id) return res.status(400).json({ error: "Roll number, full name and section are required." });
  const [result] = await pool.query(
    `UPDATE students SET roll_no=?, full_name=?, email=?, phone=?, admission_year=?, section_id=?
     WHERE student_id=?`,
    [roll_no.trim(), full_name.trim(), email || null, phone || null, admission_year || null, Number(section_id), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Student not found." });
  res.json({ message: "Student updated successfully." });
}));

router.delete("/students/:id", asyncRoute(async (req, res) => {
  const [result] = await pool.query("DELETE FROM students WHERE student_id=?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Student not found." });
  res.json({ message: "Student deleted successfully." });
}));

// Course offerings and enrollments
router.get("/offerings", asyncRoute(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT co.offering_id, co.semester, c.course_code, c.course_name,
           cs.section_id, cs.division, cs.study_year, d.department_name, ay.year_label
    FROM course_offerings co
    JOIN courses c ON c.course_id=co.course_id
    JOIN class_sections cs ON cs.section_id=co.section_id
    JOIN departments d ON d.department_id=cs.department_id
    JOIN academic_years ay ON ay.academic_year_id=cs.academic_year_id
    ORDER BY ay.year_label DESC, d.department_name, cs.division, c.course_code
  `);
  res.json(rows);
}));

router.get("/enrollments", asyncRoute(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT e.enrollment_id, e.student_id, s.roll_no, s.full_name,
           c.course_code, c.course_name, co.semester, e.internal_marks, e.external_marks
    FROM enrollments e
    JOIN students s ON s.student_id=e.student_id
    JOIN course_offerings co ON co.offering_id=e.offering_id
    JOIN courses c ON c.course_id=co.course_id
    ORDER BY s.roll_no, c.course_code
  `);
  res.json(rows);
}));

router.post("/enrollments", asyncRoute(async (req, res) => {
  const { student_id, offering_id, internal_marks, external_marks } = req.body;
  if (!student_id || !offering_id) return res.status(400).json({ error: "Student and course offering are required." });
  // Ensure the student belongs to the class section receiving this course offering.
  const [matchingSection] = await pool.query(
    `SELECT s.student_id
     FROM students s
     JOIN course_offerings co ON co.section_id = s.section_id
     WHERE s.student_id = ? AND co.offering_id = ?`,
    [Number(student_id), Number(offering_id)]
  );
  if (!matchingSection.length) {
    return res.status(400).json({ error: "This course offering is not assigned to the student's current class section." });
  }
  const [result] = await pool.query(
    `INSERT INTO enrollments (student_id, offering_id, internal_marks, external_marks)
     VALUES (?, ?, ?, ?)`,
    [Number(student_id), Number(offering_id), internal_marks === "" || internal_marks == null ? null : Number(internal_marks),
     external_marks === "" || external_marks == null ? null : Number(external_marks)]
  );
  res.status(201).json({ message: "Enrollment created successfully.", enrollment_id: result.insertId });
}));

router.put("/enrollments/:id/marks", asyncRoute(async (req, res) => {
  const { internal_marks, external_marks } = req.body;
  const [result] = await pool.query(
    "UPDATE enrollments SET internal_marks=?, external_marks=? WHERE enrollment_id=?",
    [internal_marks === "" || internal_marks == null ? null : Number(internal_marks),
     external_marks === "" || external_marks == null ? null : Number(external_marks), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Enrollment not found." });
  res.json({ message: "Marks updated successfully." });
}));

router.get("/attendance", asyncRoute(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT a.attendance_id, a.attendance_date, a.status, e.enrollment_id,
           s.roll_no, s.full_name, c.course_code, c.course_name
    FROM attendance a
    JOIN enrollments e ON e.enrollment_id=a.enrollment_id
    JOIN students s ON s.student_id=e.student_id
    JOIN course_offerings co ON co.offering_id=e.offering_id
    JOIN courses c ON c.course_id=co.course_id
    ORDER BY a.attendance_date DESC, s.roll_no
    LIMIT 200
  `);
  res.json(rows);
}));

// Course offering roster for fast lecture attendance marking
router.get("/offerings/:id/roster", asyncRoute(async (req, res) => {
  const offeringId = Number(req.params.id);
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const [[offering]] = await pool.query(`
    SELECT co.offering_id, co.semester, c.course_code, c.course_name,
           d.department_name, cs.study_year, cs.division, ay.year_label
    FROM course_offerings co
    JOIN courses c ON c.course_id = co.course_id
    JOIN class_sections cs ON cs.section_id = co.section_id
    JOIN departments d ON d.department_id = cs.department_id
    JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
    WHERE co.offering_id = ?
  `, [offeringId]);

  if (!offering) return res.status(404).json({ error: "Course offering not found." });

  const [students] = await pool.query(`
    SELECT e.enrollment_id, s.student_id, s.roll_no, s.full_name, s.email,
           COALESCE(a.status, 'Present') AS current_status,
           a.attendance_id
    FROM enrollments e
    JOIN students s ON s.student_id = e.student_id
    LEFT JOIN attendance a ON a.enrollment_id = e.enrollment_id AND a.attendance_date = ?
    WHERE e.offering_id = ?
    ORDER BY s.roll_no
  `, [date, offeringId]);

  res.json({ offering, date, students });
}));

// Fast single attendance upsert
router.post("/attendance", asyncRoute(async (req, res) => {
  const { enrollment_id, attendance_date, status } = req.body;
  if (!enrollment_id || !attendance_date || !["Present", "Absent", "Late"].includes(status)) {
    return res.status(400).json({ error: "Valid enrollment, date and status (Present/Absent/Late) are required." });
  }
  const [result] = await pool.query(`
    INSERT INTO attendance (enrollment_id, attendance_date, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status)
  `, [Number(enrollment_id), attendance_date, status]);
  res.status(201).json({ message: "Attendance recorded successfully.", attendance_id: result.insertId });
}));

// Fast batch class lecture attendance marking
router.post("/attendance/batch", asyncRoute(async (req, res) => {
  const { attendance_date, records } = req.body;
  if (!attendance_date || !Array.isArray(records) || !records.length) {
    return res.status(400).json({ error: "Attendance date and student records list are required." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const r of records) {
      if (!r.enrollment_id || !["Present", "Absent", "Late"].includes(r.status)) continue;
      await conn.query(`
        INSERT INTO attendance (enrollment_id, attendance_date, status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `, [Number(r.enrollment_id), attendance_date, r.status]);
    }
    await conn.commit();
    res.json({ message: `Successfully recorded attendance for ${records.length} students.`, count: records.length });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// Institutional Academic Inquiries & Reports Specification
const DBMS_QUERIES = [
  {
    id: "q1",
    title: "1. Complete Student Enrollment Directory",
    category: "STUDENT DIRECTORY",
    concept: "Comprehensive cross-departmental student roster",
    description: "Master directory combining student profiles, assigned departments, study years and divisions.",
    sql: `SELECT s.roll_no, s.full_name, d.department_name, cs.study_year,
       cs.division, ay.year_label
FROM students s
JOIN class_sections cs ON cs.section_id = s.section_id
JOIN departments d ON d.department_id = cs.department_id
JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
ORDER BY d.department_name, cs.division, s.roll_no;`
  },
  {
    id: "q2",
    title: "2. Student Strength by Division",
    category: "COHORT STRENGTH",
    concept: "Class section capacity and student count distribution",
    description: "Active student enrollment numbers grouped by academic department, study year and division.",
    sql: `SELECT d.department_name, cs.study_year, cs.division, ay.year_label,
       COUNT(s.student_id) AS total_students
FROM class_sections cs
JOIN departments d ON d.department_id = cs.department_id
JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
LEFT JOIN students s ON s.section_id = cs.section_id
GROUP BY cs.section_id, d.department_name, cs.study_year, cs.division, ay.year_label
ORDER BY d.department_name, cs.division;`
  },
  {
    id: "q3",
    title: "3. Class Course Schedule (COMP Div A, Sem 5)",
    category: "COURSE SCHEDULE",
    concept: "Division-specific semester curriculum mapping",
    description: "Curriculum subjects scheduled for third-year Computer Engineering Division A.",
    sql: `SELECT c.course_code, c.course_name, co.semester
FROM course_offerings co
JOIN courses c ON c.course_id = co.course_id
JOIN class_sections cs ON cs.section_id = co.section_id
JOIN departments d ON d.department_id = cs.department_id
WHERE d.department_code = 'COMP' AND cs.division = 'A'
  AND cs.study_year = 3 AND co.semester = 5;`
  },
  {
    id: "q4",
    title: "4. Subject-wise Average Marks Ledger",
    category: "PERFORMANCE",
    concept: "Continuous assessment & final exam score averages",
    description: "Calculates average combined internal and external examination scores for each curriculum subject.",
    sql: `SELECT c.course_code, c.course_name,
       ROUND(AVG(e.internal_marks + e.external_marks), 2) AS average_total
FROM enrollments e
JOIN course_offerings co ON co.offering_id = e.offering_id
JOIN courses c ON c.course_id = co.course_id
GROUP BY c.course_id, c.course_code, c.course_name;`
  },
  {
    id: "q5",
    title: "5. High Achievers & Honors List (Avg > 70)",
    category: "HONOR ROLL",
    concept: "Dean's list / Top performing student identification",
    description: "Identifies students maintaining an average score above 70 across all enrolled courses.",
    sql: `SELECT s.roll_no, s.full_name,
       ROUND(AVG(e.internal_marks + e.external_marks), 2) AS average_marks
FROM students s
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY s.student_id, s.roll_no, s.full_name
HAVING AVG(e.internal_marks + e.external_marks) > 70;`
  },
  {
    id: "q6",
    title: "6. Course Enrollment Roster: Database Systems",
    category: "COURSE ROSTER",
    concept: "Subject-specific student registration audit",
    description: "Roster of students currently registered for Database Management Systems.",
    sql: `SELECT roll_no, full_name
FROM students
WHERE student_id IN (
  SELECT e.student_id
  FROM enrollments e
  JOIN course_offerings co ON co.offering_id = e.offering_id
  JOIN courses c ON c.course_id = co.course_id
  WHERE c.course_code = 'DBMS'
);`
  },
  {
    id: "q7",
    title: "7. Student Attendance Compliance Ratio",
    category: "ATTENDANCE AUDIT",
    concept: "Mandatory 75% class attendance verification",
    description: "Calculates total lecture sessions and percentage attendance per student course enrollment.",
    sql: `SELECT s.roll_no, s.full_name, c.course_code,
       COUNT(*) AS classes_recorded,
       ROUND(100 * SUM(a.status IN ('Present', 'Late')) / COUNT(*), 2) AS attendance_percentage
FROM attendance a
JOIN enrollments e ON e.enrollment_id = a.enrollment_id
JOIN students s ON s.student_id = e.student_id
JOIN course_offerings co ON co.offering_id = e.offering_id
JOIN courses c ON c.course_id = co.course_id
GROUP BY e.enrollment_id, s.roll_no, s.full_name, c.course_code;`
  },
  {
    id: "q8",
    title: "8. Student Enrollment Audit (Including Unassigned)",
    category: "ADMISSIONS AUDIT",
    concept: "Verification of registration completeness",
    description: "Audits enrolled course count per student to detect new admissions without course registrations.",
    sql: `SELECT s.roll_no, s.full_name, COUNT(e.enrollment_id) AS enrolled_courses
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.student_id
GROUP BY s.student_id, s.roll_no, s.full_name;`
  },
  {
    id: "q9",
    title: "9. Top Examination Scores by Subject",
    category: "COURSE TOPPERS",
    concept: "Curriculum subject maximum achievement",
    description: "Discovers the highest overall marks achieved in each course across all divisions.",
    sql: `SELECT c.course_code, MAX(e.internal_marks + e.external_marks) AS highest_total
FROM courses c
JOIN course_offerings co ON co.course_id = c.course_id
JOIN enrollments e ON e.offering_id = co.offering_id
GROUP BY c.course_id, c.course_code;`
  },
  {
    id: "q10",
    title: "10. Student Contact Verification & Update",
    category: "PROFILE UPDATE",
    concept: "Student profile phone record modification",
    description: "Demonstrates verified profile update of student contact number.",
    sql: `UPDATE students SET phone = '9999900000' WHERE roll_no = '301';`
  },
  {
    id: "q11",
    title: "11. Academic Ledger Audit & Data Safety Check",
    category: "AUDIT INTEGRITY",
    concept: "Transactional consistency and roll-back protection",
    description: "Verifies academic ledger safety with transaction rollback protection.",
    sql: `START TRANSACTION;
-- Testing isolated insertion
SELECT 'Transaction opened safely' AS status;
ROLLBACK;`
  },
  {
    id: "q12",
    title: "12. Master Institutional Directory View",
    category: "REGISTRAR VIEW",
    concept: "Pre-compiled institutional directory report",
    description: "Instant institutional directory query via pre-computed academic registrar view.",
    sql: `SELECT * FROM student_directory;`
  }
];

// List all DBMS mini-project queries
router.get("/queries", (req, res) => {
  res.json(DBMS_QUERIES);
});

// Run a specific query by ID
router.post("/queries/run", asyncRoute(async (req, res) => {
  const { queryId } = req.body;
  const target = DBMS_QUERIES.find(q => q.id === queryId);
  if (!target) {
    return res.status(404).json({ error: "Query not found in DBMS queries catalog." });
  }

  // Ensure view exists if running Q12
  if (target.id === "q12") {
    await pool.query(`
      CREATE OR REPLACE VIEW student_directory AS
      SELECT s.student_id, s.roll_no, s.full_name, s.email, s.phone,
             d.department_name, cs.study_year, cs.division, ay.year_label
      FROM students s
      JOIN class_sections cs ON cs.section_id = s.section_id
      JOIN departments d ON d.department_id = cs.department_id
      JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id;
    `);
  }

  const startTime = process.hrtime();

  if (target.id === "q10") {
    const [result] = await pool.query(target.sql);
    const diff = process.hrtime(startTime);
    const executionTimeMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
    return res.json({
      query: target,
      columns: ["affectedRows", "message", "changedRows"],
      rows: [{ affectedRows: result.affectedRows, message: "Contact number updated for Roll 301.", changedRows: result.changedRows }],
      executionTimeMs,
      rowCount: 1
    });
  }

  if (target.id === "q11") {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [testRows] = await conn.query("SELECT 'Transaction Started - ACID atomicity demonstration' AS transaction_state");
      await conn.rollback();
      const diff = process.hrtime(startTime);
      const executionTimeMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
      return res.json({
        query: target,
        columns: ["transaction_state", "result"],
        rows: [{ transaction_state: testRows[0].transaction_state, result: "ROLLBACK executed successfully. No changes committed." }],
        executionTimeMs,
        rowCount: 1
      });
    } finally {
      conn.release();
    }
  }

  const [rows, fields] = await pool.query(target.sql);
  const diff = process.hrtime(startTime);
  const executionTimeMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
  const columns = fields && fields.length ? fields.map(f => f.name) : (rows.length ? Object.keys(rows[0]) : []);

  res.json({
    query: target,
    columns,
    rows,
    executionTimeMs,
    rowCount: rows.length
  });
}));

module.exports = router;
