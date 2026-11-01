# DBMS Mini Project — Viva Questions and Answers

1. **What is the objective of this project?**  
   To maintain student, department, division, course, enrollment, marks and attendance information using a relational database.

2. **Why did you use MySQL?**  
   MySQL is a relational DBMS that supports tables, keys, constraints, joins, transactions and SQL.

3. **What is a primary key?**  
   A column or set of columns that uniquely identifies each row and cannot contain NULL.

4. **What is a foreign key?**  
   A constraint that ensures a value in one table refers to an existing key in another table.

5. **Why is `class_sections` separate from `students`?**  
   Many students belong to one section. The section's department, academic year, study year and division should be stored once rather than repeated for every student.

6. **Why can't division alone identify a section?**  
   Division A can exist in Computer Engineering and Mechanical Engineering, and in different academic years and study years.

7. **What is a composite UNIQUE constraint?**  
   A uniqueness rule across multiple columns. Here it prevents duplicate department/year/study-year/division combinations.

8. **What is normalization?**  
   Organizing relations to reduce redundancy and avoid insertion, update and deletion anomalies.

9. **Explain 1NF.**  
   Each attribute contains atomic values and there are no repeating groups.

10. **Explain 2NF.**  
    The relation is in 1NF and has no partial dependency of non-key attributes on part of a candidate key.

11. **Explain 3NF.**  
    The relation is in 2NF and has no transitive dependency of non-key attributes on candidate keys.

12. **What is a many-to-many relationship in this project?**  
    A student can take many course offerings and a course offering can include many students. `enrollments` resolves this relationship.

13. **Why is `course_offerings` needed?**  
    A course can be offered to different divisions and semesters. It models a specific course being taught to a particular section in a semester.

14. **What is a JOIN?**  
    A SQL operation that combines related rows from two or more tables using a related column.

15. **Difference between INNER JOIN and LEFT JOIN?**  
    INNER JOIN returns matching rows. LEFT JOIN returns every row from the left table plus matching right-table data, or NULL when there is no match.

16. **What is GROUP BY?**  
    It groups rows with the same values so aggregate functions can calculate results per group.

17. **Difference between WHERE and HAVING?**  
    WHERE filters rows before grouping; HAVING filters groups after aggregation.

18. **What is a CHECK constraint?**  
    A rule that restricts values, such as marks between 0 and 100.

19. **What is a transaction?**  
    A group of database operations treated as one unit. It can be committed or rolled back.

20. **Why use parameterized queries in Node.js?**  
    They keep user-supplied values separate from SQL text and help prevent SQL injection.

21. **What does CRUD mean?**  
    Create, Read, Update and Delete.

22. **Why does attendance reference enrollment?**  
    Attendance is recorded for a student's specific course enrollment, not just for a student in general.

23. **What is an index?**  
    A data structure that can speed up lookups, at the cost of additional storage and write overhead.

24. **What is referential integrity?**  
    It ensures foreign-key references remain valid.

25. **What happens if you delete a department that still has courses or sections?**  
    The RESTRICT foreign-key rule prevents deletion until dependent records are handled.
