-- ============================================================================
-- Migration: 20261101000024_event_tickets_email_and_certificates.sql
-- Description:
--   1. Adds email delivery status tracking to event_registrations (pending/sent/failed)
--   2. Adds certificate tracking to event_registrations (issued/timestamp/certificate_id)
--   3. Adds certificate configuration to events (custom template image & Google Drive link)
--   4. Creates unique constraint on (event_id, lower(email)) to prevent duplicate registrations
-- ============================================================================

-- 1. Add email delivery tracking & certificate columns to event_registrations
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_error TEXT,
  ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_id TEXT;

-- Index on email_status for quick filtering
CREATE INDEX IF NOT EXISTS idx_event_reg_email_status
  ON public.event_registrations(email_status);

-- 2. Add certificate configuration fields to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS certificate_template_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_drive_link TEXT,
  ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT TRUE;

-- 3. Prevent duplicate registrations for the same event with same email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_reg_unique_email
  ON public.event_registrations (event_id, LOWER(TRIM(email)));

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

