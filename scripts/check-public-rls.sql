do $$
declare
  v_unprotected text;
begin
  select string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by c.relname)
    into v_unprotected
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity;

  if v_unprotected is not null then
    raise exception 'Public tables without row-level security: %', v_unprotected;
  end if;
end
$$;
