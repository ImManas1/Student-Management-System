# CampusCore SIS — Mini Project Report

## Abstract
**CampusCore SIS** is an institutional academic information and student records system designed to maintain student profiles, academic departments, academic years, class divisions, course curricula, enrollments, marks and daily attendance registers. It uses MySQL 8.0 for relational data storage and Node.js/Express for backend API operations, with modern HTML5, CSS3 and JavaScript for an authentic, real-life administrative user interface. Full database architecture and 3NF proofs are documented in `../DATABASE_UNDERSTANDING.md`.

## Problem Statement
Maintaining student details, divisions, course registrations, marks and attendance in separate manual records can cause duplication, inconsistency and difficulty retrieving information. The proposed system centralizes these records in a normalized relational database.

## Objectives
- Maintain student and department information.
- Represent divisions A/B/C within departments and academic years.
- Manage courses and section-wise semester offerings.
- Record student enrollments, marks and attendance.
- Demonstrate relational design, keys, constraints, joins, aggregation and normalization.

## Software Requirements
- MySQL 8.0+
- Node.js 18+
- Express.js
- HTML5, CSS3, JavaScript
- VS Code / MySQL Workbench

## Modules
1. Dashboard
2. Student management
3. Academic structure (department, academic year, section)
4. Course catalogue and offerings
5. Enrollment and marks
6. Attendance

## Database Design
The database contains eight relations: departments, academic_years, class_sections, students, courses, course_offerings, enrollments and attendance. See `ER_DIAGRAM.md` for the ER model and `../database/schema.sql` for the DDL.

## Normalization
The schema is designed up to 3NF. Atomic values satisfy 1NF. Student, course and enrollment facts are separated to avoid partial dependencies and repeated attributes. Department and class-section details are stored independently to avoid transitive dependencies. See `NORMALIZATION.md` for examples.

## Testing
- Verify `/api/health` returns database status.
- Add, search, update and delete a student.
- Verify duplicate roll numbers are rejected.
- Verify a student can be enrolled in a course offering only once.
- Verify marks outside 0–100 are rejected by database CHECK constraints.
- Record attendance and verify duplicate attendance for the same enrollment/date is rejected.
- Run the sample JOIN and GROUP BY queries in `../database/queries.sql`.

## Future Scope
- Login and role-based access control.
- Student promotion and section-history tracking.
- Faculty and timetable management.
- Configurable assessment maxima and grade calculation.
- Export reports to PDF/Excel.
- Audit logs and backups.

## Conclusion
The project demonstrates how a normalized relational database can support a practical student information workflow. It combines database constraints and SQL operations with a lightweight web interface.
