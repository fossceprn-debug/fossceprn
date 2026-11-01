-- ============================================================================
-- FOSS CEPrn — Supabase PostgreSQL Row Level Security (RLS) Policies
-- Migration: 20261101000002_row_level_security.sql
-- Description: Strict access controls, public reads, profile privacy, and admin guards
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Admin Check Function
-- Evaluates if the executing or given user possesses the 'admin' or 'lead' role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('admin', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. PROFILES POLICIES
-- - Public can read member names and avatars (for community credit)
-- - Authenticated users can view their own full profile
-- - Authenticated users can edit only their own profile
-- ----------------------------------------------------------------------------
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. USER ROLES POLICIES
-- - Users can read their own roles
-- - Only admins can grant or modify roles
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. SITE SETTINGS POLICIES
-- - Public read
-- - Admin write
-- ----------------------------------------------------------------------------
CREATE POLICY "Site settings are viewable by anyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update site settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. EVENTS POLICIES
-- - Public can view published events
-- - Admins can view drafts and manage all events
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (publication_status = 'published' OR public.is_admin());

CREATE POLICY "Only admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update events"
  ON public.events FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete events"
  ON public.events FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. PROJECTS POLICIES
-- - Public can view published projects
-- - Admins can view drafts and manage all projects
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (publication_status = 'published' OR public.is_admin());

CREATE POLICY "Only admins can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update projects"
  ON public.projects FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete projects"
  ON public.projects FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. EXECOM MEMBERS POLICIES
-- - Public can view active execom members
-- - Admins can view all and manage execom
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can view active execom members"
  ON public.execom_members FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can manage execom members"
  ON public.execom_members FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. GALLERY POLICIES
-- - Public read
-- - Admin write
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can view gallery items"
  ON public.gallery FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage gallery items"
  ON public.gallery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
