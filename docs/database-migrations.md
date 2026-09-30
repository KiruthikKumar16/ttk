# Database migrations

SQL in `supabase/migrations/` is the schema source of truth. Use forward-only migrations and review all RLS policies, grants, triggers, and constraints before applying changes.

## Observed remote status

The latest migration push transcript supplied by the project owner reported a successful cloud push through `20260929024205_date_range_reports.sql`. That is historical user-provided evidence, not a live database check. This checkout contains four later migrations that were added after that transcript and should be treated as pending until `supabase migration list --linked` confirms otherwise:

- `20260929092557_provision_course_materials_storage.sql`
- `20260929114233_observability_readiness_and_audit_correlation.sql`
- `20260929133609_scale_cursor_indexes.sql`
- `20260929145735_grant_server_cache_reads.sql`

The older migration files include corrections made before the reported push. Do not edit any migration already recorded in the shared project's migration history; add a new migration instead. Never use `migration repair` to hide a schema mismatch without a reviewed recovery plan.

## Local development and CI

1. Use Node.js 22, pnpm 12.3.4, and Docker Desktop's Linux engine.
2. Start the local Supabase stack with `pnpm db:start`.
3. Reset and apply the complete migration history with `pnpm db:reset`.
4. Run `pnpm db:lint`, `pnpm db:test`, `pnpm db:types`, and `pnpm db:check-rls`.
5. Inspect generated type changes and migration status before committing.

The repository includes `supabase/config.toml`; `pnpm test:ci` uses only this local stack and never links or pushes the cloud project.

## Before a remote push

1. Confirm the CLI is linked to the intended staging Supabase project and inspect `pnpm exec supabase migration list --linked`.
2. Ensure a recent backup/PITR restore point exists and has a named owner.
3. Run `pnpm exec supabase db push --linked --dry-run` and review every listed migration.
4. Apply pending migrations to staging, run database tests, inspect RLS/policy state, and exercise the application against staging.
5. Obtain the required reviewer approval before applying production migrations.
6. Apply forward-only fixes. See [rollback and forward-fix policy](operations/rollback.md).

Never run `pnpm exec supabase db push --linked` from a workstation until the linked project ref and exact pending list have been checked. Never put a database password, access token, or service-role key in source control, command history, or test output.
