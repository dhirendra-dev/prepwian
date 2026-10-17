-- Centralized encrypted integration secrets. Plaintext secrets are never stored.
create table if not exists public.admin_system_secrets (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai', 'anthropic', 'google_gemini', 'groq', 'custom')),
  label text not null check (char_length(label) between 2 and 80),
  ciphertext text not null,
  iv text not null,
  key_hint text not null,
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_validated_at timestamptz,
  unique (provider, label)
);

alter table public.admin_system_secrets enable row level security;
-- No client policies are intentionally created. Access is only through server code
-- after a full-admin check and a server-side service-role client.
revoke all on public.admin_system_secrets from anon, authenticated;
grant all on public.admin_system_secrets to service_role;
