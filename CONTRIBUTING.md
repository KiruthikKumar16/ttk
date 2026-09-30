# Contributing

## Before opening a pull request

1. Create a focused branch named for the change (`feat/…`, `fix/…`, `docs/…`, `test/…`, or `ci/…`).
2. Read `AGENTS.md`, the matching feature flow, and any local Next.js guide in `node_modules/next/dist/docs/` before changing Next.js APIs.
3. Keep database changes additive. Never rewrite a migration that has been applied to a shared database.
4. Add or update user-flow documentation, validation, tests, and accessibility behavior with the implementation.
5. Run `pnpm check:brand`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm markdownlint`, and the relevant test commands. For release evidence, run `pnpm test:ci` and report any environment blocker accurately.
6. Review generated database types, role permissions, API documentation, and screenshots for drift.

## Pull request expectations

- Use a conventional commit subject (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, or `ci:`).
- Explain the user-visible change and the database/security impact.
- Include screenshots for visual changes and a migration/rollback or forward-fix note for schema changes.
- Do not include credentials, local `.env` files, production data, or copied user records.
- Never lower or skip tests to get a green run. Add a linked issue for unavoidable temporary test exclusions.

## Local test setup

The local suite uses Docker-backed Supabase and local-only test users. See [Testing](docs/testing.md) and [Local database development](docs/database/local-development.md). Do not point the test runner at a shared or production Supabase project.
