-- ============================================================================
-- FOSS CEPrn — Supabase Storage Buckets & Policies
-- Migration: 20261101000003_storage_buckets.sql
-- Description: Creates media buckets with public read and secured write rules
-- ============================================================================

-- Insert buckets into storage.buckets if they do not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true),
  ('project-images', 'project-images', true),
  ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ----------------------------------------------------------------------------
-- Storage Policies for Public Reads
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read for avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read for event-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Public read for project-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Public read for gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

-- ----------------------------------------------------------------------------
-- Storage Policies for Writes & Uploads
-- ----------------------------------------------------------------------------

-- Avatars: Authenticated users can upload to their own avatar folder
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Event Images: Only administrators can upload/modify
CREATE POLICY "Only admins can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' 
    AND public.is_admin()
  );

CREATE POLICY "Only admins can update event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images' 
    AND public.is_admin()
  );

CREATE POLICY "Only admins can delete event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images' 
    AND public.is_admin()
  );

-- Project Images: Only administrators can upload/modify
CREATE POLICY "Only admins can upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' 
    AND public.is_admin()
  );

CREATE POLICY "Only admins can update project images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-images' 
    AND public.is_admin()
  );

CREATE POLICY "Only admins can delete project images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-images' 
    AND public.is_admin()
  );

-- Gallery Images: Only administrators can upload/modify
CREATE POLICY "Only admins can upload gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery' 
    AND public.is_admin()
  );

CREATE POLICY "Only admins can update gallery images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gallery' 
    AND public.is_admin()
  );

CREATE POLICY "Only admins can delete gallery images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gallery' 
    AND public.is_admin()
  );
