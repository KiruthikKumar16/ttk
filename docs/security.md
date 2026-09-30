# Security model

## Assets and actors

- Assets: student identity/contact data, fees and GST invoices, certificates and verification codes, course materials, staff identities, credentials, audit records, and service credentials.
- Actors: unauthenticated visitors, authenticated staff, trainers, administrators, compromised accounts, and automated scanners.
- Trust boundaries: browser to Next.js Proxy/routes; Next.js server to Supabase Auth/Postgres/Storage; public verification to the narrowly scoped `public_verify_document` RPC; CI to package registries and GitHub Actions.

## Main risks and controls

| Risk                                 | Control                                                                                                                                                                               | Status                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stolen/expired session or stale role | Supabase `getClaims` refresh in `proxy.ts`; each `withApi` request loads current profile role; direct handlers reload profiles before privileged operations                           | Implemented; route-by-route real-JWT negative tests remain                                                                                                                                                                                  |
| Forged cross-site mutation           | Origin + Host comparison and JSON content type in `withApi`; multipart upload separately checks Origin + Host and multipart content type                                              | Applied to current mutation routes                                                                                                                                                                                                          |
| Admin account takeover               | Dashboard redirects admins to `/mfa` until AAL2; enrollment/challenge/verification API and UI; wrapped API requests require AAL2 for admins; GST and certificate mutations check AAL2 | Implemented; revoke/role-management operations do not exist in the current route surface                                                                                                                                                    |
| Verification-code enumeration        | strict IP rate limit; public RPC returns masked/minimal data; invalid, missing, orphaned and revoked results share one invalid object; no-store/noindex                               | Implemented in route; database RPC requires a clean local migration run and integration tests                                                                                                                                               |
| Malicious material upload            | MIME/extension/signature validation, a 20 MiB cap, random object keys and five-minute signed URLs; database RLS governs metadata reads                                                | Verify private bucket configuration and assigned-course authorization with local DB integration tests before deployment                                                                                                                     |
| Secret or PII exposure               | Server-only service client; structured logger redaction; Sentry PII disabled with request/exception scrubbing                                                                         | Service-role call sites: course-material routes create short-lived signed URLs; readiness checks inspect required dependencies. Errors are not persisted to Postgres. Public verification uses the restricted RPC with the publishable key. |
| Supply-chain compromise              | frozen lockfile, production dependency audit, pinned CI actions, Dependabot, gitleaks and a staged-content secret hook                                                                | CI/hook config is local; run the scans before merge                                                                                                                                                                                         |

## Service-role access

The service-role key is read only in server-only `lib/supabase/admin.ts`. Current callers are:

1. `app/api/course-materials/route.ts`: mints signed access URLs for private storage objects after app-level authorization. Replace with user-scoped signed URL generation once bucket policies support it.
2. `app/api/ready/route.ts`: checks the database migration marker and private Storage bucket using the service role, then returns only a generic readiness status.

The public verification handler calls a fixed-shape RPC using the publishable key and does not use the service role.

## Rate limiting configuration

Upstash Redis sliding-window limits are used for public verification (10/minute/IP), password login (5/15 minutes/IP), MFA actions (5/15 minutes/admin), certificate creation (10/15 minutes/user), and payment mutations (20/minute/user). Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production. The app fails closed with 503 if production rate limiting is unconfigured or unavailable; local development bypasses the limiter. `/api/auth/login` is an explicit public authentication endpoint in addition to the health, readiness, login page, and verification allowlist.

## Data retention and deletion

Collect only fields needed to administer training and statutory accounting. Restrict access by role and retain personal data only for the operational and legal period approved by the organization. When retention ends, delete or irreversibly anonymize personal data, including exports and backups according to their lifecycle. Financial invoices and statutory accounting records may require a different retention schedule from student contact/profile data. These timelines and the handling of access/deletion requests must be reviewed by Indian privacy counsel for the Digital Personal Data Protection Act, 2023 and applicable rules before production use; this document is not legal advice.

## Deployment gates / outstanding evidence

Before production: run all database migrations and pgTAP tests on a clean local Supabase instance; test real JWTs for each role on every route/table; enforce AAL2 on role changes and document revocation if those operations are added; run CSP tests over print/PDF and QR flows; verify private bucket setup and assigned-course authorization; run `node scripts/check-security-headers.mjs <deployed-origin>` and `pnpm audit --prod`; review the security contact and retention periods with the organization/legal counsel. The committed Gitleaks baseline is intentionally empty: no known findings are waived.
