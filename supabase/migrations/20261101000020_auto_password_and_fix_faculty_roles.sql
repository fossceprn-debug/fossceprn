-- ============================================================================
-- Migration: 20261101000020_auto_password_and_fix_faculty_roles.sql
-- Description:
--   1. Ensures pgcrypto extension is installed.
--   2. Ensures all columns exist on public.execom_members (role, login_password, phone_number).
--   3. Updates user_roles check constraint to include 'faculty'.
--   4. Creates BEFORE trigger to auto-generate login_password & enforce faculty role.
--   5. Backfills all existing execom_members (Adithan, Anju V, Anjali, Abiya, Amal, Shefeena).
--   6. Creates AFTER trigger to sync auth.users, user_roles, and profiles automatically.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure columns exist on execom_members
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

-- 3. Database Trigger: Auto Password & Faculty Role Enforcement (BEFORE INSERT OR UPDATE)
CREATE OR REPLACE FUNCTION public.handle_execom_auto_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate secure password if null or empty
  IF NEW.login_password IS NULL OR TRIM(NEW.login_password) = '' THEN
    NEW.login_password := 'Foss@' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8);
  END IF;

  -- Default role assignment ONLY IF role is not explicitly specified
  IF NEW.role IS NULL OR TRIM(NEW.role) = '' THEN
    IF NEW.designation ILIKE '%faculty%' OR NEW.designation ILIKE '%staff advisor%' THEN
      NEW.role := 'faculty';
    ELSE
      NEW.role := 'editor';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_execom_auto_password ON public.execom_members;
CREATE TRIGGER trg_execom_auto_password
  BEFORE INSERT OR UPDATE ON public.execom_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_execom_auto_password();

-- 4. Correct all existing rows in execom_members
-- 4a. Update Faculty Coordinators to have role = 'faculty'
UPDATE public.execom_members
SET role = 'faculty'
WHERE (designation ILIKE '%faculty%' OR designation ILIKE '%staff advisor%')
  AND (role IS NULL OR role != 'faculty');

-- 4b. Fill in auto-passwords for any member currently lacking one
UPDATE public.execom_members
SET login_password = 'Foss@' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)
WHERE login_password IS NULL OR TRIM(login_password) = '';

-- 4c. Set known passwords for users who were missing them
UPDATE public.execom_members
SET login_password = 'Foss@Adithan2026'
WHERE email = 'adithyan@foss.in' AND (login_password IS NULL OR login_password LIKE 'Foss@%');

UPDATE public.execom_members
SET login_password = 'Foss@Anju2026'
WHERE email = 'anjuv@ceprn.co.in' AND (login_password IS NULL OR login_password LIKE 'Foss@%');

-- 5. Auto-provision auth.users and user_roles for every execom/faculty member
DO $$
DECLARE
  m RECORD;
  v_uid UUID;
  v_pwd_hash TEXT;
  v_email TEXT;
BEGIN
  FOR m IN SELECT id, full_name, email, login_password, role, designation FROM public.execom_members LOOP
    IF m.email IS NOT NULL AND TRIM(m.email) != '' THEN
      v_email := LOWER(TRIM(m.email));
      v_pwd_hash := crypt(COALESCE(m.login_password, 'Foss@2026'), gen_salt('bf', 10));

      -- Check if auth user exists by email
      SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

      IF v_uid IS NULL THEN
        v_uid := gen_random_uuid();
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
          v_email, v_pwd_hash, NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('full_name', m.full_name), NOW(), NOW(),
          '', '', '', ''
        );

        BEGIN
          INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
          ) VALUES (
            v_uid, v_uid,
            format('{"sub":"%s","email":"%s"}', v_uid::text, v_email)::jsonb,
            'email', v_uid::text, NOW(), NOW(), NOW()
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      ELSE
        UPDATE auth.users
        SET encrypted_password = v_pwd_hash,
            raw_user_meta_data = jsonb_build_object('full_name', m.full_name),
            updated_at = NOW()
        WHERE id = v_uid;
      END IF;

      -- Link user_id in execom_members
      UPDATE public.execom_members
      SET user_id = v_uid
      WHERE id = m.id AND (user_id IS NULL OR user_id != v_uid);

      -- Upsert role: clean and ensure current role is set
      DELETE FROM public.user_roles WHERE user_id = v_uid;
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_uid, COALESCE(m.role, 'editor'))
      ON CONFLICT DO NOTHING;

      -- Upsert profile
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, membership_status)
        VALUES (v_uid, v_email, m.full_name, 'active')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- 6. Trigger to keep auth.users in sync when any execom member is created/updated in future
CREATE OR REPLACE FUNCTION public.handle_execom_sync_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_uid UUID;
  v_pwd_hash TEXT;
  v_email TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  v_email := LOWER(TRIM(NEW.email));
  v_pwd_hash := crypt(COALESCE(NEW.login_password, 'Foss@2026'), gen_salt('bf', 10));

  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, v_pwd_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', NEW.full_name), NOW(), NOW(),
      '', '', '', ''
    );

    BEGIN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_uid, v_uid,
        format('{"sub":"%s","email":"%s"}', v_uid::text, v_email)::jsonb,
        'email', v_uid::text, NOW(), NOW(), NOW()
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  ELSE
    UPDATE auth.users
    SET encrypted_password = v_pwd_hash,
        raw_user_meta_data = jsonb_build_object('full_name', NEW.full_name),
        updated_at = NOW()
    WHERE id = v_uid;
  END IF;

  IF NEW.user_id IS NULL OR NEW.user_id != v_uid THEN
    UPDATE public.execom_members
    SET user_id = v_uid
    WHERE id = NEW.id;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = v_uid;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, COALESCE(NEW.role, 'editor'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, membership_status)
  VALUES (v_uid, v_email, NEW.full_name, 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_execom_sync_auth warning: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_execom_sync_auth ON public.execom_members;
CREATE TRIGGER trg_execom_sync_auth
  AFTER INSERT OR UPDATE ON public.execom_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_execom_sync_auth();

NOTIFY pgrst, 'reload schema';
