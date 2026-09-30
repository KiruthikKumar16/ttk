# Supabase client access rule

Route handlers and server components use `lib/supabase/server.ts`, which reads the request cookies and
keeps Row Level Security in force. Use `lib/supabase/admin.ts` only for these established cases:

- `app/api/course-materials/route.ts`: after user authentication, sign storage URLs. Uploads and
  metadata queries use the cookie-bound client so storage and table policies still apply.
- `app/api/ready/route.ts`: server-only readiness checks using the service role, without returning
  dependency details to the caller.
- Public verification uses a fixed-shape RPC through the publishable client; operational exceptions
  are captured by Sentry and are not written to an error table.

When reviewing a new privileged-client import, verify the route has explicit session and role or
resource authorization before any privileged operation. Add a narrowly scoped ESLint exception only
for a reviewed use case above; do not broaden the global exception list.
