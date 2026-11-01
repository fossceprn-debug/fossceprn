-- ============================================================================
-- FOSS CEPrn — Migration: 20261101000008_execom_credentials.sql
-- Description: Adds email and user_id to execom_members, creates administrative
--              function to provision credentials for ExeCom members, and seeds
--              a default ExeCom test coordinator login.
-- ============================================================================

-- 1. Enhance execom_members table with email and user_id
ALTER TABLE public.execom_members 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_execom_email ON public.execom_members(email);
CREATE INDEX IF NOT EXISTS idx_execom_user_id ON public.execom_members(user_id);

-- 2. Stored function for administrators to provision ExeCom logins
CREATE OR REPLACE FUNCTION public.admin_provision_execom_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'editor',
  p_execom_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pwd TEXT;
  v_clean_email TEXT;
  v_clean_role TEXT;
BEGIN
  -- Verify caller is admin or super_admin
  IF NOT (public.is_admin() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Only chapter administrators can provision login accounts.';
  END IF;

  v_clean_email := LOWER(TRIM(p_email));
  v_clean_role := LOWER(TRIM(p_role));

  -- Validate role is allowed
  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'lead') THEN
    v_clean_role := 'editor';
  END IF;

  -- Hash password with blowfish bcrypt (standard Supabase auth hashing)
  v_encrypted_pwd := crypt(p_password, gen_salt('bf', 10));

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_clean_email;

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
      v_clean_email,
      v_encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name),
      NOW(),
      NOW()
    );
  ELSE
    -- Update existing user's password and metadata
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object('full_name', p_full_name),
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  -- Ensure profile exists in public.profiles
  INSERT INTO public.profiles (id, email, full_name, membership_status)
  VALUES (v_user_id, v_clean_email, p_full_name, 'active')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = NOW();

  -- Upsert role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT (user_id, role) DO UPDATE
  SET role = EXCLUDED.role;

  -- Link with execom_members if execom_id was provided
  IF p_execom_id IS NOT NULL THEN
    UPDATE public.execom_members
    SET user_id = v_user_id,
        email = v_clean_email
    WHERE id = p_execom_id;
  END IF;

  -- Insert security audit log
  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'Provisioned ExeCom Credentials',
    'auth.users',
    v_user_id::TEXT,
    jsonb_build_object('email', v_clean_email, 'role', v_clean_role, 'full_name', p_full_name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_clean_email,
    'role', v_clean_role,
    'message', 'ExeCom credentials successfully configured.'
  );
END;
$$;

-- Grant execution to authenticated users (internal check handles permission)
GRANT EXECUTE ON FUNCTION public.admin_provision_execom_user TO authenticated;

-- 3. Seed Default ExeCom Coordinator Account for immediate testing
-- Email: techlead.foss@ceprn.ac.in
-- Password: execom@123
-- Role: editor
DO $$
DECLARE
  v_execom_uid UUID := gen_random_uuid();
  v_execom_email TEXT := 'techlead.foss@ceprn.ac.in';
  v_encrypted_pwd TEXT := crypt('execom@123', gen_salt('bf', 10));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_execom_email) THEN
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
      v_execom_uid,
      'authenticated',
      'authenticated',
      v_execom_email,
      v_encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Arun V (Technical Lead)"}'::jsonb,
      NOW(),
      NOW()
    );

    INSERT INTO public.profiles (id, email, full_name, department, semester)
    VALUES (v_execom_uid, v_execom_email, 'Arun V', 'Computer Science & Engineering', 'S7')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_execom_uid, 'editor')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.execom_members (
      full_name,
      designation,
      department,
      semester,
      email,
      user_id,
      display_order,
      is_active
    ) VALUES (
      'Arun V',
      'Technical Lead',
      'Computer Science & Engineering',
      'S7',
      v_execom_email,
      v_execom_uid,
      1,
      true
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

