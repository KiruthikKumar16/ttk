# ADR 0001: Layered modules and shared HTTP foundations

- Status: Accepted
- Date: 2026-09-28

## Context

The original dashboard used a client-side `view` switch and loaded broad record sets on each visit.
Route handlers mixed authentication, validation, database access, and business rules, and several
large UI components duplicated domain calculations. These boundaries made deep links, browser
history, data access, and permission checks difficult to reason about.

## Decisions

1. Domain code will be organized in `modules/<domain>/` with shared schemas, repositories, services,
   and domain components. Route handlers remain transport adapters and call domain services.
2. Protected API handlers use `withApi`. It authenticates with the cookie-bound Supabase client,
   loads `profiles.role` once, validates Zod inputs, and returns `{ data, meta? }` or a stable error
   envelope with a request ID. Public access must be explicit with `public: true`.
3. Authorization is expressed once in `lib/auth/permissions.ts`. Server handlers derive allowed roles
   from the resource/action matrix; UI visibility uses the same `can` function.
4. List queries use bounded page pagination (at most 100 rows) or opaque keyset cursors. No endpoint
   should load an unbounded list by increasing `pageSize`.
5. Persisted monetary columns use integer paise. Calculations use integer paise and exact integer
   ratios; rupee-valued legacy form and response fields convert only at the application boundary.
   GST component allocation uses largest remainder with CGST winning equal remainders.
6. `lib/logger.ts` provides structured Pino logging. Production logs are JSON; development logs are
   pretty printed. Personal fields and secrets are redacted; API request logs include request ID,
   safe route, duration, status, and a hashed user identifier. Sentry handles exception tracking.
7. Each dashboard view is an App Router route in the `(dashboard)` route group. Its server layout
   verifies the cookie-bound session and renders the shared navigation shell. Route visibility and
   route access use the same role permission matrix.
8. List pages load through server-only domain services. Page, page size, search, filters, sort, and
   direction are represented in URL search parameters; page size defaults to 25 and is capped at 100.
   Client components handle interactions and mutations only.
9. Dashboard aggregates come from PostgreSQL RPCs. Heavy print views and QR generation are loaded
   lazily, while ordinary list and detail pages remain server-rendered.
10. Route groups and nested route segments provide loading skeletons, retryable error boundaries, and
    not-found UI. Domain components and services share domain types instead of importing another
    domain's UI internals.

## Consequences

- Existing monetary columns are converted by a new forward migration, and server adapters translate
  persisted paise to the rupee values currently consumed by the UI.
- New and migrated APIs should use the standard response envelope. Existing handlers can be migrated
  incrementally without moving domain rules into route files.
- Pagination and money helpers have unit tests; the money module enforces 100% statement, branch,
  function, and line coverage.
- RLS remains active for normal route queries. Service-role access remains limited to reviewed
  privileged use cases.

## Rejected alternatives

- Optional authentication on API handlers was rejected because missing role declarations must not
  silently make a route public.
- Floating-point currency calculations were rejected because they can lose paise during GST splits.
- A single unbounded list endpoint was rejected because list size grows with business history.
