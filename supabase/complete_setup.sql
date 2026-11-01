-- ============================================================================
-- FOSS CEPrn — Complete Database & Security Setup Script
-- Project: fngwxkuihlkfsiskicue (West EU - Paris)
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  department TEXT,
  semester TEXT,
  student_id TEXT,
  bio TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto profile creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'core_member', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'FOSS CEPrn',
  logo_url TEXT,
  description TEXT,
  contact_email TEXT,
  github_url TEXT,
  instagram_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  cover_image TEXT,
  venue TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  registration_status TEXT NOT NULL DEFAULT 'upcoming' 
    CHECK (registration_status IN ('upcoming', 'open', 'closing_soon', 'closed', 'ended')),
  publication_status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (publication_status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_publication ON public.events(publication_status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image TEXT,
  github_url TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  publication_status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (publication_status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_publication ON public.projects(publication_status);

-- EXECOM MEMBERS
CREATE TABLE IF NOT EXISTS public.execom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT,
  photo_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execom_active_order ON public.execom_members(is_active, display_order);

-- GALLERY
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery(category);

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Admin helper function
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User Roles Policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Site Settings Policies
DROP POLICY IF EXISTS "Site settings are viewable by anyone" ON public.site_settings;
CREATE POLICY "Site settings are viewable by anyone"
  ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;
CREATE POLICY "Only admins can update site settings"
  ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Events Policies
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT USING (publication_status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage events" ON public.events;
CREATE POLICY "Only admins can manage events"
  ON public.events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Projects Policies
DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT USING (publication_status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage projects" ON public.projects;
CREATE POLICY "Only admins can manage projects"
  ON public.projects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Execom Policies
DROP POLICY IF EXISTS "Active execom viewable by everyone" ON public.execom_members;
CREATE POLICY "Active execom viewable by everyone"
  ON public.execom_members FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage execom" ON public.execom_members;
CREATE POLICY "Only admins can manage execom"
  ON public.execom_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Gallery Policies
DROP POLICY IF EXISTS "Gallery viewable by everyone" ON public.gallery;
CREATE POLICY "Gallery viewable by everyone"
  ON public.gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage gallery" ON public.gallery;
CREATE POLICY "Only admins can manage gallery"
  ON public.gallery FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true),
  ('project-images', 'project-images', true),
  ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ----------------------------------------------------------------------------
-- 4. INITIAL SITE SETTINGS
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1) THEN
    INSERT INTO public.site_settings (site_name, logo_url, description, contact_email, github_url, instagram_url)
    VALUES (
      'FOSS CEPrn',
      '/foss-logo.svg',
      'Student-led open-source community at College of Engineering Perumon under the FOSS United Students Chapter.',
      'foss@perumonec.ac.in',
      'https://github.com/fossceprn',
      'https://instagram.com/fossceprn'
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. DEFAULT ADMINISTRATOR ACCOUNT
-- Email: fossceprn@gmail.com
-- Password: foss@123
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  admin_uid UUID := '00000000-0000-0000-0000-000000000001';
  admin_email TEXT := 'fossceprn@gmail.com';
  encrypted_pwd TEXT := crypt('foss@123', gen_salt('bf', 10));
BEGIN
  -- 1. Create user in auth.users if not exists
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
    UPDATE auth.users
    SET encrypted_password = encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = admin_email
    RETURNING id INTO admin_uid;
  END IF;

  -- 2. Create profile in public.profiles
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



-- ============================================================================
-- PHASE 2 EXTENSIONS & SCHEMA UPDATES
-- ============================================================================
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'lead', 'core_member', 'member'));

-- Ensure fossceprn@gmail.com has super_admin role and clean up duplicate roles
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

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'inactive', 'pending'));

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

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

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin() OR public.is_editor());

DROP POLICY IF EXISTS "Authenticated users with role can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users with role can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only super_admin can manage roles" ON public.user_roles;
CREATE POLICY "Only super_admin can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin() OR auth.uid() = id)
  WITH CHECK (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = id);


-- ============================================================================
-- EXECOM APPLICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.execom_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  desired_role TEXT NOT NULL,
  github_url TEXT,
  linkedin_url TEXT,
  statement_of_purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execom_apps_status ON public.execom_applications(status);
CREATE INDEX IF NOT EXISTS idx_execom_apps_created ON public.execom_applications(created_at DESC);

DROP TRIGGER IF EXISTS update_execom_applications_updated_at ON public.execom_applications;
CREATE TRIGGER update_execom_applications_updated_at
  BEFORE UPDATE ON public.execom_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.execom_applications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.execom_applications TO authenticated;
GRANT INSERT, SELECT ON public.execom_applications TO anon;

DROP POLICY IF EXISTS "Anyone can submit an execom application" ON public.execom_applications;
CREATE POLICY "Anyone can submit an execom application"
  ON public.execom_applications FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view execom applications" ON public.execom_applications;
