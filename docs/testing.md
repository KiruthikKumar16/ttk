# Testing guide

## Local test pyramid

`pnpm test:ci` is the release-style local entry point. It starts the local Supabase containers (excluding Studio and postgres-meta), resets the local database and deterministic seed for pgTAP/integration tests, then resets it again before Playwright so immutable verification documents and other integration fixtures cannot leak into browser tests. It runs RLS checks, pgTAP, unit/component tests, database integration tests, a production build and size budget check, and Playwright. It always stops the local stack it started. It never links or pushes a cloud project. Docker, Node 22, pnpm 12.3.4, and the Chromium browser are required.

Individual commands:

- `pnpm test:unit` runs fast pure and component tests without external I/O.
- `pnpm test:coverage` runs unit and component tests with V8 coverage, enforces 70% overall line coverage, 85% aggregate `lib/` line coverage, and 85% line coverage for every exercised domain service. It reports measured coverage in the terminal and `coverage/coverage-summary.json`.
- `pnpm test:int` requires local test variables and real seeded Supabase JWTs; `pnpm test:ci` supplies them from `supabase status` without printing keys.
- `pnpm test:db` runs pgTAP against the local database.
- `pnpm test:e2e` runs Playwright against a production build at `127.0.0.1:3001` and requires local E2E credentials.

Seeded local users are `admin@thoorigai.test`, `staff@thoorigai.test`, and `trainer@thoorigai.test`, all with password `ThoorigaiLocal123!`. These are local-only seed credentials; never configure them for a deployed environment. Playwright setup signs in as each role and saves isolated storage state under the ignored `tests/.auth/` directory. E2E mutation fixtures use unique generated identifiers; integration tests clean removable rows in teardown. The clean-database reset before Playwright is the isolation boundary for immutable verification documents. Keep cloud environment files out of test runs.

## Flaky-test policy

Do not add `.only` or `.skip` to committed tests. Fix nondeterminism at its source, isolate mutable fixtures, and use bounded waits on an observable condition rather than arbitrary sleeps. CI retries are diagnostic only; a test that passes only on retry is flaky and must be fixed before merge. Preserve Playwright traces and videos on retry when diagnosing failures. Database integration tests must use only the local Supabase stack started by the test runner.

## Current verified flows and gaps

The unit suite covers money/GST edge cases and generated invariants, schemas, the complete role/action permission matrix, pagination, verification codes, Indian financial-year boundaries, Supabase data mapping, HTTP request handling, client helpers, and domain read services. Component tests cover student entry, attendance keyboard/autosave behavior, and confirmation dialogs. The integration suite signs in with a seeded local Auth JWT and tests API policy declarations, payment atomicity, concurrent balance protection, idempotent replay, and transaction rollback. pgTAP checks RLS, storage bucket policies, audit immutability grants/policies, invoice sequence/trigger contracts, and verification RPC exposure. Playwright signs in as all three roles, checks staff/trainer access and anonymous denials for protected APIs, exercises login/logout/session expiry, creates a student with an initial payment and completes the balance, issues and publicly verifies a certificate, checks the certificate fee gate, uploads/downloads/deletes course material, creates and edits/deletes an assessment result and exports a CSV report, scans the login and 12 staff pages with axe, checks responsive attendance marking, validates invoice PDF text and A4 page dimensions, smoke-checks health/login/public-verification routes against the local production build, and writes HTML/JUnit/JSON/blob reports including the slowest 10 tests.

Release evidence remains incomplete for certificate revoke/reissue and all three verification states, invoice void/credit note, end-to-end student edit/soft-delete/import/export, trainer assignment, server streamed-report behavior beyond the exercised export, a complete audit-log assertion for browser mutations, and visual print comparison for invoice and certificate pages. The database reset before Playwright plus stack teardown isolates mutations between suite runs, but individual browser mutations are not all deleted within the suite. The local suite checks invoice PDF text and A4 media dimensions; it does not render/compare print images or prove embedded fonts visually. GitHub Actions has been configured but was not run from this local checkout, and Lighthouse accessibility scores have not been measured. Do not treat a local `test:ci` pass as evidence for these remaining flows or deployment checks.
