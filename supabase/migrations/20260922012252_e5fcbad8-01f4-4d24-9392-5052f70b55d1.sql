CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS materials_created_at_id_idx
  ON public.materials (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS materials_subject_class_created_idx
  ON public.materials (subject, class_level, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS materials_search_trgm_idx
  ON public.materials
  USING gin ((coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(topic, '')) gin_trgm_ops);