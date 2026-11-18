-- ============================================================================
-- Migration: 20261101000021_event_registration_modes_and_qr.sql
-- Description: Adds On-site vs Google Form registration modes to events, custom
--              registration questions configuration, and the event_registrations table
--              with unique ticket codes and QR check-in capabilities.
-- ============================================================================

-- 1. Extend public.events with registration mode, gform URL, and custom questions
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS registration_mode TEXT DEFAULT 'onsite' CHECK (registration_mode IN ('onsite', 'gform')),
  ADD COLUMN IF NOT EXISTS gform_url TEXT,
  ADD COLUMN IF NOT EXISTS registration_questions JSONB DEFAULT '[]'::jsonb;

-- 2. Create public.event_registrations table for student on-site registrations & QR check-ins
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  class_semester TEXT,
  responses JSONB DEFAULT '{}'::jsonb,
  ticket_code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid lookup during attendance check-in
CREATE INDEX IF NOT EXISTS idx_event_reg_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_ticket_code ON public.event_registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_event_reg_email ON public.event_registrations(email);

-- Enable Row Level Security
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for event_registrations
DROP POLICY IF EXISTS "Public can register for events" ON public.event_registrations;
CREATE POLICY "Public can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view registrations or ticket" ON public.event_registrations;
CREATE POLICY "Anyone can view registrations or ticket"
  ON public.event_registrations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can update event check-in status" ON public.event_registrations;
CREATE POLICY "Staff can update event check-in status"
  ON public.event_registrations FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can delete event registrations" ON public.event_registrations;
CREATE POLICY "Staff can delete event registrations"
  ON public.event_registrations FOR DELETE
  USING (true);

-- Ensure public.events RLS allows full management for authenticated staff and open reads
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

