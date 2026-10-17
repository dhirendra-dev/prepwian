-- ============================================================
-- JEE Prep Hub - Google Calendar Credential Security Fix
-- ============================================================

-- Never allow the browser/client role to read the table
-- containing OAuth credentials.
revoke all
on public.google_calendar_connections
from anon;

revoke all
on public.google_calendar_connections
from authenticated;

-- The service-role used by Edge Functions bypasses RLS and
-- retains access for secure server-side token operations.

-- ============================================================
-- SAFE STATUS FUNCTION
-- ============================================================

create or replace function public.get_google_calendar_status()
returns table (
  is_connected boolean,
  google_account_email text,
  last_sync_at timestamptz,
  connection_error text,
  token_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    g.is_connected,
    g.google_account_email,
    g.last_sync_at,
    g.connection_error,
    g.token_expires_at
  from public.google_calendar_connections g
  where g.user_id = auth.uid()
  limit 1;
$$;

revoke all
on function public.get_google_calendar_status()
from public;

grant execute
on function public.get_google_calendar_status()
to authenticated;

-- ============================================================
-- REMOVE FRONTEND ACCESS TO THE TOKEN VIEW
-- ============================================================

revoke all
on public.google_calendar_connection_status
from anon;

revoke all
on public.google_calendar_connection_status
from authenticated;

-- ============================================================
-- SECURITY NOTES
-- ============================================================
--
-- Browser/client:
--   Can call get_google_calendar_status()
--   Cannot read OAuth credentials.
--
-- Edge Functions:
--   Use service-role access server-side.
--
-- OAuth tokens:
--   Remain encrypted in the database.
--
-- Encryption key:
--   Remains only in Edge Function secrets.
--
-- ============================================================