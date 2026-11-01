# Database normalization — Student Management System

The database is designed to satisfy 3NF for the intended relational model.

## Unnormalized example

A single flat table containing roll number, student name, department name, division, course name, faculty and marks would repeat student, department and course details for every course record. This creates redundancy and insertion, update and deletion anomalies.

## First Normal Form (1NF)

A relation is in 1NF when each attribute contains a single atomic value and there are no repeating groups.

In this project:
- A student has one value in each student attribute.
- A course is stored as one row in `courses`.
- Each enrollment is one student-course-offering association.
- Each attendance row records one enrollment on one date.

## Second Normal Form (2NF)

A relation is in 2NF when it is in 1NF and every non-prime attribute is fully functionally dependent on every candidate key; no non-key attribute depends on only part of a composite candidate key.

The design separates student details, course details and enrollment details:
- `student_id` identifies student attributes.
- `course_id` identifies course attributes.
- `enrollment_id` identifies marks for a student and offering.
- `UNIQUE(student_id, offering_id)` prevents duplicate enrollment pairs.

This avoids storing student names or course names in the enrollment relation.

## Third Normal Form (3NF)

A relation is in 3NF when it is in 2NF and non-key attributes do not have inappropriate transitive dependencies on candidate keys.

Examples:
- Department names are stored in `departments`, not repeated in `students`.
- Division, study year and academic-year references are stored in `class_sections`.
- Course names and credits are stored in `courses`, not repeated in enrollments.
- Attendance facts are stored in `attendance`, separately from student and course details.

## Anomalies avoided

- Update anomaly: changing a department name requires one update in `departments`.
- Insertion anomaly: a course or academic year can be recorded before students enroll.
- Deletion anomaly: deleting an enrollment does not delete the course definition.

## Important viva nuance

Normalization depends on the functional dependencies and candidate keys of the actual requirements. The schema uses surrogate primary keys for straightforward referencing and UNIQUE constraints for natural business rules. It is designed for 3NF under the assumptions described in the ER model.
