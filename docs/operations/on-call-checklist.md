# On-call checklist

## Start of coverage

- Confirm `/api/health` and `/api/ready` are reachable and review any current alerts.
- Check the deployed commit and Vercel deployment status.
- In Supabase, review database connection pressure, Auth/PostgREST/Storage errors, and the latest backup/PITR point.
- Confirm Sentry alert delivery and that the on-call contact can access the Sentry project.
- For a controlled telemetry check, run `pnpm sentry:smoke` from an environment with the Sentry DSN configured, then find the printed request ID in Sentry event tags. Do not run repeatedly in production.

## During an alert

- Acknowledge it and note UTC time, severity, environment, release SHA, and request ID.
- Follow [incident-response.md](incident-response.md) and the symptom entry in [common-errors.md](common-errors.md).
- Use `/api/ready` for dependency readiness. `/api/health` only proves the app process can answer.
- Do not run destructive SQL, restore a backup, rotate credentials, or disable production writes without the operations owner and data owner.

## End of coverage

- Hand off open incidents, current mitigations, known risky deployments, and next actions to the next named operator.
- Link the incident record and include owners and due times for outstanding actions.
