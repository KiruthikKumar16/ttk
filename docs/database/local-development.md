# Local database development

The Supabase CLI uses the local stack only. Start it with `pnpm db:start`, rebuild it with `pnpm db:reset`, run `pnpm db:lint` and `pnpm db:test`, and stop it with `pnpm db:stop`. `pnpm db:diff` compares the local database with the migration files. `pnpm db:types` generates the committed TypeScript types; `pnpm db:types:check` detects schema drift.

The reset seed creates three local-only sign-in accounts:

| Role    | Email                    | Password             |
| ------- | ------------------------ | -------------------- |
| Admin   | `admin@thoorigai.test`   | `ThoorigaiLocal123!` |
| Staff   | `staff@thoorigai.test`   | `ThoorigaiLocal123!` |
| Trainer | `trainer@thoorigai.test` | `ThoorigaiLocal123!` |

These predictable credentials and demo learner records exist only for local development and E2E testing. Do not reuse them in shared, staging, or production environments. `pnpm db:reset` explicitly targets the local database.
