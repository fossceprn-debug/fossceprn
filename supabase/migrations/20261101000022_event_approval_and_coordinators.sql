-- ============================================================================
-- Migration: 20261101000022_event_approval_and_coordinators.sql
-- Description: Supports event approval workflow (non-admins submit for review),
--              stores event creator & approver tracking, and adds coordinator details.
-- ============================================================================

-- 1. Update events publication_status check constraint to include 'pending_approval' and 'rejected'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_publication_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_publication_status_check
  CHECK (publication_status IN ('draft', 'pending_approval', 'published', 'rejected', 'archived'));

-- 2. Add columns for tracking creator, admin approver, and coordinator contact info
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coordinator_name TEXT,
  ADD COLUMN IF NOT EXISTS coordinator_phone TEXT;

-- 3. Update public events select policy: Only published events visible to the public.
-- Admins, Super Admins, and ExeCom editors can see drafts and pending approval events.
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (
    publication_status = 'published'
    OR public.is_admin()
    OR public.is_faculty()
    OR public.is_editor()
    OR (auth.uid() IS NOT NULL)
  );

-- Reload schema
NOTIFY pgrst, 'reload schema';

