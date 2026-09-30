# Incident response

## Severity and ownership

- **SEV-1:** student/payment/invoice data exposure or corruption, login unavailable to all staff, production database unavailable, or public verification returns incorrect document status. The operations owner coordinates; the application maintainer leads technical response.
- **SEV-2:** sustained 5xx, payment recording failures, storage outage, or a role bypass affecting a limited workflow. The application maintainer owns mitigation and informs the operations owner.
- **SEV-3:** isolated user errors or degraded non-critical reports. Triage during business hours.

Record start time, affected environment, deployment SHA, Vercel deployment URL, Supabase project reference, request IDs, symptoms, actions, and outcome in the private incident record. Do not copy student PII, credentials, access tokens, or raw request bodies into GitHub issues or chat.

## First response

1. Confirm the alert against Vercel runtime logs, Sentry, Supabase logs, and `/api/ready`.
2. Search logs by `requestId`; application request logs, API responses, Sentry tags, PostgREST mutation headers, and audit rows use this identifier where available.
3. Record the active deployment SHA and the latest applied migration. Stop subsequent releases if a deployment or migration is implicated.
4. For application-only regressions, roll back the Vercel deployment using [rollback.md](rollback.md). Do not reverse a shared database migration.
5. For suspected data loss or corruption, freeze affected writes where safe, preserve evidence, and follow [backup-restore.md](backup-restore.md) with the data owner.
6. Rotate exposed credentials using [secrets-rotation.md](secrets-rotation.md). Revoke user sessions for suspected account compromise and follow [user-offboarding.md](user-offboarding.md).
7. Update impacted users through the operations owner. Restore service, verify role boundaries and data consistency, then document the recovery time.

## After the incident

Within two business days, record the timeline, customer impact, root cause, detection gap, and corrective actions with owners and due dates. Preserve only the minimum sanitized log excerpts needed for the review.
