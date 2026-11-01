// CampusCore SIS — Institutional Frontend Controller
const $ = (id) => document.getElementById(id);

// Application State
let studentsCache = [];
let sectionsCache = [];
let departmentsCache = [];
let coursesCache = [];
let offeringsCache = [];
let enrollmentsCache = [];
let attendanceCache = [];
let queriesCache = [];
let activeQueryId = "q1";
let toastTimer;

// API Helper
async function api(url, options = {}) {
  const response = await fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Toast Notifications
function notify(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.style.borderColor = isError ? "#ef4444" : "#3b82f6";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

// XSS Protection
function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// Avatar Initials Helper
function getInitials(name) {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Department Style Classifier
function getDeptClass(dept) {
  const lower = String(dept || "").toLowerCase();
  if (lower.includes("comp")) return "comp";
  if (lower.includes("mech")) return "mech";
  if (lower.includes("civil")) return "civil";
  return "";
}

// Grade Badge Generator
function getGradeBadge(total) {
  if (total == null || total === "—") return `<span class="status-badge" style="background:#f1f5f9;color:#64748b;">Pending</span>`;
  const score = Number(total);
  if (score >= 75) return `<span class="status-badge Present" title=">= 75%">Distinction</span>`;
  if (score >= 60) return `<span class="status-badge" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;" title="60-74%">First Class</span>`;
  if (score >= 50) return `<span class="status-badge Late" title="50-59%">Second Class</span>`;
  if (score >= 40) return `<span class="status-badge" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;" title="40-49%">Pass Class</span>`;
  return `<span class="status-badge Absent" title="< 40%">Needs Re-exam</span>`;
}

// Study Year Roman / Label Formatter
function formatStudyYear(yearNum) {
  const map = { 1: "FE (1st Year)", 2: "SE (2nd Year)", 3: "TE (3rd Year)", 4: "BE (4th Year)" };
  return map[yearNum] || `Year ${yearNum}`;
}

// Page Navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = $(`${page}-page`);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.page === page));

  const titles = {
    dashboard: "Institutional Dashboard",
    students: "Student Records Directory",
    academics: "Academic Structure & Sections",
    courses: "Course Catalogue & Offerings",
    enrollments: "Student Enrollments & Marks",
    attendance: "Daily Class Attendance Register",
    queries: "Academic Reports & Student Inquiries"
  };

  const breadcrumbs = {
    dashboard: "Dashboard",
    students: "Students",
    academics: "Academic Structure",
    courses: "Courses",
    enrollments: "Enrollments & Marks",
    attendance: "Attendance Register",
    queries: "Reports & Inquiries"
  };

  if ($("page-title")) $("page-title").textContent = titles[page] || "Dashboard";
  if ($("breadcrumb-current")) $("breadcrumb-current").textContent = breadcrumbs[page] || page;

  window.location.hash = page;

  if (page === "dashboard") loadDashboard();
  if (page === "students") loadStudents();
  if (page === "academics") loadAcademics();
  if (page === "courses") loadCourses();
  if (page === "enrollments") loadEnrollments();
  if (page === "attendance") loadAttendance();
  if (page === "queries") loadQueries();
}

// Attach Nav Links
document.querySelectorAll(".nav-link").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  showPage(a.dataset.page);
}));