CREATE POLICY "Admins can view execom applications"
  ON public.execom_applications FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can update execom applications" ON public.execom_applications;
CREATE POLICY "Admins can update execom applications"
  ON public.execom_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete execom applications" ON public.execom_applications;
CREATE POLICY "Admins can delete execom applications"
  ON public.execom_applications FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Clean up any legacy demo/fake applicants
DELETE FROM public.execom_applications 
WHERE email IN (
  'adithya.krishna@perumonec.ac.in',
  'meera.nair@perumonec.ac.in',
  'naveen.prasad@perumonec.ac.in'
);


-- ============================================================================
-- EXECOM CREDENTIAL PROVISIONING
-- ============================================================================
ALTER TABLE public.execom_members 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_execom_email ON public.execom_members(email);
CREATE INDEX IF NOT EXISTS idx_execom_user_id ON public.execom_members(user_id);

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

  -- Normalize to RFC compliant email for auth.users
  IF v_clean_email NOT LIKE '%@%' THEN
    v_auth_email := v_clean_email || '@fossceprn.com';
  ELSIF v_clean_email NOT LIKE '%.%' THEN
    v_auth_email := v_clean_email || '.com';
  ELSE
    v_auth_email := v_clean_email;
  END IF;

  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'lead') THEN
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
      updated_at
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
      NOW()
    );

    -- Insert into auth.identities so Supabase GoTrue Auth does not fail
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_auth_email)::jsonb,
      'email',
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
        raw_user_meta_data = jsonb_build_object('full_name', p_full_name),
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Upsert identity
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_auth_email)::jsonb,
      'email',
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
        email = v_clean_email
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

GRANT EXECUTE ON FUNCTION public.admin_provision_execom_user TO anon, authenticated;


-- ============================================================================
-- MEMBER APPLICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  github_url TEXT,
  interest TEXT NOT NULL DEFAULT 'Web & Open Source',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_apps_status ON public.member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_apps_email ON public.member_applications(email);
CREATE INDEX IF NOT EXISTS idx_member_apps_created ON public.member_applications(created_at DESC);

DROP TRIGGER IF EXISTS update_member_applications_updated_at ON public.member_applications;
CREATE TRIGGER update_member_applications_updated_at
  BEFORE UPDATE ON public.member_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.member_applications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.member_applications TO authenticated;
GRANT INSERT, SELECT ON public.member_applications TO anon;

DROP POLICY IF EXISTS "Public can submit member applications" ON public.member_applications;
CREATE POLICY "Public can submit member applications"
  ON public.member_applications FOR INSERT 
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view member applications" ON public.member_applications;
CREATE POLICY "Admins can view member applications"
  ON public.member_applications FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can update member applications" ON public.member_applications;
CREATE POLICY "Admins can update member applications"
  ON public.member_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete member applications" ON public.member_applications;
CREATE POLICY "Admins can delete member applications"
  ON public.member_applications FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_approve_member_application(
  p_application_id UUID,
  p_password TEXT,
  p_role TEXT DEFAULT 'member',
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app RECORD;
  v_user_id UUID;
  v_encrypted_pwd TEXT;
  v_clean_role TEXT;
BEGIN
  IF NOT (public.is_admin() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Only chapter administrators can approve applications.';
  END IF;

  SELECT * INTO v_app FROM public.member_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member application not found.';
  END IF;

  v_clean_role := LOWER(TRIM(p_role));
  IF v_clean_role NOT IN ('super_admin', 'admin', 'editor', 'viewer', 'member') THEN
    v_clean_role := 'member';
  END IF;

  v_encrypted_pwd := crypt(p_password, gen_salt('bf', 10));

  SELECT id INTO v_user_id FROM auth.users WHERE email = LOWER(TRIM(v_app.email));

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      LOWER(TRIM(v_app.email)), v_encrypted_pwd, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_app.full_name), NOW(), NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pwd,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object('full_name', v_app.full_name),
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, department, semester, github_url, membership_status
  ) VALUES (
    v_user_id, LOWER(TRIM(v_app.email)), v_app.full_name, v_app.department, v_app.semester, v_app.github_url, 'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      department = EXCLUDED.department,
      semester = EXCLUDED.semester,
      github_url = COALESCE(EXCLUDED.github_url, profiles.github_url),
      membership_status = 'active',
      updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_clean_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.member_applications
  SET status = 'approved',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'Approved Member Application & Issued Login', 'profiles', v_user_id::TEXT,
    jsonb_build_object('email', v_app.email, 'name', v_app.full_name, 'role', v_clean_role)
  );

  RETURN jsonb_build_object(
    'success', true, 'user_id', v_user_id, 'email', LOWER(TRIM(v_app.email)),
    'full_name', v_app.full_name, 'role', v_clean_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_member_application TO authenticated;


-- ============================================================================
-- ============================================================================
-- END OF SETUP
-- All ExeCom coordinators, events, and members are managed dynamically via
-- the Super Admin console (/admin) with live password provisioning.
-- ============================================================================
