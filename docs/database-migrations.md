# Database migrations

The SQL files in `supabase/migrations/` are the source of truth for schema changes. They have not been verified against the production Supabase project. Check the migration history and review the SQL in a staging project before applying anything to production.

## Before applying

1. Create a separate Supabase staging project and take a current production backup.
2. Install and authenticate the Supabase CLI. This repository currently has no `supabase/config.toml`; initialize/link the project configuration before using CLI database commands, and commit the reviewed configuration.
3. Compare the remote migration history with every local migration. These files may overlap with SQL already applied manually; resolve history differences deliberately rather than blindly pushing.
4. Review all policies, triggers, and grants for the app's actual role model. This branch changes invalid insert policy clauses to `WITH CHECK`; still validate profile role administration, grants, and policies for every new table.
5. Apply to staging, inspect the resulting schema and RLS policies, then run the release checks in [production readiness](production-readiness.md).

## Migration order

The CLI orders files by their timestamp prefix. Current files, from earliest to latest:

1. `202609150001_initial_schema.sql`
2. `202609180002_extend_schema.sql`
3. `202609180003_data_consistency_and_seed.sql`
4. `202609220000_create_profiles_table.sql`
5. `202609220001_update_rls_policies.sql`
6. `202609220002_fix_payments_trigger.sql`
7. `202609230000_create_audit_log.sql`
8. `202609240000_create_sequences_and_defaults.sql`
9. `202609250000_create_error_logs.sql`
10. `202609260000_create_attendance.sql`
11. `202609270000_create_assessments.sql`
12. `202609280000_create_course_materials.sql`
13. `202609290000_create_verifiable_documents.sql`

The last timestamp is later than the current release date in the repository environment. Confirm the intended release timing before applying it.

## Operational notes

- Never commit database passwords, access tokens, or service role keys.
- Keep RLS enabled on every table reachable through the Data API. A server route using the service role bypasses RLS and must perform its own verified authorization checks.
- Back up production before schema changes and define a rollback or forward-fix plan for each migration.
- Do not edit a migration that has already been applied to a shared or production database. Add a new migration for corrections.
