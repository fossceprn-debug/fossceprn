-- ============================================================================
-- FOSS CEPrn — Default Administrator Migration
-- Migration: 20261101000005_default_admin.sql
-- Description: Seeds the default administrator credentials (fossceprn@gmail.com)
--              with bcrypt password hash for 'foss@123' into Supabase Auth & public.user_roles
-- ============================================================================

DO $$
DECLARE
  target_admin_uid UUID := '00000000-0000-0000-0000-000000000001';
  admin_email TEXT := 'fossceprn@gmail.com';
  encrypted_pwd TEXT := crypt('foss@123', gen_salt('bf', 10));
  v_existing_id UUID;
  v_existing_email_id UUID;
  v_final_uid UUID;
BEGIN
  -- Check if user exists by ID or by email
  SELECT id INTO v_existing_id FROM auth.users WHERE id = target_admin_uid;
  SELECT id INTO v_existing_email_id FROM auth.users WHERE LOWER(TRIM(email)) = LOWER(TRIM(admin_email));

  IF v_existing_email_id IS NOT NULL AND v_existing_id IS NOT NULL AND v_existing_email_id <> v_existing_id THEN
    -- In case of two different records, clean up duplicate placeholder ID
    DELETE FROM auth.identities WHERE user_id = v_existing_id;
    DELETE FROM public.user_roles WHERE user_id = v_existing_id;
    DELETE FROM public.profiles WHERE id = v_existing_id;
    DELETE FROM auth.users WHERE id = v_existing_id;
    v_final_uid := v_existing_email_id;
  ELSIF v_existing_email_id IS NOT NULL THEN
    v_final_uid := v_existing_email_id;
  ELSIF v_existing_id IS NOT NULL THEN
    v_final_uid := v_existing_id;
  ELSE
    v_final_uid := target_admin_uid;
  END IF;

  -- 1. Insert or update user in auth.users
  IF v_existing_id IS NOT NULL OR v_existing_email_id IS NOT NULL THEN
    UPDATE auth.users
    SET email = admin_email,
        encrypted_password = encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"full_name":"FOSS CEPrn Administrator"}'::jsonb,
        updated_at = NOW()
    WHERE id = v_final_uid;
  ELSE
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
      v_final_uid,
      'authenticated',
      'authenticated',
      admin_email,
      encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"FOSS CEPrn Administrator"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- 2. Ensure auth identity exists for GoTrue
  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_final_uid,
      v_final_uid,
      format('{"sub":"%s","email":"%s"}', v_final_uid::text, admin_email)::jsonb,
      'email',
      admin_email,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET identity_data = EXCLUDED.identity_data,
        updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        v_final_uid,
        v_final_uid,
        format('{"sub":"%s","email":"%s"}', v_final_uid::text, admin_email)::jsonb,
        'email',
        v_final_uid::text,
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (provider, provider_id) DO UPDATE
      SET user_id = v_final_uid,
          identity_data = EXCLUDED.identity_data,
          updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      UPDATE auth.identities
      SET user_id = v_final_uid,
          identity_data = format('{"sub":"%s","email":"%s"}', v_final_uid::text, admin_email)::jsonb,
          updated_at = NOW()
      WHERE user_id = v_final_uid OR id = v_final_uid;
    END;
  END;

  -- 3. Create or update profile in public.profiles
  INSERT INTO public.profiles (id, email, full_name, department, semester, membership_status)
  VALUES (v_final_uid, admin_email, 'FOSS CEPrn Administrator', 'Computer Science & Engineering', 'Faculty / Admin', 'active')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = 'FOSS CEPrn Administrator',
      membership_status = 'active',
      updated_at = NOW();

  -- 4. Grant 'super_admin' role in public.user_roles
  DELETE FROM public.user_roles WHERE user_id = v_final_uid AND role <> 'super_admin';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_final_uid, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

END $$;

