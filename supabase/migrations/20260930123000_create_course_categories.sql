-- ══════════════════════════════════════════════════════════════════════════
-- Migration: Course Categories (Essential, Elite, Custom)
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  duration TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- Reading allowed for authenticated & anon (needed for course catalogs)
DROP POLICY IF EXISTS "Anyone can view course categories" ON public.course_categories;
CREATE POLICY "Anyone can view course categories"
  ON public.course_categories
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admin mutation permissions
DROP POLICY IF EXISTS "Admins can manage course categories" ON public.course_categories;
CREATE POLICY "Admins can manage course categories"
  ON public.course_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

GRANT SELECT ON public.course_categories TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.course_categories TO authenticated;
GRANT ALL ON public.course_categories TO service_role;

-- Add category_id to courses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_category_id ON public.courses(category_id);

-- Seed initial categories: Essential (6 weeks), Elite (12 weeks), and Internship (3 Months)
INSERT INTO public.course_categories (id, name, duration)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Essential', '6 weeks'),
  ('c0000000-0000-0000-0000-000000000002', 'Elite', '12 weeks'),
  ('c0000000-0000-0000-0000-000000000003', 'Internship', '3 Months')
ON CONFLICT (name) DO UPDATE
SET duration = EXCLUDED.duration;

-- Categorize existing courses:
-- 1. Any course with internship in name or description -> Internship
UPDATE public.courses
SET category_id = 'c0000000-0000-0000-0000-000000000003'
WHERE name ILIKE '%internship%' OR description ILIKE '%internship%';

-- 2. 12-week / multi-month courses -> Elite
UPDATE public.courses
SET category_id = 'c0000000-0000-0000-0000-000000000002'
WHERE category_id IS NULL AND (
  duration ILIKE '%12%' OR
  duration ILIKE '%3 month%' OR
  duration ILIKE '%6 month%' OR
  duration ILIKE '%month%'
);

-- 3. Rest -> Essential
UPDATE public.courses
SET category_id = 'c0000000-0000-0000-0000-000000000001'
WHERE category_id IS NULL;
