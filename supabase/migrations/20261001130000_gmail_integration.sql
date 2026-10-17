-- JEE Prep Hub Gmail OAuth integration
-- Stores OAuth state and encrypted Gmail refresh tokens.
-- Refresh tokens must NEVER be exposed to the browser.

create table if not exists public.gmail_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists gmail_oauth_states_expires_at_idx
  on public.gmail_oauth_states (expires_at);

create index if not exists gmail_oauth_states_user_id_idx
  on public.gmail_oauth_states (user_id);


create table if not exists public.gmail_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,

  gmail_email text not null,

  -- AES-GCM encrypted refresh token.
  -- The encryption key exists ONLY as a server environment variable.
  refresh_token_ciphertext text not null,

  scopes text[] not null default array[
    'https://www.googleapis.com/auth/gmail.send'
  ]::text[],

  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gmail_oauth_states enable row level security;
alter table public.gmail_connections enable row level security;

-- These tables are intentionally NOT directly readable/writable
-- by normal authenticated users.
--
-- Gmail OAuth operations will happen through server-side routes
-- using the Supabase service-role connection.

revoke all on public.gmail_oauth_states from anon, authenticated;
revoke all on public.gmail_connections from anon, authenticated;

-- Cleanup helper for expired OAuth states.
create or replace function public.cleanup_expired_gmail_oauth_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.gmail_oauth_states
  where expires_at < now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_expired_gmail_oauth_states()
  from public, anon, authenticated;

grant execute on function public.cleanup_expired_gmail_oauth_states()
  to service_role;