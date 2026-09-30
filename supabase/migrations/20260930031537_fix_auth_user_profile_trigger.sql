-- Auth inserts run as supabase_auth_admin, which cannot insert into profiles
-- under the caller's RLS permissions. Run this narrowly scoped trigger as its
-- postgres owner, with a pinned search path and no client-facing EXECUTE grant.
alter function public.handle_new_user() security definer;
alter function public.handle_new_user() set search_path = '';

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
