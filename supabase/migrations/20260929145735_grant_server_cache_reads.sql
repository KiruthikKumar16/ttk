-- The shared Next.js cache may use service_role only for non-user-specific,
-- read-only course options and GST calculation fields after route authorization.
grant select on public.courses to service_role;
grant select (id, rate, enabled) on public.gst_settings to service_role;

comment on table public.courses is
  'Course catalog is readable by all application roles and by service_role for the authorized shared server cache.';
comment on column public.gst_settings.gstin is
  'Business identity data remains unavailable to the service_role cache; GSTIN reads use the caller RLS client.';
