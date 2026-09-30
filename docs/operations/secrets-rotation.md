# Secrets rotation

1. Identify the exposed secret, its environment, owner, and last known use. Do not paste the value into the incident ticket or shell history.
2. Revoke or rotate it at its issuer first: Supabase service-role/database credentials, Vercel token, Sentry auth token, Upstash Redis token, SMTP credentials, or GitHub token.
3. Update the matching GitHub Environment or Vercel environment variables. Never add secret values to `.env.example`, Git, artifacts, or logs. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
4. Redeploy the affected environment and verify `/api/ready`, login, one authorized operation, and relevant external integrations.
5. Revoke old credentials and sessions where applicable. For Supabase user compromise, revoke sessions/sign out the account; deleting a profile alone does not invalidate already-issued access tokens.
6. Search repository history and CI artifacts for accidental exposure, remove accessible copies, and follow the provider's compromise response even if the secret was later deleted from the current tree.
7. Record rotation time, affected environments, verification, and owner in the private incident log.
