# Attendance user flow

1. From the Attendance page, choose a course and session date, then select **Load roster**. The roster is limited to the first 100 enrolled students and restores statuses already recorded for that session.
2. Choose Present, Absent, Late, or Excused beside each student. Changes save optimistically through the authenticated attendance API; a failed write restores the prior value and announces the error.
3. **Mark all present** submits Present for each student. The unique `(student_id, course_id, session_date)` constraint and API upsert make repeat marking update the existing row instead of duplicating it.
4. Use arrow keys while focused on a status control to move across statuses or between students. The roster table scrolls horizontally on narrow screens.

The Attendance route also lists paginated historical records, a course percentage report, and a per-student percentage report for the selected course. Percentages are computed by PostgreSQL views added in the `complete_feature_workflows` migration. Enrollment is currently resolved through the student's course name; cohorts that need course IDs or batch-level enrollment need a schema decision. Reports show up to 100 course and student rows.
