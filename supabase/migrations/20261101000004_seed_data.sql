-- ============================================================================
-- FOSS CEPrn — Supabase Seed Data
-- Migration: 20261101000004_seed_data.sql
-- Description: Inserts initial site settings (events, projects, execom, and gallery
--              are populated dynamically as the community publishes real content)
-- ============================================================================

-- Site Settings
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