// ==========================================================================
// Module: Dashboard
// ==========================================================================
async function loadDashboard() {
  try {
    const data = await api("/dashboard");
    $("stat-students").textContent = data.totals.students;
    $("stat-departments").textContent = data.totals.departments;
    $("stat-sections").textContent = data.totals.sections;
    $("stat-courses").textContent = data.totals.courses;
    if ($("stat-attendance-rate")) $("stat-attendance-rate").textContent = data.totals.attendanceRate || "77.8%";

    const rows = data.divisionCounts || [];
    $("division-stats").innerHTML = rows.map(r => `
      <tr>
        <td>
          <span class="dept-pill ${getDeptClass(r.department_name)}">${safe(r.department_name)}</span>
        </td>
        <td><strong>${formatStudyYear(r.study_year)}</strong></td>
        <td><span class="division-badge">Division ${safe(r.division)}</span></td>
        <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">${safe(r.year_label)}</span></td>
        <td class="text-right">
          <strong style="font-family:var(--font-mono);font-size:14px;color:var(--text-main);">${r.student_count}</strong>
          <span style="font-size:11px;color:var(--text-muted);margin-left:3px;">students</span>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="empty">No division data recorded in database.</td></tr>`;
  } catch (e) {
    notify(e.message, true);
  }
}

// ==========================================================================
// Module: Students Directory
// ==========================================================================
async function loadStudents() {
  try {
    const [students, sections, departments] = await Promise.all([
      api("/students"),
      api("/sections"),
      api("/departments")
    ]);
    studentsCache = students;
    sectionsCache = sections;
    departmentsCache = departments;

    // Populate Department Filter dropdown
    const filterDept = $("filter-dept");
    if (filterDept && filterDept.options.length <= 1) {
      filterDept.innerHTML = `<option value="">All Departments</option>` +
        departments.map(d => `<option value="${safe(d.department_name)}">${safe(d.department_name)}</option>`).join("");
    }

    renderStudentsTable(studentsCache);
  } catch (e) {
    notify(e.message, true);
  }
}

function renderStudentsTable(list) {
  $("students-table").innerHTML = list.map(s => {
    const initials = getInitials(s.full_name);
    return `
      <tr>
        <td><span class="roll-badge">${safe(s.roll_no)}</span></td>
        <td>
          <div class="cell-student-group">
            <div class="cell-avatar accent">${initials}</div>
            <div class="cell-name-box">
              <strong>${safe(s.full_name)}</strong>
              <div class="cell-contact-meta">
                <span>${safe(s.email || "No email recorded")}</span>
                ${s.phone ? `<span>· 📞 ${safe(s.phone)}</span>` : ""}
              </div>
            </div>
          </div>
        </td>
        <td><span class="dept-pill ${getDeptClass(s.department_name)}">${safe(s.department_name)}</span></td>
        <td><span class="division-badge">Yr ${s.study_year} · Div ${safe(s.division)}</span></td>
        <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">${safe(s.year_label)}</span></td>
        <td class="text-right">
          <button class="action-btn-sm" onclick="editStudent(${s.student_id})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit
          </button>
          <button class="action-btn-sm danger" onclick="deleteStudent(${s.student_id})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="6" class="empty">No matching student records found.</td></tr>`;
}

// Student Search & Filter
function filterStudentList() {
  const query = ($("student-search")?.value || "").toLowerCase().trim();
  const selectedDept = $("filter-dept")?.value || "";
  const selectedYear = $("filter-year")?.value || "";

  const filtered = studentsCache.filter(s => {
    const matchesSearch = !query ||
      String(s.roll_no).toLowerCase().includes(query) ||
      String(s.full_name).toLowerCase().includes(query) ||
      String(s.email || "").toLowerCase().includes(query);
    const matchesDept = !selectedDept || s.department_name === selectedDept;
    const matchesYear = !selectedYear || String(s.study_year) === selectedYear;
    return matchesSearch && matchesDept && matchesYear;
  });

  renderStudentsTable(filtered);
}

$("student-search")?.addEventListener("input", filterStudentList);

// Student Modal Functions
function openStudentModal(student = null) {
  $("student-form").reset();
  $("student-id").value = student?.student_id || "";
  $("modal-title").textContent = student ? "Edit Student Profile" : "Register Student";
  $("roll-no").value = student?.roll_no || "";
  $("full-name").value = student?.full_name || "";
  $("email").value = student?.email || "";
  $("phone").value = student?.phone || "";
  $("admission-year").value = student?.admission_year || new Date().getFullYear();

  // Populate sections dropdown
  $("section-id").innerHTML = sectionsCache.map(s => `
    <option value="${s.section_id}" ${student && student.section_id === s.section_id ? "selected" : ""}>
      ${safe(s.department_name)} · Year ${s.study_year} · Div ${safe(s.division)} (${safe(s.year_label)})
    </option>
  `).join("");

  if (student && student.section_id) {
    $("section-id").value = student.section_id;
  }

  $("modal-backdrop").classList.remove("hidden");
}

function closeModal() {
  $("modal-backdrop").classList.add("hidden");
}

$("add-student-btn")?.addEventListener("click", async () => {
  if (!sectionsCache.length) sectionsCache = await api("/sections");
  openStudentModal();
});
$("close-modal")?.addEventListener("click", closeModal);
$("cancel-modal")?.addEventListener("click", closeModal);
$("modal-backdrop")?.addEventListener("click", e => {
  if (e.target.id === "modal-backdrop") closeModal();
});

window.editStudent = async (id) => {
  if (!sectionsCache.length) sectionsCache = await api("/sections");
  const student = studentsCache.find(s => s.student_id === id);
  if (student) openStudentModal(student);
};

window.deleteStudent = async (id) => {
  const student = studentsCache.find(s => s.student_id === id);
  const promptName = student ? `${student.full_name} (${student.roll_no})` : "this student";
  if (!confirm(`Are you sure you want to delete ${promptName}?\n\nNote: If this student has existing enrollments, the relational database RESTRICT constraint will reject the deletion to preserve data integrity.`)) return;

  try {
    await api(`/students/${id}`, { method: "DELETE" });
    notify("Student record deleted successfully.");
    await loadStudents();
    loadDashboard();
  } catch (e) {
    notify(e.message, true);
  }
};

$("student-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("student-id").value;
  const payload = {
    roll_no: $("roll-no").value.trim(),
    full_name: $("full-name").value.trim(),
    email: $("email").value.trim() || null,
    phone: $("phone").value.trim() || null,
    admission_year: $("admission-year").value ? Number($("admission-year").value) : null,
    section_id: Number($("section-id").value)
  };

  try {
    await api(id ? `/students/${id}` : "/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    notify(id ? "Student profile updated." : "Student registered successfully.");
    await loadStudents();
    loadDashboard();
  } catch (err) {
    notify(err.message, true);
  }
});

// ==========================================================================
// Module: Academic Structure
// ==========================================================================
async function loadAcademics() {
  try {
    const [sections, departments] = await Promise.all([
      api("/sections"),
      api("/departments")
    ]);
    sectionsCache = sections;
    departmentsCache = departments;

    $("sections-table").innerHTML = sections.map(s => `
      <tr>
        <td><span class="dept-pill ${getDeptClass(s.department_name)}">${safe(s.department_name)}</span></td>
        <td><strong>${formatStudyYear(s.study_year)}</strong></td>
        <td><span class="division-badge">Division ${safe(s.division)}</span></td>
        <td><span style="font-family:var(--font-mono);">${safe(s.year_label)}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="4" class="empty">No class sections recorded.</td></tr>`;

    $("departments-table").innerHTML = departments.map(d => `
      <tr>
        <td><strong style="font-family:var(--font-mono);">${safe(d.department_code)}</strong></td>
        <td>${safe(d.department_name)}</td>
        <td><span style="font-family:var(--font-mono);color:var(--text-muted);">${d.department_id}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="empty">No departments recorded.</td></tr>`;
  } catch (e) {
    notify(e.message, true);
  }
}

// ==========================================================================
// Module: Courses & Offerings
// ==========================================================================
async function loadCourses() {
  try {
    const [courses, offerings] = await Promise.all([
      api("/courses"),
      api("/offerings")
    ]);
    coursesCache = courses;
    offeringsCache = offerings;

    $("courses-table").innerHTML = courses.map(c => `
      <tr>
        <td><span class="roll-badge">${safe(c.course_code)}</span></td>
        <td><strong>${safe(c.course_name)}</strong></td>
        <td><span class="credits-badge">${c.credits} Credits</span></td>
        <td><span class="dept-pill ${getDeptClass(c.department_name)}">${safe(c.department_name)}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="4" class="empty">No courses found.</td></tr>`;

    $("offerings-table").innerHTML = offerings.map(o => `
      <tr>
        <td><strong>${safe(o.course_code)}</strong> — ${safe(o.course_name)}</td>
        <td><span class="dept-pill ${getDeptClass(o.department_name)}">${safe(o.department_name)}</span></td>
        <td><span class="division-badge">Yr ${o.study_year} · Div ${safe(o.division)}</span></td>
        <td><span style="font-family:var(--font-mono);">${safe(o.year_label)}</span></td>
        <td><span class="credits-badge">Semester ${o.semester}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="empty">No offerings scheduled.</td></tr>`;
  } catch (e) {
    notify(e.message, true);
  }
}

// ==========================================================================
// Module: Enrollments & Marks (Real Modal, No Prompt!)
// ==========================================================================
async function loadEnrollments() {
  try {
    enrollmentsCache = await api("/enrollments");
    $("enrollments-table").innerHTML = enrollmentsCache.map(e => {
      const hasMarks = e.internal_marks != null && e.external_marks != null;
      const total = hasMarks ? (Number(e.internal_marks) + Number(e.external_marks)).toFixed(2) : "—";
      return `
        <tr>
          <td><span class="roll-badge">${safe(e.roll_no)}</span></td>
          <td><strong>${safe(e.full_name)}</strong></td>
          <td><strong>${safe(e.course_code)}</strong> <span style="color:var(--text-muted);font-size:12px;">(${safe(e.course_name)})</span></td>
          <td><span class="credits-badge">Sem ${e.semester}</span></td>
          <td><span class="marks-score">${e.internal_marks ?? "—"}</span></td>
          <td><span class="marks-score">${e.external_marks ?? "—"}</span></td>
          <td><strong class="marks-score" style="color:var(--primary);">${total}</strong></td>
          <td>${getGradeBadge(total)}</td>
          <td class="text-right">
            <button class="action-btn-sm" onclick="openMarksModal(${e.enrollment_id})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Update Marks
            </button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="9" class="empty">No student enrollments found.</td></tr>`;
  } catch (e) {
    notify(e.message, true);
  }
}

// Enrollment Creation Modal
$("add-enrollment-btn")?.addEventListener("click", async () => {
  try {
    const [students, offerings] = await Promise.all([api("/students"), api("/offerings")]);
    $("enroll-student").innerHTML = students.map(s => `
      <option value="${s.student_id}">${safe(s.roll_no)} — ${safe(s.full_name)} (${safe(s.department_name)} Yr ${s.study_year} Div ${safe(s.division)})</option>
    `).join("");

    $("enroll-offering").innerHTML = offerings.map(o => `
      <option value="${o.offering_id}">${safe(o.course_code)}: ${safe(o.course_name)} [${safe(o.department_name)} Yr ${o.study_year} Div ${safe(o.division)} · Sem ${o.semester}]</option>
    `).join("");

    $("enrollment-form").reset();
    $("enrollment-modal").classList.remove("hidden");
  } catch (e) {
    notify(e.message, true);
  }
});

$("enrollment-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    student_id: $("enroll-student").value,
    offering_id: $("enroll-offering").value,
    internal_marks: $("enroll-internal").value || null,
    external_marks: $("enroll-external").value || null
  };
  try {
    await api("/enrollments", { method: "POST", body: JSON.stringify(payload) });
    $("enrollment-modal").classList.add("hidden");
    notify("Enrollment record created successfully.");
    loadEnrollments();
    loadDashboard();
  } catch (err) {
    notify(err.message, true);
  }
});

// Update Marks Modal (Replaces old prompt)
window.openMarksModal = (enrollmentId) => {
  const row = enrollmentsCache.find(e => e.enrollment_id === enrollmentId);
  if (!row) return;

  $("marks-enrollment-id").value = row.enrollment_id;
  $("marks-student-name").textContent = row.full_name;
  $("marks-roll-no").textContent = `Roll ${row.roll_no}`;
  $("marks-course-info").textContent = `${row.course_code} — ${row.course_name} (Semester ${row.semester})`;

  $("modal-internal-marks").value = row.internal_marks ?? "";
  $("modal-external-marks").value = row.external_marks ?? "";
  updateTotalPreview();

  $("marks-modal").classList.remove("hidden");
};

function updateTotalPreview() {
  const intVal = parseFloat($("modal-internal-marks").value);
  const extVal = parseFloat($("modal-external-marks").value);
  if (!isNaN(intVal) && !isNaN(extVal)) {
    $("marks-total-preview").textContent = (intVal + extVal).toFixed(2);
  } else if (!isNaN(intVal)) {
    $("marks-total-preview").textContent = `${intVal.toFixed(2)} (Internal only)`;
  } else if (!isNaN(extVal)) {
    $("marks-total-preview").textContent = `${extVal.toFixed(2)} (External only)`;
  } else {
    $("marks-total-preview").textContent = "—";
  }
}

$("modal-internal-marks")?.addEventListener("input", updateTotalPreview);
$("modal-external-marks")?.addEventListener("input", updateTotalPreview);

$("marks-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("marks-enrollment-id").value;
  const internal = $("modal-internal-marks").value;
  const external = $("modal-external-marks").value;

  try {
    await api(`/enrollments/${id}/marks`, {
      method: "PUT",
      body: JSON.stringify({ internal_marks: internal, external_marks: external })
    });
    $("marks-modal").classList.add("hidden");
    notify("Examination marks updated successfully.");
    loadEnrollments();
    loadDashboard();
  } catch (err) {
    notify(err.message, true);
  }
});

// Fast Lecture Attendance State
let activeRosterCache = [];
let activeOfferingMeta = null;

// ==========================================================================
// Module: Fast Lecture Attendance Register
// ==========================================================================
async function loadAttendance() {
  try {
    // Set default date to today
    const dateInput = $("fast-att-date");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    // Populate course offerings dropdown for fast lecture marking
    if (!offeringsCache.length) offeringsCache = await api("/offerings");
    const fastSelect = $("fast-att-offering");
    if (fastSelect) {
      const currentSelected = fastSelect.value;
      fastSelect.innerHTML = offeringsCache.map(o => `
        <option value="${o.offering_id}" ${currentSelected == o.offering_id ? "selected" : ""}>
          ${safe(o.course_code)}: ${safe(o.course_name)} [${safe(o.department_name)} Yr ${o.study_year} Div ${safe(o.division)} · Sem ${o.semester}]
        </option>
      `).join("");
    }

    // Load active class roster
    await loadOfferingRoster();

    // Load historical attendance logs
    attendanceCache = await api("/attendance");
    renderAttendanceHistory(attendanceCache);
  } catch (e) {
    notify(e.message, true);
  }
}

// Load Roster for Selected Lecture
window.loadOfferingRoster = async () => {
  const offeringSelect = $("fast-att-offering");
  const dateInput = $("fast-att-date");
  if (!offeringSelect || !offeringSelect.value) return;

  const offeringId = offeringSelect.value;
  const date = dateInput?.value || new Date().toISOString().slice(0, 10);

  try {
    const data = await api(`/offerings/${offeringId}/roster?date=${date}`);
    activeRosterCache = data.students || [];
    activeOfferingMeta = data.offering;

    // Update Class Header
    if (activeOfferingMeta) {
      $("roster-offering-name").textContent = `${activeOfferingMeta.course_code} — ${activeOfferingMeta.course_name}`;
      $("roster-offering-meta").textContent = ` · ${activeOfferingMeta.department_name} · Year ${activeOfferingMeta.study_year} · Division ${activeOfferingMeta.division} · Semester ${activeOfferingMeta.semester} (${activeRosterCache.length} enrolled)`;
    }

    renderFastRoster();
  } catch (err) {
    notify(err.message, true);
  }
};

// Render Fast Roster Rows
function renderFastRoster() {
  const tbody = $("fast-roster-tbody");
  if (!tbody) return;

  if (!activeRosterCache.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No students are currently enrolled in this course offering.</td></tr>`;
    updateRosterCounters();
    return;
  }

  tbody.innerHTML = activeRosterCache.map(s => {
    const initials = getInitials(s.full_name);
    const status = s.current_status || "Present";
    return `
      <tr>
        <td><span class="roll-badge">${safe(s.roll_no)}</span></td>
        <td>
          <div class="cell-student-group">
            <div class="cell-avatar">${initials}</div>
            <strong style="color:var(--text-main);font-size:13.5px;">${safe(s.full_name)}</strong>
          </div>
        </td>
        <td><span style="font-size:12px;color:var(--text-muted);">${safe(s.email || "No email")}</span></td>
        <td class="text-right">
          <div class="toggle-btn-group">
            <button type="button" class="att-toggle-btn present ${status === 'Present' ? 'active' : ''}" onclick="toggleStudentAtt(${s.enrollment_id}, 'Present')">
              ✓ Present
            </button>
            <button type="button" class="att-toggle-btn absent ${status === 'Absent' ? 'active' : ''}" onclick="toggleStudentAtt(${s.enrollment_id}, 'Absent')">
              ✕ Absent
            </button>
            <button type="button" class="att-toggle-btn late ${status === 'Late' ? 'active' : ''}" onclick="toggleStudentAtt(${s.enrollment_id}, 'Late')">
              ◷ Late
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  updateRosterCounters();
}

// Toggle individual student attendance
window.toggleStudentAtt = (enrollmentId, newStatus) => {
  const student = activeRosterCache.find(s => s.enrollment_id === enrollmentId);
  if (student) {
    student.current_status = newStatus;
    renderFastRoster();
  }
};

// Batch Action: Mark All Present or Absent
window.setAllAttendance = (newStatus) => {
  activeRosterCache.forEach(s => {
    s.current_status = newStatus;
  });
  renderFastRoster();
  notify(`Marked all ${activeRosterCache.length} students as ${newStatus}.`);
};

// Update Attendance Counters
function updateRosterCounters() {
  const presentCount = activeRosterCache.filter(s => s.current_status === "Present").length;
  const absentCount = activeRosterCache.filter(s => s.current_status === "Absent").length;
  const lateCount = activeRosterCache.filter(s => s.current_status === "Late").length;

  if ($("count-present")) $("count-present").textContent = `${presentCount} Present`;
  if ($("count-absent")) $("count-absent").textContent = `${absentCount} Absent`;
  if ($("count-late")) $("count-late").textContent = `${lateCount} Late`;

  const saveBtn = $("btn-save-batch-attendance");
  if (saveBtn) {
    saveBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Save Lecture Attendance (${presentCount}P / ${absentCount}A)`;
  }
}

// Submit Fast Batch Attendance
window.submitBatchAttendance = async () => {
  if (!activeRosterCache.length) {
    notify("No enrolled students in this lecture to save.", true);
    return;
  }

  const dateInput = $("fast-att-date");
  const date = dateInput?.value || new Date().toISOString().slice(0, 10);
  const saveBtn = $("btn-save-batch-attendance");

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving lecture attendance...";

  try {
    const payload = {
      attendance_date: date,
      records: activeRosterCache.map(s => ({
        enrollment_id: s.enrollment_id,
        status: s.current_status || "Present"
      }))
    };

    const res = await api("/attendance/batch", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    notify(res.message || `Saved attendance for ${activeRosterCache.length} students!`);

    // Refresh history logs and dashboard compliance metrics
    attendanceCache = await api("/attendance");
    renderAttendanceHistory(attendanceCache);
    loadDashboard();
  } catch (err) {
    notify(err.message, true);
  } finally {
    saveBtn.disabled = false;
    updateRosterCounters();
  }
};

// Render Attendance Logs History
function renderAttendanceHistory(list) {
  $("attendance-table").innerHTML = list.map(a => `
    <tr>
      <td><strong style="font-family:var(--font-mono);">${safe(a.attendance_date).slice(0, 10)}</strong></td>
      <td><span class="roll-badge">${safe(a.roll_no)}</span></td>
      <td><strong>${safe(a.full_name)}</strong></td>
      <td><strong>${safe(a.course_code)}</strong> <span style="color:var(--text-muted);font-size:12px;">(${safe(a.course_name)})</span></td>
      <td><span class="status-badge ${safe(a.status)}">${safe(a.status)}</span></td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="empty">No attendance records found.</td></tr>`;
}

// Filter Attendance History Table
window.filterAttendanceTable = () => {
  const query = ($("att-filter-search")?.value || "").toLowerCase().trim();
  const selectedStatus = $("att-filter-status")?.value || "";

  const filtered = attendanceCache.filter(a => {
    const matchesSearch = !query ||
      String(a.roll_no).toLowerCase().includes(query) ||
      String(a.full_name).toLowerCase().includes(query) ||
      String(a.course_code).toLowerCase().includes(query);
    const matchesStatus = !selectedStatus || a.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  renderAttendanceHistory(filtered);
};

// Single Entry Modal (Exception Case)
$("add-attendance-btn")?.addEventListener("click", async () => {
  try {
    const enrollments = await api("/enrollments");
    $("attendance-enrollment").innerHTML = enrollments.map(e => `
      <option value="${e.enrollment_id}">${safe(e.roll_no)} — ${safe(e.full_name)} · ${safe(e.course_code)}</option>
    `).join("");
    $("attendance-date").value = new Date().toISOString().slice(0, 10);
    $("attendance-modal").classList.remove("hidden");
  } catch (e) {
    notify(e.message, true);
  }
});

$("attendance-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    enrollment_id: $("attendance-enrollment").value,
    attendance_date: $("attendance-date").value,
    status: $("attendance-status").value
  };
  try {
    await api("/attendance", { method: "POST", body: JSON.stringify(payload) });
    $("attendance-modal").classList.add("hidden");
    notify("Attendance record saved.");
    loadAttendance();
    loadDashboard();
  } catch (err) {
    notify(err.message, true);
  }
});

// ==========================================================================
// Module: Academic Reports & Student Inquiries (Institutional Console)
// ==========================================================================
async function loadQueries() {
  try {
    queriesCache = await api("/queries");
    renderQueriesList();
    selectQuery(activeQueryId);
  } catch (e) {
    notify(e.message, true);
  }
}

function renderQueriesList() {
  const container = $("queries-nav-list");
  if (!container) return;

  container.innerHTML = queriesCache.map(q => `
    <div class="query-nav-item ${q.id === activeQueryId ? "active" : ""}" onclick="selectQuery('${q.id}')">
      <span class="query-item-badge">${safe(q.category)}</span>
      <span class="query-item-title">${safe(q.title)}</span>
    </div>
  `).join("");
}

window.selectQuery = (queryId) => {
  activeQueryId = queryId;
  const q = queriesCache.find(item => item.id === queryId);
  if (!q) return;

  renderQueriesList();

  $("active-query-title").textContent = q.title;
  $("active-query-category").textContent = q.category;
  $("active-query-concept").textContent = q.concept;
  $("active-query-desc").textContent = q.description;
  $("active-query-sql").textContent = q.sql;

  $("query-exec-time").textContent = "Ready to execute";
  $("query-exec-time").style.background = "#eff6ff";
  $("query-exec-time").style.color = "#1d4ed8";
  $("query-row-count").textContent = "Awaiting execution";

  $("query-result-thead").innerHTML = `<tr><th>Status</th></tr>`;
  $("query-result-tbody").innerHTML = `<tr><td class="empty">Click "Generate Report" above to fetch live database results.</td></tr>`;
};

window.executeActiveQuery = async () => {
  const btn = $("btn-run-query");
  btn.disabled = true;
  btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">↻</span> Executing...`;

  try {
    const result = await api("/queries/run", {
      method: "POST",
      body: JSON.stringify({ queryId: activeQueryId })
    });

    $("query-exec-time").textContent = `Execution: ${result.executionTimeMs} ms`;
    $("query-exec-time").style.background = "#ecfdf5";
    $("query-exec-time").style.color = "#047857";
    $("query-row-count").textContent = `${result.rowCount} row${result.rowCount === 1 ? "" : "s"} returned`;

    // Render Table Header
    const cols = result.columns || [];
    $("query-result-thead").innerHTML = `<tr>${cols.map(c => `<th>${safe(c)}</th>`).join("")}</tr>`;

    // Render Table Rows
    const rows = result.rows || [];
    if (!rows.length) {
      $("query-result-tbody").innerHTML = `<tr><td colspan="${cols.length || 1}" class="empty">Query executed successfully. 0 rows returned.</td></tr>`;
    } else {
      $("query-result-tbody").innerHTML = rows.map(r => `
        <tr>
          ${cols.map(c => `<td><strong>${safe(r[c] ?? "NULL")}</strong></td>`).join("")}
        </tr>
      `).join("");
    }

    notify(`Executed ${result.query.title} in ${result.executionTimeMs} ms.`);
  } catch (err) {
    $("query-exec-time").textContent = "Execution Error";
    $("query-exec-time").style.background = "#fef2f2";
    $("query-exec-time").style.color = "#b91c1c";
    $("query-result-tbody").innerHTML = `<tr><td class="empty" style="color:#dc2626;">Error executing SQL: ${safe(err.message)}</td></tr>`;
    notify(err.message, true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Execute Query`;
  }
};

window.copyActiveSQL = () => {
  const sql = $("active-query-sql").textContent;
  navigator.clipboard.writeText(sql).then(() => {
    notify("SQL copied to clipboard.");
  }).catch(() => {
    notify("Failed to copy SQL.", true);
  });
};

// ==========================================================================
// Global Listeners & Modal Dismissal
// ==========================================================================
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => {
    const modalId = btn.dataset.close;
    if (modalId && $(modalId)) $(modalId).classList.add("hidden");
  });
});

// Dismiss on backdrop click
document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.add("hidden");
  });
});

// Escape key closes modals
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden"));
  }
});

// Handle initial route from URL hash
window.addEventListener("DOMContentLoaded", () => {
  const hash = (window.location.hash || "").replace("#", "");
  const validPages = ["dashboard", "students", "academics", "courses", "enrollments", "attendance", "queries"];
  showPage(validPages.includes(hash) ? hash : "dashboard");
});
