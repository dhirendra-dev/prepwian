-- ============================================================
-- JEE Prep Hub - Google Calendar Secure Token Storage
-- ============================================================

alter table public.google_calendar_connections
  add column if not exists
    access_token_encrypted text;

alter table public.google_calendar_connections
  add column if not exists
    refresh_token_encrypted text;

alter table public.google_calendar_connections
  add column if not exists
    token_expires_at timestamptz;

alter table public.google_calendar_connections
  add column if not exists
    token_scopes text;

alter table public.google_calendar_connections
  add column if not exists
    token_updated_at timestamptz;

-- ============================================================
-- INDEX
-- ============================================================

create index if not exists
  google_calendar_connections_token_expiry_idx
on public.google_calendar_connections(
  token_expires_at
);

-- ============================================================
-- SECURITY
-- ============================================================

comment on column
  public.google_calendar_connections.access_token_encrypted
is
  'Encrypted Google OAuth access token. Encryption/decryption must occur server-side only.';

comment on column
  public.google_calendar_connections.refresh_token_encrypted
is
  'Encrypted Google OAuth refresh token. Never expose this value to the browser.';

comment on column
  public.google_calendar_connections.token_expires_at
is
  'Expiration time of the current Google access token.';

comment on column
  public.google_calendar_connections.token_scopes
is
  'OAuth scopes granted by the Google account.';

-- ============================================================
-- EXTRA PROTECTION
-- ============================================================

revoke all
on public.google_calendar_connections
from anon;

revoke all
on public.google_calendar_connections
from authenticated;

-- Users should never directly read or modify OAuth tokens.
-- The Edge Functions will use the service-role connection
-- server-side for token operations.

grant select
on public.google_calendar_connections
to authenticated;

-- ============================================================
-- SAFE VIEW FOR FRONTEND
-- ============================================================

create or replace view public.google_calendar_connection_status
with (security_invoker = true)
as
select
  id,
  user_id,
  google_account_email,
  google_user_id,
  is_connected,
  last_sync_at,
  connection_error,
  created_at,
  updated_at,
  (
    access_token_encrypted is not null
    or refresh_token_encrypted is not null
  ) as has_google_credentials,
  token_expires_at,
  token_scopes
from public.google_calendar_connections;

revoke all
on public.google_calendar_connection_status
from anon;

grant select
on public.google_calendar_connection_status
to authenticated;

-- ============================================================
-- NOTE
-- ============================================================
--
-- The actual encryption key must NEVER be stored in this
-- database table.
--
-- It will be supplied only to the Supabase Edge Functions
-- through a server-side secret.
--
-- Browser code must never receive:
--   access_token_encrypted
--   refresh_token_encrypted
--   encryption keys
--
-- ============================================================