-- ============================================================================
-- Migration: 20261101000023_event_coordinators_and_volunteers.sql
-- Description: Adds support for dual coordinators (Coordinator 1 & Coordinator 2)
--              and dual student volunteers (Volunteer 1 & Volunteer 2) for events.
-- ============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS coordinator1_name TEXT,
  ADD COLUMN IF NOT EXISTS coordinator1_id TEXT,
  ADD COLUMN IF NOT EXISTS coordinator1_phone TEXT,
  ADD COLUMN IF NOT EXISTS coordinator2_name TEXT,
  ADD COLUMN IF NOT EXISTS coordinator2_id TEXT,
  ADD COLUMN IF NOT EXISTS coordinator2_phone TEXT,
  ADD COLUMN IF NOT EXISTS volunteer1_name TEXT,
  ADD COLUMN IF NOT EXISTS volunteer2_name TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
