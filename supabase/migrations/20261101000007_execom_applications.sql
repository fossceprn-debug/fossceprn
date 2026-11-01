-- ============================================================================
-- FOSS CEPrn — Migration: 20261101000007_execom_applications.sql
-- Description: Creates execom_applications table for student leadership
--              applications, sets up RLS policies, and inserts seed applicants.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.execom_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  desired_role TEXT NOT NULL,
  github_url TEXT,
  linkedin_url TEXT,
  statement_of_purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_execom_apps_status ON public.execom_applications(status);
CREATE INDEX IF NOT EXISTS idx_execom_apps_created ON public.execom_applications(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_execom_applications_updated_at ON public.execom_applications;
CREATE TRIGGER update_execom_applications_updated_at
  BEFORE UPDATE ON public.execom_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.execom_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an ExeCom application
DROP POLICY IF EXISTS "Anyone can submit an execom application" ON public.execom_applications;
CREATE POLICY "Anyone can submit an execom application"
  ON public.execom_applications FOR INSERT
  WITH CHECK (true);

-- Admins and Editors can view applications
DROP POLICY IF EXISTS "Admins can view execom applications" ON public.execom_applications;
CREATE POLICY "Admins can view execom applications"
  ON public.execom_applications FOR SELECT
  USING (public.is_admin() OR public.is_editor());

-- Only Admins can update or delete applications
DROP POLICY IF EXISTS "Admins can update execom applications" ON public.execom_applications;
CREATE POLICY "Admins can update execom applications"
  ON public.execom_applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete execom applications" ON public.execom_applications;
CREATE POLICY "Admins can delete execom applications"
  ON public.execom_applications FOR DELETE
  USING (public.is_admin());

-- Seed sample realistic applicants from College of Engineering Perumon
-- Clean up any legacy demo/fake applicants
DELETE FROM public.execom_applications 
WHERE email IN (
  'adithya.krishna@perumonec.ac.in',
  'meera.nair@perumonec.ac.in',
  'naveen.prasad@perumonec.ac.in'
);

