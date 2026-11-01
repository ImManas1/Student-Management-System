USE defaultdb;

INSERT INTO departments (department_code, department_name) VALUES
('COMP', 'Computer Engineering'),
('MECH', 'Mechanical Engineering'),
('CIVIL', 'Civil Engineering');

INSERT INTO academic_years (year_label, start_date, end_date) VALUES
('2025-2026', '2025-06-01', '2026-05-31'),
('2026-2027', '2026-06-01', '2027-05-31'),
('2027-2028', '2027-06-01', '2028-05-31');

-- Computer Engineering third-year divisions A/B/C for 2026-2027,
-- Mechanical third-year division A, and an older Computer second-year A section.
INSERT INTO class_sections (department_id, academic_year_id, study_year, division) VALUES
(1, 2, 3, 'A'),
(1, 2, 3, 'B'),
(1, 2, 3, 'C'),
(2, 2, 3, 'A'),
(1, 1, 2, 'A');

INSERT INTO students (roll_no, full_name, email, phone, admission_year, section_id) VALUES
('301', 'Rahul Patil', 'rahul.patil@example.com', '9876500001', 2024, 1),
('302', 'Priya Shah', 'priya.shah@example.com', '9876500002', 2024, 2),
('303', 'Amit Joshi', 'amit.joshi@example.com', '9876500003', 2024, 1),
('304', 'Sneha More', 'sneha.more@example.com', '9876500004', 2024, 3),
('305', 'Arjun Deshmukh', 'arjun.d@example.com', '9876500005', 2024, 4),
('201', 'Neha Patil', 'neha.patil@example.com', '9876500006', 2025, 5);

INSERT INTO courses (course_code, course_name, credits, department_id) VALUES
('DBMS', 'Database Management Systems', 3, 1),
('OS', 'Operating Systems', 3, 1),
('ML', 'Machine Learning', 3, 1),
('TOC', 'Theory of Computation', 3, 1),
('ME101', 'Engineering Mechanics', 4, 2);

-- Semester 5 Computer A/B/C offerings and Mechanical A.
INSERT INTO course_offerings (course_id, section_id, semester) VALUES
(1, 1, 5), (2, 1, 5), (3, 1, 5), (4, 1, 5),
(1, 2, 5), (2, 2, 5), (3, 2, 5),
(1, 3, 5), (2, 3, 5),
(5, 4, 5),
(1, 5, 3);

INSERT INTO enrollments (student_id, offering_id, internal_marks, external_marks) VALUES
(1, 1, 18, 52), (1, 2, 17, 49), (1, 3, 19, 55), (1, 4, 16, 48),
(3, 1, 17, 54), (3, 2, 18, 50), (3, 3, 16, 51), (3, 4, 19, 53),
(2, 5, 19, 56), (2, 6, 18, 51), (2, 7, 17, 50),
(4, 8, 18, 57), (4, 9, 17, 52),
(5, 10, 16, 48),
(6, 11, 18, 55);

INSERT INTO attendance (enrollment_id, attendance_date, status) VALUES
(1, '2026-10-20', 'Present'),
(1, '2026-10-21', 'Absent'),
(1, '2026-10-22', 'Present'),
(2, '2026-10-20', 'Present'),
(2, '2026-10-21', 'Present'),
(3, '2026-10-20', 'Late'),
(5, '2026-10-20', 'Present'),
(9, '2026-10-20', 'Present');
