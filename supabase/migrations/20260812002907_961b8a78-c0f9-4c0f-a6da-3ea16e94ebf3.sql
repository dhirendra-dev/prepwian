ALTER TABLE public.consent_settings ADD COLUMN IF NOT EXISTS consent_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.ai_generation_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  use_own_key boolean NOT NULL DEFAULT false,
  provider text NOT NULL DEFAULT 'gemini',
  api_key text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_generation_settings TO service_role;

ALTER TABLE public.ai_generation_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_ai_generation_settings_touch
BEFORE UPDATE ON public.ai_generation_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.ai_generation_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;