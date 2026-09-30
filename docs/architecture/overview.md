# Architecture overview

## Request and data flow

```mermaid
flowchart LR
  Browser[Browser] --> AppRouter[Next.js App Router]
  AppRouter --> Proxy[proxy.ts session refresh]
  AppRouter --> Pages[Server pages]
  AppRouter --> API[Route handlers]
  Pages --> Services[Domain services]
  API --> Handler[withApi auth and validation]
  Handler --> Services
  Services --> RLS[Supabase Data API and RLS]
  Services --> RPC[Postgres transactional RPCs]
  Services --> Storage[Private Supabase Storage]
  API --> Sentry[Sentry, when configured]
  Handler --> Logs[Structured Pino logs]
```

The normal app path uses the cookie-bound Supabase client and Postgres RLS. The server-only service-role client is reserved for reviewed storage operations and the readiness check; those handlers must authorize the current user before privileged work. Payment/student writes that must be atomic use Postgres RPCs. The Next route handlers are transport adapters; business rules live in `modules/*/service.ts`.

## Main data relationships

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : has
  COURSES ||--o{ COURSE_TRAINERS : assigned
  PROFILES ||--o{ COURSE_TRAINERS : trainer
  STUDENTS ||--o{ PAYMENTS : pays
  STUDENTS ||--o{ ATTENDANCE : attends
  COURSES ||--o{ ATTENDANCE : schedules
  COURSES ||--o{ ASSESSMENTS : defines
  ASSESSMENTS ||--o{ ASSESSMENT_RESULTS : records
  STUDENTS ||--o{ ASSESSMENT_RESULTS : earns
  COURSES ||--o{ COURSE_MATERIALS : contains
  STUDENTS ||--o{ CERTIFICATES : receives
  PAYMENTS ||--o| VERIFIABLE_DOCUMENTS : invoice
  CERTIFICATES ||--o| VERIFIABLE_DOCUMENTS : certificate
  PROFILES ||--o{ AUDIT_LOG : acts
```

Table definitions and RLS policies are maintained in `supabase/migrations/`. The generated database types are under `lib/database.types.ts`; regenerate them with `pnpm db:types` and check drift with `pnpm db:types:check`.

## Permissions

The canonical role/action matrix is `lib/auth/permissions.ts`. The generated [role permissions table](role-permissions.md) is checked in CI with `pnpm docs:permissions:check`.

## Runtime dependencies

- Next.js 16.3 App Router on Node.js 22.
- Supabase Auth, Postgres via Data API, and private Storage.
- Vercel Functions targeted at `bom1` by `vercel.json`; confirm that the deployed database region matches.
- Sentry is optional until the Sentry project, DSN, source-map token, and alert routing are configured.
