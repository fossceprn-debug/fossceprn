-- ============================================================================
-- FOSS CEPrn — Migration: 20261101000010_seed_amal.sql
-- Description: Provision ExeCom Member 'Amal' with EDITOR privileges
-- Credentials:
--   Name: amal
--   Email / User ID: amal@fossceprn (normalized: amal@fossceprn.com)
--   Password: Fossamal26
--   Role: EDITOR
-- ============================================================================

DO $$
DECLARE
  v_uid UUID := '00000000-0000-0000-0000-000000000002'::UUID;
  v_email TEXT := 'amal@fossceprn.com';
  v_pwd_hash TEXT := crypt('Fossamal26', gen_salt('bf', 10));
  v_execom_id UUID := gen_random_uuid();
BEGIN
  -- 1. Ensure user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
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
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      v_pwd_hash,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Amal"}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
    UPDATE auth.users
    SET encrypted_password = v_pwd_hash,
        raw_user_meta_data = '{"full_name":"Amal"}'::jsonb,
        updated_at = NOW()
    WHERE id = v_uid;
  END IF;

  -- 2. Upsert Profile
  INSERT INTO public.profiles (id, email, full_name, membership_status)
  VALUES (v_uid, v_email, 'Amal', 'active')
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Amal',
      email = v_email,
      updated_at = NOW();

  -- 3. Upsert Role: editor
  DELETE FROM public.user_roles WHERE user_id = v_uid AND role <> 'editor';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'editor')
  ON CONFLICT (user_id, role) DO UPDATE
  SET role = 'editor';

  -- 4. Upsert into ExeCom members
  IF NOT EXISTS (SELECT 1 FROM public.execom_members WHERE email = v_email OR user_id = v_uid) THEN
    INSERT INTO public.execom_members (
      id,
      full_name,
      designation,
      department,
      semester,
      email,
      user_id,
      is_active,
      display_order
    ) VALUES (
      v_execom_id,
      'Amal',
      'Technical Coordinator',
      'Computer Science & Engineering',
      'S6',
      v_email,
      v_uid,
      TRUE,
      5
    );
  ELSE
    UPDATE public.execom_members
    SET full_name = 'Amal',
        designation = 'Technical Coordinator',
        user_id = v_uid,
        email = v_email,
        is_active = TRUE
    WHERE email = v_email OR user_id = v_uid;
  END IF;

END;
$$;

