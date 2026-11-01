-- Student Management System
-- MySQL 8.0+
-- Run this file in MySQL Workbench or the MySQL command line.

CREATE DATABASE IF NOT EXISTS student_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE student_management;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS course_offerings;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS class_sections;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(15) NOT NULL UNIQUE,
  department_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE academic_years (
  academic_year_id INT AUTO_INCREMENT PRIMARY KEY,
  year_label VARCHAR(9) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CONSTRAINT chk_academic_dates CHECK (end_date > start_date)
) ENGINE=InnoDB;

-- A section identifies a department + academic year + study year + division.
-- Example: Computer Engineering, 2026-2027, Third Year, Division A.
CREATE TABLE class_sections (
  section_id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  study_year TINYINT UNSIGNED NOT NULL,
  division CHAR(1) NOT NULL,
  CONSTRAINT fk_section_department FOREIGN KEY (department_id)
    REFERENCES departments(department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_section_academic_year FOREIGN KEY (academic_year_id)
    REFERENCES academic_years(academic_year_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_class_section UNIQUE (department_id, academic_year_id, study_year, division),
  CONSTRAINT chk_study_year CHECK (study_year BETWEEN 1 AND 4),
  CONSTRAINT chk_division CHECK (division REGEXP '^[A-Z]$')
) ENGINE=InnoDB;

CREATE TABLE students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  roll_no VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE,
  phone VARCHAR(20),
  admission_year YEAR,
  section_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_section FOREIGN KEY (section_id)
    REFERENCES class_sections(section_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_student_name (full_name),
  INDEX idx_student_section (section_id)
) ENGINE=InnoDB;

CREATE TABLE courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL UNIQUE,
  course_name VARCHAR(120) NOT NULL,
  credits TINYINT UNSIGNED NOT NULL,
  department_id INT NOT NULL,
  CONSTRAINT fk_course_department FOREIGN KEY (department_id)
    REFERENCES departments(department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_course_credits CHECK (credits BETWEEN 1 AND 10)
) ENGINE=InnoDB;

-- A course can be offered to multiple sections and semesters.
CREATE TABLE course_offerings (
  offering_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  section_id INT NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  CONSTRAINT fk_offering_course FOREIGN KEY (course_id)
    REFERENCES courses(course_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_offering_section FOREIGN KEY (section_id)
    REFERENCES class_sections(section_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_course_offering UNIQUE (course_id, section_id, semester),
  CONSTRAINT chk_semester CHECK (semester BETWEEN 1 AND 8)
) ENGINE=InnoDB;

CREATE TABLE enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  offering_id INT NOT NULL,
  internal_marks DECIMAL(5,2),
  external_marks DECIMAL(5,2),
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id)
    REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_enrollment_offering FOREIGN KEY (offering_id)
    REFERENCES course_offerings(offering_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_student_offering UNIQUE (student_id, offering_id),
  CONSTRAINT chk_internal_marks CHECK (internal_marks IS NULL OR internal_marks BETWEEN 0 AND 100),
  CONSTRAINT chk_external_marks CHECK (external_marks IS NULL OR external_marks BETWEEN 0 AND 100),
  INDEX idx_enrollment_offering (offering_id)
) ENGINE=InnoDB;

CREATE TABLE attendance (
  attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Late') NOT NULL DEFAULT 'Present',
  CONSTRAINT fk_attendance_enrollment FOREIGN KEY (enrollment_id)
    REFERENCES enrollments(enrollment_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_attendance_day UNIQUE (enrollment_id, attendance_date),
  INDEX idx_attendance_date (attendance_date)
) ENGINE=InnoDB;
