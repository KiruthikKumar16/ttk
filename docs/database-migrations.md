# Database migrations

SQL in `supabase/migrations/` is the schema source of truth. Use forward-only migrations and review all RLS policies, grants, triggers, and constraints before applying changes.

## Observed remote status

The latest migration push transcript supplied by the project owner reported a successful cloud push through `20260929024205_date_range_reports.sql`. That is historical user-provided evidence, not a live database check. This checkout contains 20 later migrations that were added after that transcript and should be treated as pending until `supabase migration list --linked` confirms otherwise:

- `20260929092557_provision_course_materials_storage.sql`
- `20260929114233_observability_readiness_and_audit_correlation.sql`
- `20260929133609_scale_cursor_indexes.sql`
- `20260929145735_grant_server_cache_reads.sql`
- `20260930031537_fix_auth_user_profile_trigger.sql`
- `20260930104500_disable_self_registration_pending_profile_role.sql`
- `20260930113000_create_brand_settings.sql`
- `20260930123000_create_course_categories.sql`
- `20260930140000_consolidate_trainer_into_staff.sql`
- `20260930150000_update_brand_urls_to_vercel.sql`
- `20261001140000_create_invite_codes.sql`
- `20261001150000_create_skill_tags.sql`
- `20261001160000_create_notifications.sql`
- `20261001170000_add_payment_type_and_instance.sql`
- `20261002120000_fix_public_verify_document_reference_lookup.sql`
- `20261003121800_comprehensive_audit_logging.sql`
- `20261003184500_add_user_contact_details_and_metadata.sql`
- `20261004100000_add_google_forms_to_assessments.sql`
- `20261005150000_fix_service_role_profile_role_checks.sql`
- `20261010110000_attendance_exempt_status.sql`

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
