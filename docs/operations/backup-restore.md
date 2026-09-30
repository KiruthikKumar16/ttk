# Backup and restore

## Targets and current limits

- Recovery point objective (RPO): **24 hours** when relying on an available daily backup; **5 minutes** is the target only after PITR is enabled and the latest recoverable point has been verified.
- Recovery time objective (RTO): **4 hours** from incident declaration to validated service, measured in a restore drill.
- Supabase database backups do not contain Storage file objects. Keep an independent copy of required course-material objects and verify its restore separately.
- A Supabase Free project does not have the managed daily backup guarantee described for paid plans. Before production, move to a plan with an approved backup method or establish scheduled off-site exports. PITR is a paid add-on and requires suitable compute.

These are operational targets, not measured achievements. Record actual backup plan, retention, latest recoverable timestamp, and restore-drill duration in the private operations record. See [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups).

## Pre-deployment recovery point

1. In Supabase Dashboard, open the production project's **Database → Backups** or **Point in Time** view.
2. Confirm a restore point is visible and its timestamp predates the proposed migration. Record the reference in the protected GitHub production deployment input.
3. The workflow records the operator-provided reference; it does not create or validate a backup.
4. Verify the course-materials bucket is private and its objects have an independent recovery path. Database restore alone does not restore deleted Storage objects.

## Restore drill in an isolated scratch project

Do not restore over production to conduct a drill.

1. Create a dedicated scratch Supabase project in the same region. Restrict dashboard access and network access to the operators conducting the drill.
2. Before cloning, inspect enabled extensions and scheduled jobs. Restored extensions or jobs can resume external work when the new database starts. Disable external callbacks or use a supported logical restore if isolation cannot be guaranteed.
3. In the source project's backup view, use **Restore to a New Project** if available, select a known recovery point, and confirm the destination is the scratch project. This copies database data, including Auth records; it does not copy Storage objects or all project configuration.
4. Record the start and completion times. Recreate only the configuration needed to validate safely: private storage bucket and policies, Auth redirect settings, and non-production credentials. Never point the scratch app at production credentials.
5. Apply the current application to the scratch project, then verify schema/migration version, role records, row-level security, a seeded login, a read-only student/payment view, and a signed material download after restoring a test object.
6. Record elapsed restore and validation time, restore point, missing configuration, and actual data loss window. Delete the scratch project after the data owner approves cleanup.

The drill is incomplete until the measured times and validation results are added to the private operations record. A dashboard restore or drill has not been performed by this repository change.

## Logical export fallback

For an approved export, use the CLI command confirmed by `pnpm exec supabase db dump --help`, keep the output outside the repository on encrypted storage, and separately back up Storage objects. Treat dumps as containing sensitive student and payment data. Test restoring the dump into a new scratch database before relying on it.
