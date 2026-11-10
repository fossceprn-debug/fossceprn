-- ============================================================================
-- FOSS CEPrn — Faculty Coordinator Role, Permissions & Stored Procedures
-- Migration: 20261101000017_faculty_role_and_permissions.sql
-- Description: 
--  1. Ensures user_roles check constraint whitelists 'faculty'
--  2. Updates get_user_role to recognize 'faculty'
--  3. Whitelists 'faculty' in admin_provision_execom_user & save_execom_member_credentials
--  4. Updates verify_execom_login to return 'faculty' role when applicable
--  5. Updates RLS policies to grant Faculty read-only oversight across events, 
--     announcements, execom members, activity logs, and activities
-- ============================================================================

-- 1. Ensure user_roles check constraint includes 'faculty'
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'core_member', 'member', 'faculty'));

-- 2. Update get_user_role priority
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  highest_role TEXT;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO highest_role
  FROM public.user_roles
  WHERE user_id = check_user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'lead' THEN 3
      WHEN 'editor' THEN 4
      WHEN 'faculty' THEN 5
      WHEN 'core_member' THEN 6
      WHEN 'viewer' THEN 7
      ELSE 8
    END
  LIMIT 1;

  RETURN highest_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update admin_provision_execom_user to whitelist 'faculty' and persist role
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
  v_auth_email TEXT;
  v_clean_role TEXT;
BEGIN
  IF NOT (
    public.is_admin() OR 
    public.is_super_admin() OR 
    (COALESCE(auth.jwt() ->> 'email', '') = 'fossceprn@gmail.com') OR
    (auth.uid() = '00000000-0000-0000-0000-000000000001'::uuid)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only chapter administrators can provision login accounts.';
  END IF;

  v_clean_email := LOWER(TRIM(p_email));
  v_clean_role := LOWER(TRIM(p_role));

  IF v_clean_email NOT LIKE '%@%' THEN
    v_auth_email := v_clean_email || '@fossceprn.com';
  ELSIF v_clean_email NOT LIKE '%.%' THEN
    v_auth_email := v_clean_email || '.com';
  ELSE
    v_auth_email := v_clean_email;
  END IF;

  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'faculty') THEN
    v_clean_role := 'editor';
  END IF;

  v_encrypted_pwd := crypt(p_password, gen_salt('bf', 10));

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_auth_email OR email = v_clean_email;

  IF v_user_id IS NULL AND p_execom_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id FROM public.execom_members WHERE id = p_execom_id;
  END IF;

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
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_auth_email,
      v_encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name),
      NOW(),
      NOW(),
      '', '', '', ''
    );

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
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_auth_email)::jsonb,
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users
    SET email = v_auth_email,
        encrypted_password = v_encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        raw_user_meta_data = jsonb_build_object('full_name', p_full_name),
        updated_at = NOW()
    WHERE id = v_user_id;

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
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_auth_email)::jsonb,
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET identity_data = format('{"sub":"%s","email":"%s"}', v_user_id::text, v_auth_email)::jsonb,
        updated_at = NOW();
  END IF;

  INSERT INTO public.profiles (id, email, full_name, membership_status)
  VALUES (v_user_id, v_clean_email, p_full_name, 'active')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT (user_id, role) DO UPDATE
  SET role = EXCLUDED.role;

  IF p_execom_id IS NOT NULL THEN
    UPDATE public.execom_members
    SET user_id = v_user_id,
        email = v_clean_email,
        role = v_clean_role
    WHERE id = p_execom_id;
  END IF;

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

-- 4. Update save_execom_member_credentials to whitelist 'faculty' and persist role
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

  UPDATE public.execom_members
  SET email = v_clean_email,
      login_password = p_password,
      role = v_clean_role
  WHERE id = p_execom_id;

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

  UPDATE public.execom_members 
  SET user_id = v_user_id,
      role = v_clean_role
  WHERE id = p_execom_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT (user_id, role) DO UPDATE
  SET role = EXCLUDED.role;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_clean_email,
    'role', v_clean_role
  );
END;
$$;

-- 5. Update verify_execom_login to return role dynamically (faculty or editor)
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
  SELECT m.id, m.full_name, m.email, m.designation, m.login_password, m.user_id, m.role
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
          'role', COALESCE(v_member.role, CASE WHEN v_member.designation ILIKE '%faculty%' OR v_member.designation ILIKE '%staff advisor%' THEN 'faculty' ELSE 'editor' END)
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

-- 6. Update RLS policies to grant Faculty read-only oversight
DROP POLICY IF EXISTS "Active execom viewable by everyone" ON public.execom_members;
CREATE POLICY "Active execom viewable by everyone"
  ON public.execom_members FOR SELECT 
  USING (is_active = true OR public.is_admin() OR public.is_faculty() OR public.is_editor());

DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT 
  USING (publication_status = 'published' OR public.is_admin() OR public.is_faculty() OR public.is_editor());

DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT 
  USING (publication_status = 'published' OR public.is_admin() OR public.is_faculty() OR public.is_editor());

DROP POLICY IF EXISTS "Public can view published announcements" ON public.announcements;
CREATE POLICY "Public can view published announcements"
  ON public.announcements FOR SELECT
  USING (publication_status = 'published' OR public.is_editor() OR public.is_faculty());

DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin() OR public.is_editor() OR public.is_faculty());

NOTIFY pgrst, 'reload schema';

