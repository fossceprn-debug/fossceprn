-- ============================================================================
-- FOSS CEPrn — Activity Coordinators, Volunteers & Deadlines
-- Migration: 20261101000016_activity_coordinators_and_volunteers.sql
-- Description:
--   1. Adds deadline_date, coordinators, and volunteers JSONB columns to public.activities.
--   2. Updates seeded activities with official ExeCom coordinators & volunteer task allocations.
--   3. Reloads PostgREST schema cache.
-- ============================================================================

-- Step 1: Add columns to activities table
ALTER TABLE public.activities 
  ADD COLUMN IF NOT EXISTS deadline_date DATE,
  ADD COLUMN IF NOT EXISTS coordinators JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS volunteers JSONB DEFAULT '[]'::jsonb;

-- Step 2: Seed coordinators & volunteers for existing activities
UPDATE public.activities
SET 
  deadline_date = activity_date - INTERVAL '1 day',
  coordinators = '["Amal Dev A", "Arun V"]'::jsonb,
  volunteers = '[
    {"name": "Abiya Daniel", "task": "Registration Desk & Participant Check-in"},
    {"name": "Arun V", "task": "Technical Setup, Slides & Audio Support"}
  ]'::jsonb
WHERE coordinators IS NULL OR coordinators = '[]'::jsonb;

-- Reload schema
NOTIFY pgrst, 'reload schema';

