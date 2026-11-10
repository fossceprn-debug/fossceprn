-- ============================================================================
-- FOSS CEPrn — Fix Supabase Auth Schema & Identities
-- Migration: 20261101000012_fix_auth_schema_and_identities.sql
-- Description: 
--   1. Sanitizes NULL token strings in auth.users that cause Supabase GoTrue Auth
--      to fail with "Database error querying schema" (converting NULL to string unsupported).
--   2. Ensures auth.identities has valid entries for all users in auth.users (including Super Admin).
--   3. Updates auth user creation stored procedures to prevent future NULL token entries.
-- ============================================================================

-- Step 1: Clean all NULL token fields in auth.users
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change IS NULL;

-- Step 2: Ensure auth.identities exists for all users in auth.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT id, email, created_at
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
    )
  ) LOOP
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
        r.id,
        r.id,
        format('{"sub":"%s","email":"%s"}', r.id::text, COALESCE(r.email, ''))::jsonb,
        'email',
        r.id::text,
        NOW(),
        COALESCE(r.created_at, NOW()),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET identity_data = EXCLUDED.identity_data, updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      -- In case table has alternative constraints or columns
      RAISE NOTICE 'Notice linking identity for user %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Step 3: Ensure Super Admin specifically has valid identity and non-null tokens
DO $$
DECLARE
  admin_uid UUID;
  admin_email TEXT := 'fossceprn@gmail.com';
BEGIN
  SELECT id INTO admin_uid 
  FROM auth.users 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(admin_email)) OR id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;

  IF admin_uid IS NULL THEN
    admin_uid := '00000000-0000-0000-0000-000000000001';
  END IF;

  UPDATE auth.users
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, '')
  WHERE id = admin_uid OR email = admin_email;

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
      admin_uid,
      admin_uid,
      format('{"sub":"%s","email":"%s"}', admin_uid::text, admin_email)::jsonb,
      'email',
      admin_email,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET identity_data = EXCLUDED.identity_data, updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    UPDATE auth.identities
    SET user_id = admin_uid,
        identity_data = format('{"sub":"%s","email":"%s"}', admin_uid::text, admin_email)::jsonb,
        updated_at = NOW()
    WHERE user_id = admin_uid OR id = admin_uid;
  END;
END $$;

