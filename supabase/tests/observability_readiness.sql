begin;
select plan(4);

select has_column('public', 'audit_log', 'request_id', 'audit rows store the correlation request ID');
select has_function('public', 'get_app_readiness', array['text'], 'readiness RPC accepts the expected migration version');
select ok(
  not has_function_privilege('anon', 'public.get_app_readiness(text)', 'EXECUTE'),
  'anonymous callers cannot execute the readiness RPC'
);
select is(
  (select migration_matches from public.get_app_readiness('20260930150000')),
  true,
  'readiness RPC recognizes the latest migration version'
);

select * from finish();
rollback;
