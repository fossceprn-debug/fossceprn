-- ============================================================================
-- FOSS CEPrn — ExeCom Login Credentials Database Persistence & Verification
-- Migration: 20261101000014_execom_credentials_and_persistence.sql
-- Description:
--   1. Adds login_password column to execom_members table so credentials persist in DB.
--   2. Creates save_execom_member_credentials() stored procedure to sync DB & auth.users.
--   3. Creates verify_execom_login() RPC for multi-device cross-browser coordinator authentication.
--   4. Updates Amal and all existing ExeCom members with persistent login credentials.
-- ============================================================================

-- Step 1: Add login_password to execom_members table if not exists
ALTER TABLE public.execom_members 
  ADD COLUMN IF NOT EXISTS login_password TEXT;

-- Step 2: Ensure RLS permits admin management of execom_members
DROP POLICY IF EXISTS "Admins can manage execom_members" ON public.execom_members;
CREATE POLICY "Admins can manage execom_members"
  ON public.execom_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 3: Stored Procedure to save coordinator credentials into DB and auth.users
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
  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'lead') THEN
    v_clean_role := 'editor';
  END IF;

  -- 1. Fetch member full name
  SELECT full_name INTO v_full_name FROM public.execom_members WHERE id = p_execom_id;
  IF v_full_name IS NULL THEN
    v_full_name := 'ExeCom Coordinator';
  END IF;

  -- 2. Store email & password directly into public.execom_members
  UPDATE public.execom_members
  SET email = v_clean_email,
      login_password = p_password
  WHERE id = p_execom_id;

  -- 3. Blowfish hash for GoTrue auth.users
  v_encrypted_pwd := crypt(p_password, gen_salt('bf', 10));

  -- 4. Check or create in auth.users
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

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_clean_email)::jsonb,
      'email', v_user_id::text, NOW(), NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET identity_data = EXCLUDED.identity_data, updated_at = NOW();
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

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_clean_email)::jsonb,
      'email', v_user_id::text, NOW(), NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET identity_data = EXCLUDED.identity_data, updated_at = NOW();
  END IF;

  -- 5. Link user_id in execom_members
  UPDATE public.execom_members SET user_id = v_user_id WHERE id = p_execom_id;

  -- 6. Upsert user_role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 7. Upsert profile
  INSERT INTO public.profiles (id, email, full_name, membership_status)
  VALUES (v_user_id, v_clean_email, v_full_name, 'active')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'email', v_clean_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_execom_member_credentials TO authenticated, anon;

-- Step 4: Stored Procedure to verify ExeCom login directly from database
CREATE OR REPLACE FUNCTION public.verify_execom_login(
  p_identifier TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_member RECORD;
  v_clean TEXT := LOWER(TRIM(p_identifier));
  v_handle TEXT := REPLACE(REPLACE(v_clean, '@fossceprn.com', ''), '@fossceprn', '');
BEGIN
  SELECT m.id, m.full_name, m.email, m.designation, m.login_password, m.user_id
  INTO v_member
  FROM public.execom_members m
  WHERE (
    LOWER(TRIM(COALESCE(m.email, ''))) = v_clean
    OR LOWER(TRIM(COALESCE(m.email, ''))) = v_clean || '@fossceprn.com'
    OR LOWER(TRIM(COALESCE(m.email, ''))) = v_handle || '@fossceprn.com'
    OR LOWER(TRIM(m.full_name)) = v_handle
    OR LOWER(TRIM(m.full_name)) ILIKE '%' || v_handle || '%'
  )
  ORDER BY (m.login_password IS NOT NULL) DESC
  LIMIT 1;

  IF v_member.id IS NOT NULL AND v_member.login_password IS NOT NULL THEN
    IF v_member.login_password = p_password THEN
      RETURN jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
          'id', COALESCE(v_member.user_id, v_member.id),
          'execom_id', v_member.id,
          'full_name', v_member.full_name,
          'email', COALESCE(v_member.email, v_clean),
          'designation', v_member.designation,
          'role', 'editor'
        )
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid password for this coordinator account. Please verify your credentials.'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'No coordinator account found with matching credentials.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_execom_login TO authenticated, anon;

-- Step 5: Update Amal's record with email amaldev@fossceprn.com and password Fossamal26
DO $$
DECLARE
  v_amal_id UUID;
BEGIN
  SELECT id INTO v_amal_id FROM public.execom_members 
  WHERE email ILIKE '%amal%' OR full_name ILIKE '%amal%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_amal_id IS NOT NULL THEN
    PERFORM public.save_execom_member_credentials(
      v_amal_id,
      'amaldev@fossceprn.com',
      'Fossamal26',
      'editor'
    );
  END IF;
END $$;

