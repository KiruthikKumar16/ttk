# User offboarding

1. An authorized admin with MFA changes the departing user's profile role to the least-privileged state or disables access using the supported admin workflow.
2. Revoke active Supabase sessions/sign out the account. A role change may not immediately update an already-issued JWT; require a fresh session for role-sensitive actions.
3. Remove the account from GitHub, Vercel, Supabase, Sentry, Upstash, and other operational tools according to the person's access list.
4. Rotate shared credentials the person could access. Check GitHub Environment reviewers, Supabase project membership, Vercel team membership, and recovery contacts.
5. Verify the account cannot sign in and cannot call protected APIs. Preserve audit history and required business records; do not delete financial or audit data as an offboarding shortcut.
6. Record the approver, completion time, session revocation, and systems checked in the restricted operations log.
