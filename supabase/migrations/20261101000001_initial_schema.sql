-- ============================================================================
-- FOSS CEPrn — Supabase PostgreSQL Database Foundation
-- Migration: 20261101000001_initial_schema.sql
-- Description: Core tables, foreign keys, constraints, and audit triggers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update "updated_at" timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- References auth.users; stores community member profile details
-- ----------------------------------------------------------------------------
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

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile trigger upon Supabase Auth signup
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

-- ----------------------------------------------------------------------------
-- 2. USER ROLES TABLE (Role Architecture for Phase 2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'core_member', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ----------------------------------------------------------------------------
-- 3. SITE SETTINGS TABLE
-- ----------------------------------------------------------------------------
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

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. EVENTS TABLE
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. PROJECTS TABLE
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. EXECOM MEMBERS TABLE
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. GALLERY TABLE
-- ----------------------------------------------------------------------------
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
