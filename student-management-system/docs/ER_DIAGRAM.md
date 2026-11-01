# Student Management System — ER model

```mermaid
erDiagram
    DEPARTMENTS ||--o{ CLASS_SECTIONS : contains
    ACADEMIC_YEARS ||--o{ CLASS_SECTIONS : applies_to
    CLASS_SECTIONS ||--o{ STUDENTS : groups
    DEPARTMENTS ||--o{ COURSES : owns
    CLASS_SECTIONS ||--o{ COURSE_OFFERINGS : receives
    COURSES ||--o{ COURSE_OFFERINGS : offered_as
    STUDENTS ||--o{ ENROLLMENTS : has
    COURSE_OFFERINGS ||--o{ ENROLLMENTS : includes
    ENROLLMENTS ||--o{ ATTENDANCE : records

    DEPARTMENTS {
      int department_id PK
      varchar department_code UK
      varchar department_name UK
    }
    ACADEMIC_YEARS {
      int academic_year_id PK
      varchar year_label UK
      date start_date
      date end_date
    }
    CLASS_SECTIONS {
      int section_id PK
      int department_id FK
      int academic_year_id FK
      tinyint study_year
      char division
    }
    STUDENTS {
      int student_id PK
      varchar roll_no UK
      varchar full_name
      varchar email UK
      varchar phone
      year admission_year
      int section_id FK
    }
    COURSES {
      int course_id PK
      varchar course_code UK
      varchar course_name
      tinyint credits
      int department_id FK
    }
    COURSE_OFFERINGS {
      int offering_id PK
      int course_id FK
      int section_id FK
      tinyint semester
    }
    ENROLLMENTS {
      int enrollment_id PK
      int student_id FK
      int offering_id FK
      decimal internal_marks
      decimal external_marks
    }
    ATTENDANCE {
      bigint attendance_id PK
      int enrollment_id FK
      date attendance_date
      enum status
    }
```

## Why the `class_sections` table exists

A division label such as A is not globally unique. Computer Engineering A and Mechanical Engineering A are different sections. A section is therefore identified by the combination of department, academic year, study year and division. The database enforces this with a composite UNIQUE constraint.

## Relationship notes

- Department to Class Section: one-to-many.
- Academic Year to Class Section: one-to-many.
- Class Section to Student: one-to-many.
- Department to Course: one-to-many.
- Course and Class Section are connected through Course Offerings.
- Student and Course Offering are connected through Enrollments.
- Enrollment to Attendance: one-to-many.
