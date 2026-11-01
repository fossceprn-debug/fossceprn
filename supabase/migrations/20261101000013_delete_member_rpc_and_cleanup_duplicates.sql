-- ============================================================================
-- FOSS CEPrn — Delete Member RPC, RLS Policy & Clean Duplicate Users
-- Migration: 20261101000013_delete_member_rpc_and_cleanup_duplicates.sql
-- Description:
--   1. Adds DELETE RLS policy on public.profiles so admins can delete members.
--   2. Creates security definer RPC public.delete_member_completely(p_profile_id UUID).
--   3. Creates security definer RPC public.cleanup_duplicate_members().
--   4. Purges duplicate/test users for Abiya Daniel and malformed Amal handle entries.
-- ============================================================================

-- Step 1: Allow administrators to delete rows from public.profiles
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  USING (
    public.is_admin() 
    OR public.is_super_admin() 
    OR auth.uid() = id
  );

-- Step 2: Comprehensive member deletion stored procedure (handles profiles, roles, and auth records)
CREATE OR REPLACE FUNCTION public.delete_member_completely(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Verify caller has admin privileges
  IF NOT (public.is_admin() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Only chapter administrators can delete members.';
  END IF;

  -- 1. Remove from execom_members if linked
  DELETE FROM public.execom_members WHERE user_id = p_profile_id;

  -- 2. Remove roles
  DELETE FROM public.user_roles WHERE user_id = p_profile_id;

  -- 3. Remove profile
  DELETE FROM public.profiles WHERE id = p_profile_id;

  -- 4. Remove auth identities and user
  DELETE FROM auth.identities WHERE user_id = p_profile_id;
  DELETE FROM auth.users WHERE id = p_profile_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_member_completely(UUID) TO authenticated, anon;

-- Step 3: Stored procedure to clean up duplicate/test users
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_members()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_del_users UUID[];
  v_count INT := 0;
BEGIN
  -- Identify user IDs to purge:
  -- 1. Abiya Daniel (both abiya@fossceprn.com and hackceprn@gmail.com)
  -- 2. Duplicate non-RFC handles for Amal (amal@fossceprn, amaldev@fossceprn)
  SELECT ARRAY_AGG(id) INTO v_del_users
  FROM public.profiles
  WHERE email IN (
    'abiya@fossceprn.com',
    'hackceprn@gmail.com',
    'amal@fossceprn',
    'amaldev@fossceprn'
  ) OR full_name ILIKE '%abiya daniel%';

  IF v_del_users IS NOT NULL AND array_length(v_del_users, 1) > 0 THEN
    -- Delete from execom_members
    DELETE FROM public.execom_members WHERE user_id = ANY(v_del_users);

    -- Delete from user_roles
    DELETE FROM public.user_roles WHERE user_id = ANY(v_del_users);

    -- Delete from profiles
    DELETE FROM public.profiles WHERE id = ANY(v_del_users);
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Delete from auth identities and users
    DELETE FROM auth.identities WHERE user_id = ANY(v_del_users);
    DELETE FROM auth.users WHERE id = ANY(v_del_users);
  END IF;

  -- Also check auth.users directly by email in case profile was already removed
  DELETE FROM auth.identities 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('abiya@fossceprn.com', 'hackceprn@gmail.com', 'amal@fossceprn', 'amaldev@fossceprn')
  );

  DELETE FROM auth.users 
  WHERE email IN ('abiya@fossceprn.com', 'hackceprn@gmail.com', 'amal@fossceprn', 'amaldev@fossceprn');

  -- Also delete duplicate profiles with matching emails
  DELETE FROM public.profiles 
  WHERE email IN ('abiya@fossceprn.com', 'hackceprn@gmail.com', 'amal@fossceprn', 'amaldev@fossceprn')
     OR full_name ILIKE '%abiya daniel%';

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_duplicate_members() TO authenticated, anon;

-- Step 4: Run the cleanup now
SELECT public.cleanup_duplicate_members();

