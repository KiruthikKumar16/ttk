# Assessment results flow

1. Open **Assessments**, choose an assessment, then select a student and enter a score and optional remarks.
2. Use the row's **Edit** action to load its values into the score form. Saving uses the unique assessment/student upsert, so the existing result is updated.
3. Use **Delete** to open a confirmation dialog, then confirm to remove the score. The API verifies the assessment ID, result ID, caller role, and row access.
4. Enter multiple scores in the bulk table and choose **Save all scores**. The API validates the entire request and saves it in one upsert statement.
5. Review the score-band distribution and choose **Export CSV** to download the current result set.

Editing or deleting the assessment definition itself remains pending. The bulk scores are saved together; they are limited to 500 per request.
