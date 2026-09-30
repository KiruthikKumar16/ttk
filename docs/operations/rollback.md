# Deployment and rollback runbook

## Before production deployment

1. Confirm the staging deployment and smoke tests passed for the release commit.
2. In the Supabase production project, confirm PITR/backups are enabled and create or identify a recoverable point immediately before the migration. Enter its reference in the production workflow dispatch form. The workflow records that reference, commit, and UTC time in the run summary before running `supabase db push`.
3. Confirm the approved reviewer is not the workflow initiator when GitHub environment rules require separation of duties.

The production GitHub Environment must require reviewers. The deployment job cannot reach production credentials or apply migrations until that environment is approved. The PITR input is an audit marker; it does not create or verify a Supabase backup by itself.

## Application rollback

If production health, login, or public verification smoke tests fail after deployment, the workflow runs `vercel rollback` to restore the previous production deployment. Confirm the live domain and `/api/health` after rollback, then record the failed commit and deployment URL in the incident issue.

## Database migrations are forward-only

Never edit a migration already applied to a shared environment, and never automatically roll back a production schema. A Vercel rollback changes application code only and does not reverse database changes. Keep migrations additive and compatible with the currently deployed app where possible. If a migration causes a defect, stop later deployments, create a reviewed forward-fix migration, deploy the compatible application fix, and validate data before removing obsolete columns or constraints in a later release. Restore from PITR only through the incident recovery process after assessing data loss and coordinating with the data owner.

## Recovery evidence

Record the GitHub deployment run, release commit, PITR reference, migration versions, Vercel deployment URL, smoke-test outcome, and any forward-fix or restore action in the incident record. Keep actual database dumps and customer records out of GitHub logs and ordinary workflow artifacts.
