-- ============================================================================
-- Migration 20261101000011: Cleanup fake applicants and add membership controls
-- ============================================================================

-- 1. Remove fake demo seed applicants
DELETE FROM public.execom_applications 
WHERE email IN (
  'adithya.krishna@perumonec.ac.in',
  'meera.nair@perumonec.ac.in',
  'naveen.prasad@perumonec.ac.in'
);

-- 2. Add is_membership_open flag to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS is_membership_open BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Trigger to mirror any new member_applications to execom_applications automatically
CREATE OR REPLACE FUNCTION public.sync_member_app_to_execom()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.execom_applications (
    full_name,
    email,
    department,
    semester,
    desired_role,
    github_url,
    statement_of_purpose,
    status
  ) VALUES (
    NEW.full_name,
    NEW.email,
    NEW.department,
    NEW.semester,
    COALESCE(NEW.interest, 'Core Team / General Member'),
    NEW.github_url,
    COALESCE(NEW.notes, 'Applied via Execom Membership Interest Form'),
    COALESCE(NEW.status, 'pending')
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_member_to_execom ON public.member_applications;
CREATE TRIGGER trg_sync_member_to_execom
  AFTER INSERT ON public.member_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_app_to_execom();

