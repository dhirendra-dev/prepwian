create or replace function public.test_leaderboard(_test_id uuid)
returns table(
  id uuid,
  user_id uuid,
  score numeric,
  accuracy numeric,
  duration_sec integer,
  submitted_at timestamptz,
  full_name text,
  username text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.user_id, a.score, a.accuracy, a.duration_sec, a.submitted_at,
         p.full_name, p.username, p.avatar_url
  from public.test_attempts a
  left join public.profiles p on p.id = a.user_id
  where a.test_id = _test_id
    and a.status::text in ('submitted','auto_submitted')
  order by a.score desc nulls last, a.duration_sec asc nulls last, a.submitted_at asc
  limit 200
$$;

revoke all on function public.test_leaderboard(uuid) from public;
revoke all on function public.test_leaderboard(uuid) from anon;
grant execute on function public.test_leaderboard(uuid) to authenticated;