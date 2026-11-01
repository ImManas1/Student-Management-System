USE student_management;

-- 1. Display all students with department, division, year and academic year.
SELECT s.roll_no, s.full_name, d.department_name, cs.study_year,
       cs.division, ay.year_label
FROM students s
JOIN class_sections cs ON cs.section_id = s.section_id
JOIN departments d ON d.department_id = cs.department_id
JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
ORDER BY d.department_name, cs.division, s.roll_no;

-- 2. Count students in each division (LEFT JOIN includes empty divisions).
SELECT d.department_name, cs.study_year, cs.division, ay.year_label,
       COUNT(s.student_id) AS total_students
FROM class_sections cs
JOIN departments d ON d.department_id = cs.department_id
JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id
LEFT JOIN students s ON s.section_id = cs.section_id
GROUP BY cs.section_id, d.department_name, cs.study_year, cs.division, ay.year_label
ORDER BY d.department_name, cs.division;

-- 3. List courses offered to Computer Engineering Division A, Semester 5.
SELECT c.course_code, c.course_name, co.semester
FROM course_offerings co
JOIN courses c ON c.course_id = co.course_id
JOIN class_sections cs ON cs.section_id = co.section_id
JOIN departments d ON d.department_id = cs.department_id
WHERE d.department_code = 'COMP' AND cs.division = 'A'
  AND cs.study_year = 3 AND co.semester = 5;

-- 4. Average total marks for each course.
SELECT c.course_code, c.course_name,
       ROUND(AVG(e.internal_marks + e.external_marks), 2) AS average_total
FROM enrollments e
JOIN course_offerings co ON co.offering_id = e.offering_id
JOIN courses c ON c.course_id = co.course_id
GROUP BY c.course_id, c.course_code, c.course_name;

-- 5. Students whose average recorded total marks are above 70.
SELECT s.roll_no, s.full_name,
       ROUND(AVG(e.internal_marks + e.external_marks), 2) AS average_marks
FROM students s
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY s.student_id, s.roll_no, s.full_name
HAVING AVG(e.internal_marks + e.external_marks) > 70;

-- 6. Subquery: students enrolled in DBMS.
SELECT roll_no, full_name
FROM students
WHERE student_id IN (
  SELECT e.student_id
  FROM enrollments e
  JOIN course_offerings co ON co.offering_id = e.offering_id
  JOIN courses c ON c.course_id = co.course_id
  WHERE c.course_code = 'DBMS'
);

-- 7. Attendance percentage for each enrollment.
SELECT s.roll_no, s.full_name, c.course_code,
       COUNT(*) AS classes_recorded,
       ROUND(100 * SUM(a.status IN ('Present', 'Late')) / COUNT(*), 2) AS attendance_percentage
FROM attendance a
JOIN enrollments e ON e.enrollment_id = a.enrollment_id
JOIN students s ON s.student_id = e.student_id
JOIN course_offerings co ON co.offering_id = e.offering_id
JOIN courses c ON c.course_id = co.course_id
GROUP BY e.enrollment_id, s.roll_no, s.full_name, c.course_code;

-- 8. LEFT JOIN: include students who have no enrollments.
SELECT s.roll_no, s.full_name, COUNT(e.enrollment_id) AS enrolled_courses
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.student_id
GROUP BY s.student_id, s.roll_no, s.full_name;

-- 9. Find the highest total marks recorded in each course.
SELECT c.course_code, MAX(e.internal_marks + e.external_marks) AS highest_total
FROM courses c
JOIN course_offerings co ON co.course_id = c.course_id
JOIN enrollments e ON e.offering_id = co.offering_id
GROUP BY c.course_id, c.course_code;

-- 10. Update a student's contact number.
UPDATE students SET phone = '9999900000' WHERE roll_no = '301';

-- 11. Transaction example: add an enrollment safely.
START TRANSACTION;
INSERT INTO enrollments (student_id, offering_id, internal_marks, external_marks)
VALUES (1, 1, NULL, NULL);
-- This example will fail if the sample enrollment already exists due to UNIQUE.
-- Use ROLLBACK for this demonstration, or choose a valid new student/offering pair.
ROLLBACK;

-- 12. View definition: student directory.
CREATE OR REPLACE VIEW student_directory AS
SELECT s.student_id, s.roll_no, s.full_name, s.email, s.phone,
       d.department_name, cs.study_year, cs.division, ay.year_label
FROM students s
JOIN class_sections cs ON cs.section_id = s.section_id
JOIN departments d ON d.department_id = cs.department_id
JOIN academic_years ay ON ay.academic_year_id = cs.academic_year_id;

SELECT * FROM student_directory;
