-- ============================================================================
-- FOSS CEPrn — Phase 2 Admin Panel Database Migration
-- Migration: 20261101000006_phase2_admin.sql
-- Description: Adds announcements, activity_logs, updates user_roles for Phase 2 roles
--              (super_admin, admin, editor, viewer), adds featured flag to projects,
--              and sets up RLS policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. UPDATE USER ROLES TABLE & ROLE DEFINITIONS
-- ----------------------------------------------------------------------------
-- Alter role check constraint to support Phase 2 roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'core_member', 'member'));

-- Upgrade default admin (fossceprn@gmail.com) to super_admin and clean up duplicate roles
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'fossceprn@gmail.com';
  IF v_admin_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = v_admin_id AND role <> 'super_admin';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. ENHANCE PROFILES TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'inactive', 'pending'));

-- ----------------------------------------------------------------------------
-- 3. ENHANCE PROJECTS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- 4. CREATE ANNOUNCEMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'event')),
  publication_status TEXT NOT NULL DEFAULT 'published' 
    CHECK (publication_status IN ('draft', 'published', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  link_url TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(publication_status);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. CREATE ACTIVITY LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs(actor_id);

-- ----------------------------------------------------------------------------
-- 6. SECURITY HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
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
      WHEN 'core_member' THEN 5
      WHEN 'viewer' THEN 6
      ELSE 7
    END
  LIMIT 1;

  RETURN highest_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('super_admin', 'admin', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('super_admin', 'admin', 'editor', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on new tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Announcements RLS
DROP POLICY IF EXISTS "Public can view published announcements" ON public.announcements;
CREATE POLICY "Public can view published announcements"
  ON public.announcements FOR SELECT
  USING (publication_status = 'published' OR public.is_editor());

DROP POLICY IF EXISTS "Editors and Admins can insert announcements" ON public.announcements;
CREATE POLICY "Editors and Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors and Admins can update announcements" ON public.announcements;
CREATE POLICY "Editors and Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (public.is_editor())
  WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Only Admins can delete announcements" ON public.announcements;
CREATE POLICY "Only Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (public.is_admin());

-- Activity Logs RLS
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin() OR public.is_editor());

DROP POLICY IF EXISTS "Authenticated users with role can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users with role can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- User Roles: Only super_admin can modify roles
DROP POLICY IF EXISTS "Only super_admin can manage roles" ON public.user_roles;
CREATE POLICY "Only super_admin can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Profiles: Admins can update any profile (for member management)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin() OR auth.uid() = id)
  WITH CHECK (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = id);

