create or replace function public.test_points_leaderboard()
returns table(
  user_id uuid,
  total_points numeric,
  tests_attempted integer,
  avg_accuracy numeric,
  full_name text,
  username text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  with best as (
    select a.user_id, a.test_id,
           max(a.score) as best_score,
           max(a.accuracy) as best_accuracy
    from public.test_attempts a
    where a.status::text in ('submitted','auto_submitted')
    group by a.user_id, a.test_id
  ), agg as (
    select b.user_id,
           coalesce(sum(b.best_score), 0)::numeric as total_points,
           count(*)::int as tests_attempted,
           round(coalesce(avg(b.best_accuracy), 0)::numeric, 1) as avg_accuracy
    from best b
    group by b.user_id
  )
  select agg.user_id, agg.total_points, agg.tests_attempted, agg.avg_accuracy,
         p.full_name, p.username, p.avatar_url
  from agg
  left join public.profiles p on p.id = agg.user_id
  order by agg.total_points desc, agg.tests_attempted desc
  limit 200
$$;

revoke all on function public.test_points_leaderboard() from public;
revoke all on function public.test_points_leaderboard() from anon;
grant execute on function public.test_points_leaderboard() to authenticated;