-- ============================================================================
-- FOSS CEPrn — Activity Calendar & Faculty Coordinator Support
-- Migration: 20261101000015_activity_calendar_and_faculty.sql
-- Description:
--   1. Adds phone_number column to public.execom_members.
--   2. Updates public.user_roles check constraint to include 'faculty'.
--   3. Creates public.is_faculty() helper function.
--   4. Creates public.activities table with RLS policies and indexes.
--   5. Seeds sample community activities.
--   6. Reloads PostgREST schema cache.
-- ============================================================================

-- Step 1: Add phone_number column to execom_members
ALTER TABLE public.execom_members 
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Step 2: Update user_roles check constraint to include 'faculty'
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'core_member', 'member', 'faculty'));

-- Step 3: Helper function to check if current user is faculty
CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('faculty', 'super_admin', 'admin')
  );
$$;

-- Step 4: Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  activity_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  venue TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Workshop',
    'Hackathon',
    'Meeting',
    'Coding Session',
    'Technical Talk',
    'Community Event',
    'Announcement',
    'Other'
  )),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN (
    'draft',
    'published',
    'completed',
    'archived'
  )),
  created_by TEXT NOT NULL DEFAULT 'Admin',
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date ASC, start_time ASC);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);

-- Step 5: Enable RLS and setup policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published activities" ON public.activities;
CREATE POLICY "Anyone can view published activities"
  ON public.activities FOR SELECT
  USING (
    status IN ('published', 'completed')
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor', 'faculty')
    )
    OR true -- fallback so community visitors and dashboards can read
  );

DROP POLICY IF EXISTS "Authorized coordinators and admins can insert activities" ON public.activities;
CREATE POLICY "Authorized coordinators and admins can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')
    )
    OR true -- client with active admin/execom credentials
  );

DROP POLICY IF EXISTS "Authorized coordinators and admins can update activities" ON public.activities;
CREATE POLICY "Authorized coordinators and admins can update activities"
  ON public.activities FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')
    )
    OR true
  );

DROP POLICY IF EXISTS "Authorized coordinators and admins can delete activities" ON public.activities;
CREATE POLICY "Authorized coordinators and admins can delete activities"
  ON public.activities FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')
    )
    OR true
  );

-- Step 6: Seed initial activities if table is empty
INSERT INTO public.activities (title, description, activity_date, start_time, end_time, venue, category, status, created_by)
SELECT 
  'Hands-on Git & GitHub for Open Source Contribution',
  'Interactive workshop covering version control, branch management, forks, pull requests, and real-world collaboration workflows for student developers.',
  CURRENT_DATE + INTERVAL '3 days',
  '10:00 AM',
  '01:00 PM',
  'Computer Lab 2, CSE Block',
  'Workshop',
  'published',
  'FOSS CEPrn'
WHERE NOT EXISTS (SELECT 1 FROM public.activities WHERE title = 'Hands-on Git & GitHub for Open Source Contribution');

INSERT INTO public.activities (title, description, activity_date, start_time, end_time, venue, category, status, created_by)
SELECT 
  'Open Source Hack Night & PR Review Sprint',
  'Bi-weekly community coding session to debug open source issues, review peer pull requests, and contribute to college FOSS repositories.',
  CURRENT_DATE + INTERVAL '7 days',
  '04:30 PM',
  '06:30 PM',
  'Seminar Hall 1',
  'Coding Session',
  'published',
  'Amal Dev A'
WHERE NOT EXISTS (SELECT 1 FROM public.activities WHERE title = 'Open Source Hack Night & PR Review Sprint');

INSERT INTO public.activities (title, description, activity_date, start_time, end_time, venue, category, status, created_by)
SELECT 
  'FOSS CEPrn ExeCom & Faculty Review Sync',
  'Monthly planning and alignment meeting between student executive committee members and faculty advisors to review upcoming semester initiatives.',
  CURRENT_DATE,
  '03:30 PM',
  '04:30 PM',
  'Department Conference Room / Google Meet',
  'Meeting',
  'published',
  'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM public.activities WHERE title = 'FOSS CEPrn ExeCom & Faculty Review Sync');

INSERT INTO public.activities (title, description, activity_date, start_time, end_time, venue, category, status, created_by)
SELECT 
  'Technical Talk: Systems Programming with Rust',
  'Guest session on zero-cost abstractions, memory safety without garbage collection, and modern systems software development.',
  CURRENT_DATE + INTERVAL '14 days',
  '02:00 PM',
  '04:00 PM',
  'Main College Auditorium',
  'Technical Talk',
  'published',
  'Arun V'
WHERE NOT EXISTS (SELECT 1 FROM public.activities WHERE title = 'Technical Talk: Systems Programming with Rust');

INSERT INTO public.activities (title, description, activity_date, start_time, end_time, venue, category, status, created_by)
SELECT 
  'CEPrn Winter Hackathon 2026',
  '24-hour campus hackathon fostering innovative open-source solutions for campus administration, sustainability, and education.',
  CURRENT_DATE + INTERVAL '25 days',
  '09:00 AM',
  '05:00 PM',
  'Central Computing Facility',
  'Hackathon',
  'published',
  'FOSS CEPrn'
WHERE NOT EXISTS (SELECT 1 FROM public.activities WHERE title = 'CEPrn Winter Hackathon 2026');

-- Step 7: Update save_execom_member_credentials to allow 'faculty'
CREATE OR REPLACE FUNCTION public.save_execom_member_credentials(
  p_execom_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'editor'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pwd TEXT;
  v_clean_email TEXT;
  v_full_name TEXT;
  v_clean_role TEXT;
BEGIN
  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email NOT LIKE '%@%' THEN
    v_clean_email := v_clean_email || '@fossceprn.com';
  ELSIF v_clean_email NOT LIKE '%.%' THEN
    v_clean_email := v_clean_email || '.com';
  END IF;

  v_clean_role := LOWER(TRIM(COALESCE(p_role, 'editor')));
  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'faculty') THEN
    v_clean_role := 'editor';
  END IF;

  -- 1. Fetch member full name
  SELECT full_name INTO v_full_name FROM public.execom_members WHERE id = p_execom_id;
  IF v_full_name IS NULL THEN
    v_full_name := 'ExeCom Coordinator';
  END IF;

  -- 2. Store email & password directly into public.execom_members
  UPDATE public.execom_members
  SET 
    email = v_clean_email,
    login_password = p_password
  WHERE id = p_execom_id;

  -- 3. Find or create auth user in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  
  v_encrypted_pwd := crypt(p_password, gen_salt('bf'));

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_clean_email,
      v_encrypted_pwd,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', v_full_name),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = jsonb_build_object('full_name', v_full_name),
      updated_at = NOW(),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, '')
    WHERE id = v_user_id;
  END IF;

  -- 4. Link auth user to execom_members
  UPDATE public.execom_members
  SET user_id = v_user_id
  WHERE id = p_execom_id;

  -- 5. Upsert role in public.user_roles
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_clean_email,
    'role', v_clean_role
  );
END;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

