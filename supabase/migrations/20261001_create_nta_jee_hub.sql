-- ============================================================
-- JEE PREP HUB — NTA JEE MAIN OFFICIAL HUB
-- Migration: 20261001
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1. NTA SOURCE REGISTRY
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nta_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  name text NOT NULL,
  url text NOT NULL,
  source_type text NOT NULL DEFAULT 'webpage',
  enabled boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT nta_sources_official_url_check
    CHECK (
      url ~ '^https://(jeemain\.nta\.nic\.in|nta\.ac\.in)(/|$)'
    )
);

-- ------------------------------------------------------------
-- 2. NTA DOCUMENTS / NOTICES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nta_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  source_id uuid REFERENCES public.nta_sources(id)
    ON DELETE SET NULL,

  external_url text NOT NULL UNIQUE,
  title text NOT NULL,
  normalized_title text,

  category text NOT NULL DEFAULT 'other',

  exam_year integer,
  session text,
  paper text,
  document_type text,

  published_at timestamptz,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),

  is_active boolean NOT NULL DEFAULT true,
  official boolean NOT NULL DEFAULT true,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT nta_documents_official_url_check
    CHECK (
      external_url ~ '^https://(jeemain\.nta\.nic\.in|nta\.ac\.in)(/|$)'
    ),

  CONSTRAINT nta_documents_year_check
    CHECK (
      exam_year IS NULL OR exam_year BETWEEN 2010 AND 2100
    )
);

-- ------------------------------------------------------------
-- 3. QUESTION PAPERS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nta_question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id uuid REFERENCES public.nta_documents(id)
    ON DELETE SET NULL,

  year integer NOT NULL,
  session text,
  exam_date date,
  shift text,
  paper_type text NOT NULL DEFAULT 'Paper 1',
  subject text,

  title text NOT NULL,
  official_url text NOT NULL,
  answer_key_url text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT nta_question_papers_url_check
    CHECK (
      official_url ~ '^https://(jeemain\.nta\.nic\.in|nta\.ac\.in)(/|$)'
    ),

  CONSTRAINT nta_question_papers_answer_url_check
    CHECK (
      answer_key_url IS NULL
      OR answer_key_url ~ '^https://(jeemain\.nta\.nic\.in|nta\.ac\.in)(/|$)'
    )
);

-- ------------------------------------------------------------
-- 4. NTA ALERTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nta_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id uuid REFERENCES public.nta_documents(id)
    ON DELETE CASCADE,

  alert_type text NOT NULL DEFAULT 'notice',
  priority text NOT NULL DEFAULT 'normal',

  title text NOT NULL,
  summary text,

  published_at timestamptz,
  official_url text NOT NULL,

  is_published boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT nta_alerts_url_check
    CHECK (
      official_url ~ '^https://(jeemain\.nta\.nic\.in|nta\.ac\.in)(/|$)'
    )
);

-- ------------------------------------------------------------
-- 5. SYNC RUN LOG
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nta_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,

  status text NOT NULL DEFAULT 'running',

  source_count integer NOT NULL DEFAULT 0,
  discovered_count integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,

  error_message text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_nta_documents_category
  ON public.nta_documents(category);

CREATE INDEX IF NOT EXISTS idx_nta_documents_exam_year
  ON public.nta_documents(exam_year);

CREATE INDEX IF NOT EXISTS idx_nta_documents_session
  ON public.nta_documents(session);

CREATE INDEX IF NOT EXISTS idx_nta_documents_published_at
  ON public.nta_documents(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_nta_documents_active
  ON public.nta_documents(is_active);

CREATE INDEX IF NOT EXISTS idx_nta_question_papers_year
  ON public.nta_question_papers(year DESC);

CREATE INDEX IF NOT EXISTS idx_nta_question_papers_session
  ON public.nta_question_papers(session);

CREATE INDEX IF NOT EXISTS idx_nta_question_papers_exam_date
  ON public.nta_question_papers(exam_date);

CREATE INDEX IF NOT EXISTS idx_nta_alerts_published_at
  ON public.nta_alerts(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_nta_alerts_priority
  ON public.nta_alerts(priority);

CREATE INDEX IF NOT EXISTS idx_nta_sync_runs_started_at
  ON public.nta_sync_runs(started_at DESC);

-- ============================================================
-- SEED OFFICIAL NTA SOURCES
-- ============================================================

INSERT INTO public.nta_sources
  (source_key, name, url, source_type)
VALUES
  (
    'jee_main_home',
    'JEE Main Official Website',
    'https://jeemain.nta.nic.in/',
    'homepage'
  ),
  (
    'jee_main_public_notices',
    'JEE Main Public Notices',
    'https://jeemain.nta.nic.in/public-notices/',
    'public_notices'
  ),
  (
    'jee_main_current_events',
    'JEE Main Current Events',
    'https://jeemain.nta.nic.in/document-category/current-events/',
    'current_events'
  ),
  (
    'jee_main_information_bulletin',
    'JEE Main Information Bulletin',
    'https://jeemain.nta.nic.in/admission-bulletin/',
    'information_bulletin'
  ),
  (
    'jee_main_sitemap',
    'JEE Main Official Sitemap',
    'https://jeemain.nta.nic.in/sitemap/',
    'sitemap'
  )
ON CONFLICT (source_key)
DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  source_type = EXCLUDED.source_type,
  updated_at = now();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.nta_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nta_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nta_question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nta_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nta_sync_runs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Public read policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read enabled NTA sources"
ON public.nta_sources;

CREATE POLICY "Public can read enabled NTA sources"
ON public.nta_sources
FOR SELECT
USING (enabled = true);

DROP POLICY IF EXISTS "Public can read active NTA documents"
ON public.nta_documents;

CREATE POLICY "Public can read active NTA documents"
ON public.nta_documents
FOR SELECT
USING (
  is_active = true
  AND official = true
);

DROP POLICY IF EXISTS "Public can read NTA question papers"
ON public.nta_question_papers;

CREATE POLICY "Public can read NTA question papers"
ON public.nta_question_papers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public can read published NTA alerts"
ON public.nta_alerts;

CREATE POLICY "Public can read published NTA alerts"
ON public.nta_alerts
FOR SELECT
USING (
  is_published = true
);

-- Sync runs are intentionally NOT publicly readable.

-- ============================================================
-- ADMIN / SERVICE-ROLE WRITE ACCESS
-- ============================================================

-- No INSERT/UPDATE/DELETE policies are created for normal users.
-- The sync backend will use the Supabase service role.
-- This prevents ordinary users from modifying official NTA data.

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_nta_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nta_sources_updated_at
ON public.nta_sources;

CREATE TRIGGER trg_nta_sources_updated_at
BEFORE UPDATE ON public.nta_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_nta_updated_at();

DROP TRIGGER IF EXISTS trg_nta_documents_updated_at
ON public.nta_documents;

CREATE TRIGGER trg_nta_documents_updated_at
BEFORE UPDATE ON public.nta_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_nta_updated_at();

DROP TRIGGER IF EXISTS trg_nta_question_papers_updated_at
ON public.nta_question_papers;

CREATE TRIGGER trg_nta_question_papers_updated_at
BEFORE UPDATE ON public.nta_question_papers
FOR EACH ROW
EXECUTE FUNCTION public.update_nta_updated_at();

DROP TRIGGER IF EXISTS trg_nta_alerts_updated_at
ON public.nta_alerts;

CREATE TRIGGER trg_nta_alerts_updated_at
BEFORE UPDATE ON public.nta_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_nta_updated_at();