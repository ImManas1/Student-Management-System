# CampusCore SIS — Student Information & Academic Management System

> **DBMS Mini Project** built on **MySQL 8.0**, **Node.js / Express**, and vanilla HTML5, CSS3, and modern JavaScript.  
> Designed with an institutional user experience, strict 3NF relational architecture, and an interactive live SQL Query Explorer.

---

## 🌟 Key Highlights & Legit Institutional Identity

- **Legitimate University Identity:** Branded as **CampusCore SIS** (Academic Portal & Registrar Management Console).
- **Clean, Authentic UI:** Designed like enterprise college administrative software (Banner, Slate, Ellucian) — free of generic AI SaaS gimmicks.
- **Interactive DBMS Live SQL Explorer:** Live console executing and demonstrating 12 core DBMS syllabus SQL queries (Inner Joins, Left Outer Joins, Group By with Having, Subqueries, Views, Transactions) directly against MySQL.
- **Marks Assessment Modal:** Dedicated examination score editor with live total calculation and grade badge generation (Distinction / First Class / Second Class / Pass Class / Re-exam) — completely replacing primitive prompt popups.
- **Comprehensive Database Handbook:** See [DATABASE_UNDERSTANDING.md](file:///c:/Users/manas/Downloads/Student_Management_System_DBMS_Mini_Project/student-management-system/DATABASE_UNDERSTANDING.md) for complete ER diagrams, data dictionary, step-by-step 3NF normalization, relational constraints, and 30+ viva examination questions.

---

## 📋 Features & Modules

1. **Institutional Dashboard:**
   - 5 KPI summary cards: Total Students, Departments, Class Sections, Course Catalogue, and College Attendance Compliance Rate.
   - Class Section Enrollment Roster displaying strength by branch, year, and division.
   - Architecture highlights overview explaining 3NF, Foreign Keys, Composite Keys, and CHECK constraints.

2. **Student Records Directory:**
   - Instant search by roll number, name, or email.
   - Live filters by Academic Department (COMP, MECH, CIVIL) and Study Year (FE, SE, TE, BE).
   - Student profiles with initials avatar badges, roll number tags, contact info, and actions.
   - Student Registration & Profile Editing modal.
   - One-click institutional printable roster view (`window.print`).

3. **Academic Structure & Sections:**
   - Class sections identified by the composite tuple `(department_id, academic_year_id, study_year, division)`.
   - Department directory with unique branch codes.

4. **Course Catalogue & Offerings:**
   - Course master records with credit ratings.
   - Active section-wise semester offerings mapping courses to specific student cohorts.

5. **Student Enrollments & Marks Ledger:**
   - Multi-course registrations per student.
   - Internal assessment score, external exam score, and automatic total score calculation.
   - Visual academic performance grading tags.
   - Dedicated **Update Examination Marks** modal with live score preview.

6. **Daily Attendance Register:**
   - Session date tracking linked directly to course enrollments.
   - Status indicators (`Present`, `Absent`, `Late`).
   - Attendance recording modal with automated date population.

7. **DBMS Relational Query Console (Live Syllabus Showcase):**
   - 12 curated queries covering Inner Joins, Outer Joins, Aggregation, Subqueries, Views, and Transactions.
   - Real-time execution timer displaying exact execution speed in milliseconds (`~2.5 ms`).
   - Formatted SQL code inspection with copy-to-clipboard functionality.
   - Dynamic results table rendering live rows directly from MySQL.

---

## 🚀 Quick Setup & Installation

### 1. Requirements
- **Node.js** v18 or later
- **MySQL Server** 8.0 or later

### 2. Database Initialization
Open MySQL Workbench or the MySQL command line and run:
```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

### 3. Application Configuration
Ensure your `.env` file in the project root matches your MySQL credentials:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_management
```

### 4. Install Dependencies & Start Server
```bash
# Install dependencies
npm install

# Start production server
npm start

# Or start with live reload
npm run dev
```

Visit in your web browser:
```
http://localhost:3000
```

Verify backend and database connectivity:
```
http://localhost:3000/api/health
```

---

## 🗄️ Database Architecture & Documentation

Comprehensive documentation is provided in the project repository:

| Document | Purpose |
|---|---|
| [DATABASE_UNDERSTANDING.md](file:///c:/Users/manas/Downloads/Student_Management_System_DBMS_Mini_Project/student-management-system/DATABASE_UNDERSTANDING.md) | **Master Database Handbook**: ER Model, Data Dictionary, 3NF Normalization, 12 Queries, Indexing & 30+ Viva Questions |
| [docs/ER_DIAGRAM.md](file:///c:/Users/manas/Downloads/Student_Management_System_DBMS_Mini_Project/student-management-system/docs/ER_DIAGRAM.md) | Conceptual Entity-Relationship Diagram |
| [docs/NORMALIZATION.md](file:///c:/Users/manas/Downloads/Student_Management_System_DBMS_Mini_Project/student-management-system/docs/NORMALIZATION.md) | 1NF, 2NF, 3NF functional dependency proofs |
| [docs/PROJECT_REPORT.md](file:///c:/Users/manas/Downloads/Student_Management_System_DBMS_Mini_Project/student-management-system/docs/PROJECT_REPORT.md) | Formal Mini Project Report |
| [docs/VIVA_QUESTIONS.md](file:///c:/Users/manas/Downloads/Student_Management_System_DBMS_Mini_Project/student-management-system/docs/VIVA_QUESTIONS.md) | Quick Viva Voce Revision Sheet |

---

## 🌐 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Test MySQL connection status & version |
| `GET` | `/api/dashboard` | Dashboard totals, marks average & attendance rate |
| `GET` | `/api/students` | List/search students with department & section |
| `POST` | `/api/students` | Register a new student |
| `PUT` | `/api/students/:id` | Update student profile |
| `DELETE` | `/api/students/:id` | Delete student (enforced by `RESTRICT` rule) |
| `GET` | `/api/departments` | List academic departments |
| `GET` | `/api/sections` | List class sections |
| `GET` | `/api/courses` | List courses and credits |
| `GET` | `/api/offerings` | List semester-wise course offerings |
| `GET` | `/api/enrollments` | List enrollments and examination marks |
| `POST` | `/api/enrollments` | Create course enrollment |
| `PUT` | `/api/enrollments/:id/marks` | Update internal & external examination marks |
| `GET` | `/api/attendance` | List attendance session logs |
| `POST` | `/api/attendance` | Record daily class attendance |
| `GET` | `/api/queries` | List 12 curated DBMS project queries |
| `POST` | `/api/queries/run` | Execute selected syllabus SQL query live |

---
*Developed for DBMS Mini Project · CampusCore SIS*
