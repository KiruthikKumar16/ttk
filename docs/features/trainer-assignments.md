# Trainer assignment flow

1. An admin with an active MFA session opens **Settings → Trainer assignments**.
2. Select a course and trainer, then choose **Assign trainer**. Existing assignments are idempotent. Database triggers record assignment and unassignment in the audit log.
3. Choose **Unassign** on an assignment and confirm. Trainer access to the assigned course's attendance, assessment/results, and materials is controlled by row-level security.

This flow requires the `complete_feature_workflows` migration to be applied. The local migration, DB tests, and role-scoped integration suite pass, but this UI's authenticated assign/unassign flow has not yet been exercised by E2E. Hosted CI and staging verification remain open.
