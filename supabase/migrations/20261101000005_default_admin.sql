-- ============================================================================
-- FOSS CEPrn — Default Administrator Migration
-- Migration: 20261101000005_default_admin.sql
-- Description: Seeds the default administrator credentials (fossceprn@gmail.com)
--              with bcrypt password hash for 'foss@123' into Supabase Auth & public.user_roles
-- ============================================================================

DO $$
DECLARE
  admin_uid UUID := '00000000-0000-0000-0000-000000000001';
  admin_email TEXT := 'fossceprn@gmail.com';
  -- Blowfish crypt hash of 'foss@123'
  encrypted_pwd TEXT := crypt('foss@123', gen_salt('bf', 10));
BEGIN
  -- 1. Insert into auth.users if not existing
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
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
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_uid,
      'authenticated',
      'authenticated',
      admin_email,
      encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"FOSS CEPrn Administrator"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  ELSE
    -- If user already exists, update password hash and confirmed status
    UPDATE auth.users
    SET encrypted_password = encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = admin_email
    RETURNING id INTO admin_uid;
  END IF;

  -- 2. Ensure profile exists in public.profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (admin_uid, admin_email, 'FOSS CEPrn Administrator')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = 'FOSS CEPrn Administrator',
      updated_at = NOW();

  -- 3. Grant 'super_admin' role in public.user_roles
  DELETE FROM public.user_roles WHERE user_id = admin_uid AND role <> 'super_admin';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_uid, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

END $$;

