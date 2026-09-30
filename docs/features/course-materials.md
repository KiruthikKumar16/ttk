# Course materials user flow

1. Open Courses and choose a course's materials page. Authorized staff can submit a title, type, and file; the server checks allowed extensions, MIME signatures, and size before generating a random storage key.
2. The private `course-materials` bucket is provisioned by migration with a 20 MB limit and PDF/PNG/JPEG MIME restrictions. Storage RLS allows admin, staff, and trainer profiles to insert, read, and delete objects in this bucket. Listings use short-lived signed URLs for view/download.
3. Staff can select **Delete**, review the confirmation dialog, and confirm. The API removes the stored object before deleting its metadata; failure is shown and metadata is retained.

Trainer course assignment enforcement remains incomplete. The upload form reports transfer progress. Playwright verifies a real local upload, signed URL download, and deletion; the DB suite checks the private bucket configuration and bucket-scoped policies.
