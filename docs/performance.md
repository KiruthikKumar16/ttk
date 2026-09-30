# Performance and scale validation

## Implemented controls

- Operational payment, audit, and attendance histories support stable keyset pagination. Their indexes are added by the forward migration `20260929133609_scale_cursor_indexes.sql`.
- List queries use bounded page sizes and request only the fields needed by each view. Keyset reads do not request an exact count.
- Course selector options and GST calculation settings use short-lived Next.js server caches. They contain no student, payment, or user-specific data and are invalidated after writes.
- Invoice PDFs are cached in a private Supabase Storage bucket. The cache key includes a SHA-256 digest of the invoice, student, GSTIN, and verification inputs; a changed input selects a new object. The authenticated download handler still authorizes every request and returns `private, no-store` responses.
- Global body fonts are self-hosted; certificate display fonts are loaded only by the certificate route. The logo is served as WebP. Next image optimization is enabled.
- Vercel Functions are configured for `bom1` to keep request processing near the intended India user base. Confirm the Supabase project's actual region before production rollout; geographic mismatch can increase latency.
- `pnpm build:analyze` runs the Next bundle analyzer. `pnpm build:client-budget` records dashboard and student-list client chunk gzip size and enforces the 200 KB client budget.
- The current app uses Supabase's PostgREST Data API; [Supabase's timeout guide](https://supabase.com/docs/guides/database/postgres/timeouts) documents an 8-second default statement timeout for the `authenticated` role. No project-level override is added here. Confirm role settings in staging after query-plan review, and reload PostgREST after any role timeout change.

## Reproducible load profile

The k6 scripts in `tests/load/` exercise authenticated list endpoints at 50 requests/second for five minutes and cached invoice PDFs at five requests/second. They require a dedicated load-test deployment, a staff session cookie, and a synthetic invoice number. Do not paste cookies into command history or logs.

Example PowerShell setup (set the cookie in the current shell without echoing it):

```powershell
$env:API_BASE_URL = 'https://<dedicated-load-test-deployment>'
$env:AUTH_COOKIE_HEADER = '<staff session cookie header>'
k6 run tests/load/list-api.js
$env:LOADTEST_INVOICE = '<synthetic invoice number>'
k6 run tests/load/invoice-pdf.js
```

The scripts enforce p95 below 300 ms for list responses and below 800 ms for invoice PDFs, with an error rate below 1%. They intentionally do not hit a production or shared demo deployment.

## Target-volume fixtures

`tests/load/seed-target-volume.sql` creates 100,000 synthetic students, 1,000,000 synthetic payments, and 5,000,000 synthetic attendance rows in a single transaction. `cleanup-target-volume.sql` removes only the dedicated `LOADTEST` batch and `load-test-course-*` fixtures. Run both only in a disposable Supabase project after checking its project reference and region. The seed is intentionally not part of CI because it writes millions of rows and requires a dedicated database.

Use a direct database connection for migration/seed work. The app currently accesses Supabase through its Data API and does not need a Postgres connection pooler. If future server code opens direct Postgres connections, use Supabase's transaction pooler for serverless functions and keep migrations on a direct/session connection.

## Evidence status

No k6 executable is installed in the current workstation environment, and this checkout is not linked to a dedicated load-test project. Therefore no latency, throughput, LCP, database `EXPLAIN ANALYZE`, or 100-concurrent-user result is claimed here. The thresholds are targets until the dedicated staging run is captured. The target-volume seed is provided, but it has not been executed.

Record the following for each scale run:

| Measure                                     |                                   Target | Result              |
| ------------------------------------------- | ---------------------------------------: | ------------------- |
| Staff concurrency                           |                                100 users | Not measured        |
| List endpoint p95                           |                                 < 300 ms | Not measured        |
| Invoice PDF p95                             |                                 < 800 ms | Not measured        |
| Dashboard LCP                               |                                  < 2.5 s | Not measured        |
| Dashboard JS                                |                            < 200 KB gzip | Build check pending |
| 100k students / 1m payments / 5m attendance |                                   Seeded | Not run             |
| Query plans at target volume                | No sequential scan on indexed page paths | Not measured        |
