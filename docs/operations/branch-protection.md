# Branch protection and repository settings

Configure these settings in GitHub under **Settings → Rules → Rulesets** (or the branch protection rule for `main`). Repository configuration cannot be enforced from YAML alone.

## `main` rules

- Require a pull request before merging.
- Require 1 approval for routine changes; require 2 for migrations, authorization, payments, invoices, or certificate issuance.
- Require approval from Code Owners for `/supabase/migrations/`, `/supabase/tests/`, `/lib/auth/`, `/lib/security/`, `/app/api/auth/`, `/app/api/admin/`, and `/proxy.ts`.
- Dismiss stale approvals when new commits are pushed; require approval of the most recent reviewable push.
- Require all conversations to be resolved.
- Require the `ci-success` status check from the CI workflow. Select the check after its first successful run.
- Also require `Deploy / preview` for same-repository PRs so the Vercel preview smoke test is reviewed before merge. Fork PRs intentionally skip preview deployment because GitHub does not expose environment secrets to them.
- Require linear history; disallow merge commits.
- Block force pushes and branch deletion.
- Require signed commits where contributors have signing configured; enable this only after validating the team's signing setup.
- Do not allow bypassing these rules for routine maintainers or administrators.

## GitHub Environments

Create/configure `preview`, `staging`, `production`, and `release` environments. The repository currently has `Preview` and `Production` environments, but they have no configured secrets or variables; staging and release environments still need to be created. Store deployment and database credentials only as environment secrets. Set Vercel project IDs, Supabase refs, and staging hostnames as environment variables when non-sensitive.

- `preview`: secret `VERCEL_TOKEN`; variables `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. Configure Vercel's Preview environment with non-production Supabase values. Restrict preview deployment to same-repository PRs unless a deliberate safe fork workflow is added.
- `staging`: secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN`, and `SENTRY_AUTH_TOKEN`; variables `SUPABASE_PROJECT_REF`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_STAGING_DOMAIN`, `SENTRY_ORG`, and `SENTRY_PROJECT`. Point Vercel Preview variables at the isolated staging Supabase project.
- `production`: secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN`, and `SENTRY_AUTH_TOKEN`; variables `SUPABASE_PROJECT_REF`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SENTRY_ORG`, and `SENTRY_PROJECT`. Require at least two designated reviewers and prevent self-review. Enable Supabase PITR/backup retention and verify restores before allowing releases. The manual workflow requires a PITR reference before it can apply migrations.

In Vercel Preview/Production runtime settings, configure `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_APP_ENV`, and server-only `SENTRY_DSN` as appropriate. Keep `SENTRY_AUTH_TOKEN` only in the protected GitHub staging/production Environments so runtime functions cannot read the source-map upload credential.

- `release`: secret `RELEASE_PLEASE_TOKEN`, a fine-grained GitHub token with only repository contents and pull-request write access.

Do not put service-role keys in workflow files or `NEXT_PUBLIC_*` variables. Never use production credentials for preview or staging.
Keep any production `SUPABASE_SERVICE_ROLE_KEY` in Vercel's server-only Production environment; it is not needed as a GitHub Actions secret.

## Required status check

Only require `ci-success`; it aggregates static analysis, coverage tests, database migrations/pgTAP, integration tests, production build budget, and all Playwright shards plus report merge. Keep security workflow checks visible, and require them too if the repository's security policy mandates it.
