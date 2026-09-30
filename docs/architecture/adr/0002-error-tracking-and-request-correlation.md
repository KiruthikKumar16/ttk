# ADR 0002: Sentry error tracking and request correlation

- Status: Accepted
- Date: 2026-09-29

## Context

The app wrote sanitized error rows to a second `error_logs` table, but no operator-facing search, retention, alerting, or recovery flow existed for those rows. This duplicated the business database and could make diagnostics unavailable during a database outage. API responses already expose request IDs; logs, Sentry, and database audit rows need the same correlation key.

## Decisions

1. Sentry is the canonical application exception tracker. `captureError` captures exceptions in Sentry and does not write error details to Postgres. A forward migration drops the unused `error_logs` table.
2. Pino JSON logs emit request ID, safe route template, method, status, duration, and a one-way hash of authenticated user IDs. Known personal fields, cookies, credentials, tokens, and verification codes are redacted.
3. Sentry is initialized separately for browser, Node.js, and Edge runtimes. Default PII collection is disabled. Request data, cookies, headers, user objects, and exception messages are removed before sending. Sentry release tags use the Git SHA and deployments use the environment name.
4. API handlers pass the `x-request-id` header to Supabase PostgREST. Audit triggers store it in `audit_log.request_id` when PostgREST supplies the header. Operations without an API request context may have a null request ID.
5. Source maps upload only in protected staging/production deployment builds. Upload credentials come from GitHub Environment secrets; public source maps are deleted after upload.
6. `/api/health` is dependency-free liveness. `/api/ready` checks the database migration, private materials bucket, and readiness rate limit without returning internal dependency details.

## Consequences

- Operators search logs, Sentry, API response headers, and audit rows using one request ID.
- Sentry organization/project and protected upload credentials must be configured outside the repository. Until then, builds succeed but events/source maps are not externally verified.
- A database outage no longer blocks application error capture. Sentry retention and access controls are managed by the Sentry project owner.
- The configured error scrubber preserves exception type and stack, but removes exception messages to avoid sending user data embedded in database/provider errors.
