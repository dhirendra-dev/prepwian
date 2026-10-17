-- Extend existing certificate records without disturbing automatically earned milestones.
ALTER TABLE public.user_certificates
  ADD COLUMN IF NOT EXISTS certificate_kind text NOT NULL DEFAULT 'achievement'
    CHECK (certificate_kind IN ('achievement', 'participation', 'completion', 'appreciation')),
  ADD COLUMN IF NOT EXISTS exam_category text,
  ADD COLUMN IF NOT EXISTS test_name text,
  ADD COLUMN IF NOT EXISTS rank_text text,
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS maximum_marks numeric,
  ADD COLUMN IF NOT EXISTS issuer_name text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoke_reason text;

ALTER TABLE public.user_certificates
  DROP CONSTRAINT IF EXISTS user_certificates_score_check;
ALTER TABLE public.user_certificates
  ADD CONSTRAINT user_certificates_score_check CHECK (
    (score IS NULL OR score >= 0) AND
    (maximum_marks IS NULL OR maximum_marks > 0) AND
    (score IS NULL OR maximum_marks IS NULL OR score <= maximum_marks)
  );

-- Preserve certificate records for audit/verification. Only certificate admins may revoke or issue;
-- users may still claim their pre-existing self-earned milestone certificates.
DROP POLICY IF EXISTS "Admins delete certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Admins insert any certificate" ON public.user_certificates;
CREATE POLICY "Certificate admins issue certificates"
  ON public.user_certificates FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'certificates'));
CREATE POLICY "Certificate admins revoke certificates"
  ON public.user_certificates FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'certificates'))
  WITH CHECK (public.has_permission(auth.uid(), 'certificates'));

CREATE INDEX IF NOT EXISTS user_certificates_verification_code_idx
  ON public.user_certificates(verification_code);
CREATE INDEX IF NOT EXISTS user_certificates_issued_at_idx
  ON public.user_certificates(awarded_at DESC);
