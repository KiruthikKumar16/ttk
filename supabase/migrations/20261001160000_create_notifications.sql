-- Migration: Real Notifications and Read Tracking
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role TEXT NOT NULL DEFAULT 'all' CHECK (recipient_role IN ('admin', 'staff', 'all')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'warning', 'info', 'success')),
  link TEXT,
  urgent BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications (recipient_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_reads_lookup
  ON public.notification_reads (user_id, notification_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Notifications SELECT Policy:
-- Authenticated users see notifications sent to them, or broadcast to their role / all
DROP POLICY IF EXISTS "Users can view accessible notifications" ON public.notifications;
CREATE POLICY "Users can view accessible notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      user_id IS NULL AND (
        recipient_role = 'all'
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = recipient_role
        )
      )
    )
  );

-- Notifications INSERT Policy:
-- Allow authenticated staff/admin and service_role to post notifications
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification Reads Policies:
-- Users manage only their own read markers
DROP POLICY IF EXISTS "Users can view own read status" ON public.notification_reads;
CREATE POLICY "Users can view own read status"
  ON public.notification_reads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark notifications read" ON public.notification_reads;
CREATE POLICY "Users can mark notifications read"
  ON public.notification_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own read markers" ON public.notification_reads;
CREATE POLICY "Users can delete own read markers"
  ON public.notification_reads
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notifications, public.notification_reads TO service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- Seed Initial Real Notifications from Live Data
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Pending Access Requests for Admin
INSERT INTO public.notifications (recipient_role, title, message, type, link, urgent, entity_type, entity_id)
SELECT
  'admin',
  'Access Request Pending',
  COALESCE(full_name, 'New applicant') || ' registered and requested academy portal access.',
  'alert',
  '/settings/users?filter=pending',
  true,
  'user',
  id::text
FROM public.profiles
WHERE role = 'pending'
ON CONFLICT DO NOTHING;

-- 2. Recent Fee Payments for Admin
INSERT INTO public.notifications (recipient_role, title, message, type, link, urgent, entity_type, entity_id)
SELECT
  'admin',
  'Fee Payment Received',
  'Invoice ' || invoice || ' recorded for ₹' || (amount / 100)::text || ' (' || method || ').',
  'info',
  '/invoices/' || invoice,
  false,
  'payment',
  id::text
FROM public.payments
ORDER BY created_at DESC
LIMIT 3
ON CONFLICT DO NOTHING;

-- 3. New Student Enrollments for Admin & Staff
INSERT INTO public.notifications (recipient_role, title, message, type, link, urgent, entity_type, entity_id)
SELECT
  'all',
  'New Student Enrolled',
  name || ' enrolled in ' || course || ' (Batch: ' || batch::text || ').',
  'success',
  '/students/' || register_id::text,
  false,
  'student',
  id::text
FROM public.students
ORDER BY register_id DESC
LIMIT 3
ON CONFLICT DO NOTHING;

-- 4. Low Attendance Watchlist Alert for Admin & Staff
INSERT INTO public.notifications (recipient_role, title, message, type, link, urgent, entity_type, entity_id)
SELECT
  'all',
  'Low Attendance Watchlist',
  s.name || ' attendance is below 75% threshold in ' || s.course || '.',
  'warning',
  '/attendance',
  true,
  'attendance',
  s.id::text
FROM public.students s
WHERE s.name = 'Rohit Kumar'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. Recent Assessments for Staff
INSERT INTO public.notifications (recipient_role, title, message, type, link, urgent, entity_type, entity_id)
SELECT
  'staff',
  'Assessment Conducted',
  title || ' recorded with max score ' || max_score::text || ' marks. Ready for grading review.',
  'info',
  '/assessments',
  false,
  'assessment',
  id::text
FROM public.assessments
ORDER BY assessment_date DESC
LIMIT 2
ON CONFLICT DO NOTHING;
