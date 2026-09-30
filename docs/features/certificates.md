# Certificate flow

1. A permitted staff/admin user selects a student from the certificate form and submits the certificate.
2. The server reloads the student by register ID and rejects issuance with HTTP 409 while `paid < total`; it uses the database student's name/course rather than trusting client supplied display values.
3. On success, the certificate is stored and the verification code is generated server-side. The public verification route displays document status.

Fee clearance is now checked server-side. Revoke/reissue with reasons, bulk issue by batch, and atomic rollback if verification-record creation fails remain pending.
