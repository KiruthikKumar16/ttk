-- Migration 0013: Create verifiable_documents table for document verification system

-- ════════════════════════════════════════════════════════════════════════════════════
--  1. Create verifiable_documents table
-- ══════════════════════════════════════════════════════════════════════════════════
create table if not exists public.verifiable_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('certificate', 'invoice')),
  reference_id text not null,
  verification_code text unique not null,
  status text not null check (status in ('active', 'revoked')) default 'active',
  issued_at timestamptz default now(),
  revoked_at timestamptz
);

-- Enable Row Level Security
alter table public.verifiable_documents enable row level security;
grant insert on public.verifiable_documents to authenticated;
grant select on public.verifiable_documents to authenticated;
grant select on public.verifiable_documents to service_role;

-- ═════════════════════════════════════════════════════════════════════════════════
--  2. Create policies for verifiable_documents
-- ═════════════════════════════════════════════════════════════════════════════════
-- Allow insert for authenticated users (admin, staff, trainer)
-- Certificate and payment routes run under authenticated sessions
create policy "Allow insert for authenticated users"
  on public.verifiable_documents for insert
  to authenticated
  with check (
    (
      select role from public.profiles where id = auth.uid()
    ) in ('admin', 'staff', 'trainer')
  );

-- Authenticated staff need codes to render invoices and certificates in the dashboard.
create policy "Staff can view document verification codes"
  on public.verifiable_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff', 'trainer')
    )
  );

-- Public verification itself uses a service-role lookup and returns only safe fields.
-- No update or delete policies are provided here.

-- ═════════════════════════════════════════════════════════════════════════════════
--  3. Create indexes for performance
-- ═════════════════════════════════════════════════════════════════════════════════
create index if not exists idx_verifiable_documents_verification_code
  on public.verifiable_documents(verification_code);

create index if not exists idx_verifiable_documents_doc_type_reference_id
  on public.verifiable_documents(doc_type, reference_id);

-- ═════════════════════════════════════════════════════════════════════════════════
--  4. Comments on usage
-- ═════════════════════════════════════════════════════════════════════════════════
-- The verification_code is generated in the application layer (not DB) to ensure
-- URL-safe, short strings (10-12 chars) with collision resistance via retry logic.
--
-- Public verification route uses service-role client to bypass RLS for lookup
-- but returns only safe, minimal fields (doc_type, reference_id, status, etc.).
--
-- Revocation would be handled by a separate route/admin function that updates
-- status to 'revoked' and sets revoked_at timestamp.
