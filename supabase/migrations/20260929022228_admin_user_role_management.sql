create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$function$;
revoke all on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated;

create policy profiles_admin_read on public.profiles
  for select to authenticated using ((select public.is_current_user_admin()));

-- Change a profile role and write the audit entry atomically. The function is
-- intentionally callable only by an authenticated admin with a current AAL2 JWT.
create or replace function public.admin_change_profile_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_old_role text;
begin
  if v_actor is null or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception using errcode = '42501', message = 'AAL2 authentication is required';
  end if;
  if p_role not in ('admin', 'staff', 'trainer') then
    raise exception using errcode = '22023', message = 'Invalid profile role';
  end if;
  if p_user_id = v_actor then
    raise exception using errcode = '22023', message = 'You cannot change your own role';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin-profile-role-change'));
  if not exists (select 1 from public.profiles where id = v_actor and role = 'admin') then
    raise exception using errcode = '42501', message = 'Admin access is required';
  end if;

  select role into v_old_role from public.profiles where id = p_user_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;
  if v_old_role = p_role then return; end if;
  if v_old_role = 'admin' and p_role <> 'admin'
    and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception using errcode = '23514', message = 'At least one admin account must remain';
  end if;

  update public.profiles set role = p_role where id = p_user_id;
  insert into public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  values ('profiles', p_user_id, 'update', v_actor,
    pg_catalog.jsonb_build_object('role', v_old_role),
    pg_catalog.jsonb_build_object('role', p_role));
end;
$function$;

revoke all on function public.admin_change_profile_role(uuid, text) from public, anon;
grant execute on function public.admin_change_profile_role(uuid, text) to authenticated;
