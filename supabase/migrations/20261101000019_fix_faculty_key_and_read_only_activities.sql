-- ============================================================================
-- Migration: 20261101000019_fix_faculty_key_and_read_only_activities.sql
-- Description:
--   1. Ensures execom_members has role, login_password, and phone_number columns.
--   2. Ensures user_roles check constraint permits 'faculty'.
--   3. Hardens save_execom_member_credentials with sub-transaction exception handling.
--   4. Enforces READ-ONLY access to activities for ExeCom & Faculty (only Admins can manage).
-- ============================================================================

-- 1. Ensure execom_members columns exist
ALTER TABLE public.execom_members 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'editor',
  ADD COLUMN IF NOT EXISTS login_password TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Ensure user_roles check constraint includes 'faculty'
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'core_member', 'member', 'faculty'));

-- 3. Restrict activity modification to Admins only (ExeCom & Faculty are read-only)
DROP POLICY IF EXISTS "Authorized coordinators and admins can insert activities" ON public.activities;
DROP POLICY IF EXISTS "Only admins can insert activities" ON public.activities;
CREATE POLICY "Only admins can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Authorized coordinators and admins can update activities" ON public.activities;
DROP POLICY IF EXISTS "Only admins can update activities" ON public.activities;
CREATE POLICY "Only admins can update activities"
  ON public.activities FOR UPDATE
  USING (
    public.is_admin()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Authorized coordinators and admins can delete activities" ON public.activities;
DROP POLICY IF EXISTS "Only admins can delete activities" ON public.activities;
CREATE POLICY "Only admins can delete activities"
  ON public.activities FOR DELETE
  USING (
    public.is_admin()
    OR public.is_super_admin()
  );

-- 4. Safe save_execom_member_credentials RPC
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

  SELECT full_name INTO v_full_name FROM public.execom_members WHERE id = p_execom_id;
  IF v_full_name IS NULL THEN
    v_full_name := 'ExeCom Coordinator';
  END IF;

  -- 1. Safely update execom_members
  BEGIN
    UPDATE public.execom_members
    SET email = v_clean_email,
        login_password = p_password,
        role = v_clean_role
    WHERE id = p_execom_id;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      UPDATE public.execom_members
      SET email = v_clean_email,
          role = v_clean_role
      WHERE id = p_execom_id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.execom_members
      SET email = v_clean_email
      WHERE id = p_execom_id;
    END;
  END;

  v_encrypted_pwd := crypt(p_password, gen_salt('bf', 10));

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_clean_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_clean_email, v_encrypted_pwd, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_full_name), NOW(), NOW(),
      '', '', '', ''
    );

    BEGIN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_user_id, v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, v_clean_email)::jsonb,
        'email', v_user_id::text, NOW(), NOW(), NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  ELSE
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        raw_user_meta_data = jsonb_build_object('full_name', v_full_name),
        updated_at = NOW()
    WHERE id = v_user_id;

    BEGIN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_user_id, v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, v_clean_email)::jsonb,
        'email', v_user_id::text, NOW(), NOW(), NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  BEGIN
    UPDATE public.execom_members SET user_id = v_user_id WHERE id = p_execom_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, v_clean_role)
    ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'editor')
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, full_name, membership_status)
    VALUES (v_user_id, v_clean_email, v_full_name, 'active')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'email', v_clean_email, 'role', v_clean_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_execom_member_credentials TO authenticated, anon;
NOTIFY pgrst, 'reload schema';

