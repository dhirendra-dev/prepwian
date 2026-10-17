ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS migrated boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS migrated_at timestamptz;