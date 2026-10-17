create or replace function public.is_admin_user(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to anon, authenticated, service_role;

create or replace view public.pulse_feed_items
with (security_invoker = on) as
 select v.id,
    'video'::text as item_type,
    v.title,
    null::text as body_text,
    null::uuid as author_id,
    null::text as author_name,
    null::text as author_avatar_url,
    null::text as image_url,
    v.youtube_video_id,
    v.subject,
    v.chapter,
    (select count(*) from public.video_likes vl where vl.video_id = v.id) as like_count,
    (select count(*) from public.video_comments vc where vc.video_id = v.id) as comment_count,
    v.created_at,
    false as author_is_admin
   from public.video_lectures v
  where v.is_published = true
union all
 select p.id,
    'post'::text as item_type,
    null::text as title,
    p.body as body_text,
    p.user_id as author_id,
    pr.full_name as author_name,
    pr.avatar_url as author_avatar_url,
    p.image_url,
    null::text as youtube_video_id,
    null::text as subject,
    null::text as chapter,
    (select count(*) from public.feed_likes l where l.target_type = 'post' and l.target_id = p.id) as like_count,
    (select count(*) from public.feed_comments c where c.post_id = p.id) as comment_count,
    p.created_at,
    public.is_admin_user(p.user_id) as author_is_admin
   from public.feed_posts p
   left join public.public_profiles pr on pr.id = p.user_id;

grant select on public.pulse_feed_items to anon, authenticated;
grant all on public.pulse_feed_items to service_role;