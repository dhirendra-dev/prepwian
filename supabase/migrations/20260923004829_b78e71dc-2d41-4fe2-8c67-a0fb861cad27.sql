DROP INDEX IF EXISTS public.materials_search_trgm_idx;

CREATE INDEX IF NOT EXISTS materials_title_trgm_idx
  ON public.materials USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS materials_description_trgm_idx
  ON public.materials USING gin (description extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS materials_topic_trgm_idx
  ON public.materials USING gin (topic extensions.gin_trgm_ops);