-- Extensible certificate definitions and immutable issuance snapshots.
-- This migration adds metadata only; no existing certificate rows are deleted or reset.
ALTER TABLE public.certificate_types
  ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS template_key text NOT NULL DEFAULT 'ornate',
  ADD COLUMN IF NOT EXISTS certificate_kind text NOT NULL DEFAULT 'achievement',
  ADD COLUMN IF NOT EXISTS issuer_name text NOT NULL DEFAULT 'JEE Prep Hub Team',
  ADD COLUMN IF NOT EXISTS detail_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS eligibility_config jsonb NOT NULL DEFAULT '{"mode":"manual"}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.certificate_types
  DROP CONSTRAINT IF EXISTS certificate_types_category_check;
ALTER TABLE public.certificate_types
  ADD CONSTRAINT certificate_types_category_check CHECK (category IN (
    'membership','streak','hours','mastery','custom','pomodoro','social',
    'account_membership','consistency','academic','test_series','jee_neet',
    'community','courses_events','recognition'
  ));
ALTER TABLE public.certificate_types
  ADD CONSTRAINT certificate_types_template_key_check CHECK (template_key IN (
    'ornate','membership','streak','academic','test-series','course','community','recognition'
  ));
ALTER TABLE public.certificate_types
  ADD CONSTRAINT certificate_types_kind_check CHECK (certificate_kind IN (
    'achievement','participation','completion','appreciation'
  ));
ALTER TABLE public.certificate_types
  ADD CONSTRAINT certificate_types_detail_fields_array_check CHECK (jsonb_typeof(detail_fields) = 'array');
ALTER TABLE public.certificate_types
  ADD CONSTRAINT certificate_types_eligibility_object_check CHECK (jsonb_typeof(eligibility_config) = 'object');

-- Preserve the established automatic milestone behavior for existing catalog rows.
UPDATE public.certificate_types
SET eligibility_config = CASE
  WHEN category = 'membership' AND threshold IS NOT NULL
    THEN jsonb_build_object('mode','automatic','metric','membership_days','threshold',threshold)
  WHEN category = 'streak' AND threshold IS NOT NULL
    THEN jsonb_build_object('mode','automatic','metric','daily_streak_days','threshold',threshold)
  WHEN category = 'hours' AND threshold IS NOT NULL
    THEN jsonb_build_object('mode','automatic','metric','study_hours','threshold',threshold)
  WHEN category = 'pomodoro' AND threshold IS NOT NULL AND code LIKE 'pomo_streak_%'
    THEN jsonb_build_object('mode','automatic','metric','pomodoro_streak_days','threshold',threshold)
  WHEN category = 'pomodoro' AND threshold IS NOT NULL AND code LIKE 'pomo_count_%'
    THEN jsonb_build_object('mode','automatic','metric','pomodoro_sessions','threshold',threshold)
  WHEN category = 'mastery' AND code LIKE 'mastery_%'
    THEN jsonb_build_object('mode','automatic','metric','subject_mastery','threshold',1,
      'subject',substring(code from 9))
  ELSE '{"mode":"manual"}'::jsonb
END;

ALTER TABLE public.user_certificates
  ADD COLUMN IF NOT EXISTS details_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS title_snapshot text,
  ADD COLUMN IF NOT EXISTS description_snapshot text,
  ADD COLUMN IF NOT EXISTS subtitle_snapshot text,
  ADD COLUMN IF NOT EXISTS template_key_snapshot text,
  ADD COLUMN IF NOT EXISTS category_snapshot text,
  ADD COLUMN IF NOT EXISTS award_reason text;
ALTER TABLE public.user_certificates
  ADD CONSTRAINT user_certificates_details_snapshot_object_check CHECK (jsonb_typeof(details_snapshot) = 'object');

-- Preserve one auto-award per user/type, while allowing authorized, reasoned manual
-- repeat awards of a configured type (e.g. monthly or recurring challenges).
ALTER TABLE public.user_certificates
  DROP CONSTRAINT IF EXISTS user_certificates_user_id_certificate_type_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_certificates_auto_type_once_idx
  ON public.user_certificates(user_id, certificate_type_id)
  WHERE certificate_type_id IS NOT NULL AND awarded_by IS NULL;

