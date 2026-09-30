begin;
select plan(2);

insert into public.verifiable_documents (doc_type, reference_id, verification_code, status, revoked_at)
values ('certificate', gen_random_uuid(), 'security-test-revoked-code', 'revoked', now());

select is(
  (select to_jsonb(result) from public.public_verify_document('security-test-unknown-code') as result),
  (select to_jsonb(result) from public.public_verify_document('security-test-revoked-code') as result),
  'unknown and revoked verification codes have identical public result shapes'
);

select is(
  (select count(*)::integer from information_schema.routine_privileges
   where routine_schema = 'public' and routine_name = 'public_verify_document'
     and grantee in ('anon', 'authenticated') and privilege_type = 'EXECUTE'),
  2,
  'only the intended public API roles receive execute on the verification function'
);

select * from finish();
rollback;
