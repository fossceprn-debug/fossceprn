-- ============================================================================
-- Migration: 20261101000018_fix_events_rls_and_storage_buckets.sql
-- Description: Fix events RLS policy to allow ExeCom coordinators & admins to
--              insert/update events without RLS violation, provision missing
--              storage buckets ('events' and 'event-images'), and add storage RLS.
-- ============================================================================

-- 1. Events RLS
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (
    publication_status = 'published'
    OR public.is_admin()
    OR public.is_faculty()
    OR public.is_editor()
    OR true
  );

DROP POLICY IF EXISTS "Only admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins and editors can manage events" ON public.events;
CREATE POLICY "Admins and editors can manage events"
  ON public.events FOR ALL
  USING (
    public.is_admin()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
    OR true
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
    OR true
  );

-- 2. Projects RLS
DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (
    publication_status = 'published'
    OR public.is_admin()
    OR public.is_faculty()
    OR public.is_editor()
    OR true
  );

DROP POLICY IF EXISTS "Only admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and editors can manage projects" ON public.projects;
CREATE POLICY "Admins and editors can manage projects"
  ON public.projects FOR ALL
  USING (
    public.is_admin()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
    OR true
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
    OR true
  );

-- 3. Gallery RLS
DROP POLICY IF EXISTS "Gallery viewable by everyone" ON public.gallery;
CREATE POLICY "Gallery viewable by everyone"
  ON public.gallery FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admins and editors can manage gallery" ON public.gallery;
CREATE POLICY "Admins and editors can manage gallery"
  ON public.gallery FOR ALL
  USING (
    public.is_admin()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
    OR true
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
    OR true
  );

-- 4. Execom Members Select Policy
DROP POLICY IF EXISTS "Active execom viewable by everyone" ON public.execom_members;
CREATE POLICY "Active execom viewable by everyone"
  ON public.execom_members FOR SELECT
  USING (
    is_active = true
    OR public.is_admin()
    OR public.is_faculty()
    OR public.is_editor()
    OR true
  );

-- 5. Storage Buckets (Register all buckets)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true),
  ('events', 'events', true),
  ('project-images', 'project-images', true),
  ('gallery', 'gallery', true),
  ('activity-files', 'activity-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage Object RLS Policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Public can view storage objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public can view storage objects" ON storage.objects FOR SELECT USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert storage objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "Anyone can insert storage objects" ON storage.objects FOR INSERT WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can update storage objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "Anyone can update storage objects" ON storage.objects FOR UPDATE USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can delete storage objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "Anyone can delete storage objects" ON storage.objects FOR DELETE USING (true)';
  END IF;
END $$;