-- Remove the old broad self-insert path. Automatic awards are now issued only by
-- the server-side evaluator after it checks configured metrics and unique index.
DROP POLICY IF EXISTS "Users insert their own auto-earned certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Admins insert any certificate" ON public.user_certificates;
DROP POLICY IF EXISTS "Certificate admins issue certificates" ON public.user_certificates;
CREATE POLICY "Certificate admins issue certificates"
  ON public.user_certificates FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission(auth.uid(), 'certificates')
    AND awarded_by = auth.uid()
    AND award_reason IS NOT NULL
    AND length(btrim(award_reason)) >= 5
  );

-- Match UI/server authorization to the explicit certificates permission, not a
-- generic admin role. Anonymous and authenticated SELECT visibility is unchanged.
DROP POLICY IF EXISTS "Admins manage certificate types" ON public.certificate_types;
DROP POLICY IF EXISTS "Certificate admins manage certificate types" ON public.certificate_types;
CREATE POLICY "Certificate admins manage certificate types"
  ON public.certificate_types FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'certificates'))
  WITH CHECK (public.has_permission(auth.uid(), 'certificates'));

GRANT SELECT ON public.certificate_types TO anon, authenticated;
GRANT INSERT, UPDATE ON public.certificate_types TO authenticated;
GRANT SELECT ON public.user_certificates TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_certificates TO authenticated;
GRANT ALL ON public.certificate_types, public.user_certificates TO service_role;

CREATE INDEX IF NOT EXISTS certificate_types_enabled_order_idx
  ON public.certificate_types(is_enabled, sort_order);

-- Once a definition has awards, its content is historical data: only its active
-- flag may change. The application versions edited definitions into a new row.
CREATE OR REPLACE FUNCTION public.prevent_issued_certificate_type_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Certificate definitions are archived by disabling, not deleted.'
      USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_certificates c WHERE c.certificate_type_id = OLD.id)
    AND (
      NEW.category IS DISTINCT FROM OLD.category OR
      NEW.code IS DISTINCT FROM OLD.code OR
      NEW.description IS DISTINCT FROM OLD.description OR
      NEW.subtitle IS DISTINCT FROM OLD.subtitle OR
      NEW.template_key IS DISTINCT FROM OLD.template_key OR
      NEW.certificate_kind IS DISTINCT FROM OLD.certificate_kind OR
      NEW.issuer_name IS DISTINCT FROM OLD.issuer_name OR
      NEW.detail_fields IS DISTINCT FROM OLD.detail_fields OR
      NEW.eligibility_config IS DISTINCT FROM OLD.eligibility_config OR
      NEW.icon IS DISTINCT FROM OLD.icon OR
      NEW.name IS DISTINCT FROM OLD.name OR
      NEW.sort_order IS DISTINCT FROM OLD.sort_order OR
      NEW.threshold IS DISTINCT FROM OLD.threshold
    ) THEN
    RAISE EXCEPTION 'Certificate type with issued awards is immutable; create a new version.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_issued_certificate_type ON public.certificate_types;
CREATE TRIGGER protect_issued_certificate_type
  BEFORE UPDATE OR DELETE ON public.certificate_types
  FOR EACH ROW EXECUTE FUNCTION public.prevent_issued_certificate_type_mutation();

-- Self-reported qualifications can request review but never create an award.
CREATE TABLE IF NOT EXISTS public.certificate_award_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type_id uuid NOT NULL REFERENCES public.certificate_types(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_reason text,
  UNIQUE(user_id, certificate_type_id)
);
ALTER TABLE public.user_certificates
  ADD COLUMN IF NOT EXISTS award_request_id uuid UNIQUE
  REFERENCES public.certificate_award_requests(id) ON DELETE RESTRICT;
ALTER TABLE public.certificate_award_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.certificate_award_requests TO authenticated;
GRANT ALL ON public.certificate_award_requests TO service_role;
CREATE POLICY "Users request review of own awards"
  ON public.certificate_award_requests FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND status = 'pending' AND decided_at IS NULL AND decided_by IS NULL
    AND EXISTS (
      SELECT 1 FROM public.certificate_types t
      WHERE t.id = certificate_type_id AND t.category = 'social' AND t.is_enabled
    )
  );
CREATE POLICY "Users and certificate admins view award requests"
  ON public.certificate_award_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'certificates'));
CREATE POLICY "Certificate admins decide award requests"
  ON public.certificate_award_requests FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'certificates'))
  WITH CHECK (public.has_permission(auth.uid(), 'certificates'));
