# ThoorigAI Infotech Admin Dashboard

ThoorigAI Infotech Admin Dashboard for student records, payments and invoices, courses, certificates, attendance, assessments, course materials, audit history, and public document verification.

## Stack

- Next.js 16 App Router and React 19
- Supabase Auth and Postgres
- pnpm 12
- Playwright end to end tests

## Local setup

1. Install Node.js 22 or newer and pnpm 12.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and public key. Set the service role key only for server side integrations that require it.
3. Install dependencies with `pnpm install`.
4. Start the app with `pnpm dev` and open `http://localhost:3000`.

## Useful commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm test:e2e
```

## Operations and data

- [Production readiness and deployment](docs/production-readiness.md)
- [Database migration guide](docs/database-migrations.md)
- [Assessments](assessments-tracking.md)
- [Attendance](attendance-tracking.md)

Production deployment is gated on the security, database, and CI items in the readiness guide. Do not treat the existence of migration files as evidence that the production database has been migrated.
