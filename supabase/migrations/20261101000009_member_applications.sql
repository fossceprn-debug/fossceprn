-- ============================================================================
-- FOSS CEPrn — Migration: 20261101000009_member_applications.sql
-- Description: Creates member_applications table for student membership interest,
--              sets up RLS policies, stored procedure for approval + credential provisioning,
--              and seeds initial realistic applications.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  github_url TEXT,
  interest TEXT NOT NULL DEFAULT 'Web & Open Source',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_apps_status ON public.member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_apps_email ON public.member_applications(email);
CREATE INDEX IF NOT EXISTS idx_member_apps_created ON public.member_applications(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_member_applications_updated_at ON public.member_applications;
CREATE TRIGGER update_member_applications_updated_at
  BEFORE UPDATE ON public.member_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.member_applications ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public or prospective student) can submit an application
DROP POLICY IF EXISTS "Public can submit member applications" ON public.member_applications;
CREATE POLICY "Public can submit member applications"
  ON public.member_applications FOR INSERT
  WITH CHECK (true);

-- 2. Admins and Editors can view applications
DROP POLICY IF EXISTS "Admins can view member applications" ON public.member_applications;
CREATE POLICY "Admins can view member applications"
  ON public.member_applications FOR SELECT
  USING (public.is_admin() OR public.is_editor());

-- 3. Only Admins can update or delete applications
DROP POLICY IF EXISTS "Admins can update member applications" ON public.member_applications;
CREATE POLICY "Admins can update member applications"
  ON public.member_applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete member applications" ON public.member_applications;
CREATE POLICY "Admins can delete member applications"
  ON public.member_applications FOR DELETE
  USING (public.is_admin());

-- 4. Stored Procedure: Admin Approves Application & Provisions User ID, Password & Role
CREATE OR REPLACE FUNCTION public.admin_approve_member_application(
  p_application_id UUID,
  p_password TEXT,
  p_role TEXT DEFAULT 'member',
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app RECORD;
  v_user_id UUID;
  v_encrypted_pwd TEXT;
  v_clean_role TEXT;
BEGIN
  -- Verify caller is admin or super_admin
  IF NOT (public.is_admin() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Only chapter administrators can approve applications.';
  END IF;

  -- Fetch application
  SELECT * INTO v_app FROM public.member_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member application not found.';
  END IF;

  v_clean_role := LOWER(TRIM(p_role));
  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'member') THEN
    v_clean_role := 'member';
  END IF;

  -- Encrypt password
  v_encrypted_pwd := crypt(p_password, gen_salt('bf', 10));

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = LOWER(TRIM(v_app.email));

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      LOWER(TRIM(v_app.email)),
      v_encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_app.full_name),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object('full_name', v_app.full_name),
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  -- Create or activate profile in public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    department,
    semester,
    github_url,
    membership_status
  ) VALUES (
    v_user_id,
    LOWER(TRIM(v_app.email)),
    v_app.full_name,
    v_app.department,
    v_app.semester,
    v_app.github_url,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      department = EXCLUDED.department,
      semester = EXCLUDED.semester,
      github_url = COALESCE(EXCLUDED.github_url, profiles.github_url),
      membership_status = 'active',
      updated_at = NOW();

  -- Assign role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT (user_id, role) DO UPDATE
  SET role = EXCLUDED.role;

  -- Update application status
  UPDATE public.member_applications
  SET status = 'approved',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      updated_at = NOW()
  WHERE id = p_application_id;

  -- Log security audit
  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'Approved Member Application & Issued Login',
    'profiles',
    v_user_id::TEXT,
    jsonb_build_object(
      'email', v_app.email,
      'name', v_app.full_name,
      'role', v_clean_role
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', LOWER(TRIM(v_app.email)),
    'full_name', v_app.full_name,
    'role', v_clean_role,
    'message', 'Application approved and login credentials successfully activated.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_member_application TO authenticated;

-- 5. Seed realistic student applications
INSERT INTO public.member_applications (
  full_name,
  email,
  department,
  semester,
  github_url,
  interest,
  notes,
  status
) VALUES 
(
  'Ananthu S',
  'ananthu.s@perumonec.ac.in',
  'Computer Science & Engineering',
  'S3',
  'https://github.com/ananthu-s',
  'Web & Open Source',
  'Keen to learn React and contribute to campus open source software. Attended the Linux installation fest.',
  'pending'
),
(
  'Devika Menon',
  'devika.menon@perumonec.ac.in',
  'Information Technology',
  'S1',
  'https://github.com/devikamenon',
  'Cyber Security & Networking',
  'Interested in ethical hacking, FOSS security tooling, and organizing introductory privacy sessions.',
  'pending'
),
(
  'Kiran Raj',
  'kiran.raj@perumonec.ac.in',
  'Electronics & Communication',
  'S5',
  'https://github.com/kiranraj',
  'Systems & Linux',
  'Building embedded Linux systems with Raspberry Pi and looking to collaborate with FOSS CEPrn team.',
  'pending'
)
ON CONFLICT DO NOTHING;

