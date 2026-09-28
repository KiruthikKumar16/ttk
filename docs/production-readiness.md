# Production readiness and deployment

## Release status

**Not cleared for production based on this repository audit.** The application changes and migrations need staging validation and security review before a production rollout. This guide is the release checklist, not evidence that deployment steps have already been completed.

## Configuration

Set the following in the hosting provider's encrypted environment settings and in local `.env.local` for development:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Required for course material storage, public document verification, and privileged error logging; never expose to client code |

Use distinct Supabase projects for local, staging, and production. Configure the production auth site URL and allowed redirect URLs to the deployed HTTPS origin. Ensure the first administrator is provisioned through a controlled process; the new-user trigger assigns the default `staff` role.

## Database release

Follow [Database migrations](database-migrations.md). Do not apply migrations until the staging schema, policies, trigger behavior, and migration history have been reviewed. The local CLI configuration is absent, so the repo does not yet have a reproducible linked database workflow.

## Application release

1. Confirm the production Supabase project has all reviewed migrations and the required auth configuration.
2. Add environment variables in the hosting provider. Keep the service role key server-only.
3. Create the private `course-materials` Supabase Storage bucket and validate its access rules. The application currently uses the service role key for storage operations, so route authorization must remain enforced.
4. Deploy a preview build and verify sign-in, role restrictions, data reads/writes, invoice downloads, document verification, and `/api/health`.
5. Confirm production error reporting and database backups are enabled and monitored.
6. Promote the preview only after CI and the manual release checks pass.

The application requires a Node.js server runtime; it is not a static export. On Vercel, use the Next.js preset and deploy from the protected main branch.

## Release blockers recorded in the audit

- The migration files have not been run against Postgres or reviewed by Supabase advisors. This audit corrected invalid `INSERT ... USING` clauses and removed older permissive policies that would have overridden the newer role rules. The policies, trigger behavior, role administration, and table grants still require staging validation.
- The migration set includes a timestamp after the repository's current date. Confirm whether that migration is intended for this release.
- The GitHub Actions workflow needs review for repeatability: use Node.js 22, pin/setup pnpm, and install the Playwright browser dependencies. The current end to end suite makes unauthenticated requests to protected APIs and writes shared test records without cleanup, so its assumptions conflict with the auth model and it is not safe to treat as release evidence.
- API auth and Next.js 16 session refresh have been aligned to cookie-backed Supabase clients in this branch, but the sign-in, expiry, refresh, and unauthorized paths have not been exercised in a deployed preview.
- Invoice/payment integrity and error handling across partial database failures need staging checks before production use.

## Release evidence to record

For each release, record the commit SHA, CI result, migration list before and after, backup reference, staging smoke-check result, production deploy URL, and rollback/forward-fix owner. Never put credentials or student data in the release record.
