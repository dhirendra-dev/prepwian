create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid null references auth.users(id) on delete set null,
  author_name text not null default 'JEE Prep Hub Editorial',
  author_avatar_url text,
  title text not null check (char_length(title) between 5 and 180),
  slug text not null unique,
  summary text not null default '' check (char_length(summary) <= 400),
  category text not null default 'Study Strategy',
  cover_image_url text,
  body_markdown text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  reading_minutes integer not null default 1 check (reading_minutes between 1 and 120),
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists articles_feed_idx on public.articles(status,published_at desc);
create index if not exists articles_author_idx on public.articles(author_id,updated_at desc);
create index if not exists articles_category_idx on public.articles(category);

create table if not exists public.article_author_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(subscriber_id,author_id),
  check(subscriber_id <> author_id)
);

create table if not exists public.article_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id,article_id)
);

create table if not exists public.article_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id,article_id)
);

create table if not exists public.article_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_key text not null,
  viewed_on date not null default (timezone('utc',now()))::date,
  created_at timestamptz not null default now(),
  unique(article_id,visitor_key,viewed_on)
);

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1500),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists article_comments_feed_idx on public.article_comments(article_id,created_at);

alter table public.articles enable row level security;
alter table public.article_author_subscriptions enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_bookmarks enable row level security;
alter table public.article_views enable row level security;
alter table public.article_comments enable row level security;

drop policy if exists "Read published articles or own drafts" on public.articles;
create policy "Read published articles or own drafts" on public.articles for select
using(status='published' or author_id=auth.uid());
drop policy if exists "Create own articles" on public.articles;
create policy "Create own articles" on public.articles for insert to authenticated
with check(author_id=auth.uid());
drop policy if exists "Update own articles" on public.articles;
create policy "Update own articles" on public.articles for update to authenticated
using(author_id=auth.uid()) with check(author_id=auth.uid());
drop policy if exists "Delete own articles" on public.articles;
create policy "Delete own articles" on public.articles for delete to authenticated
using(author_id=auth.uid());

drop policy if exists "Read subscriptions" on public.article_author_subscriptions;
create policy "Read subscriptions" on public.article_author_subscriptions for select to authenticated
using(subscriber_id=auth.uid() or author_id=auth.uid());
drop policy if exists "Follow authors" on public.article_author_subscriptions;
create policy "Follow authors" on public.article_author_subscriptions for insert to authenticated
with check(subscriber_id=auth.uid());
drop policy if exists "Unfollow authors" on public.article_author_subscriptions;
create policy "Unfollow authors" on public.article_author_subscriptions for delete to authenticated
using(subscriber_id=auth.uid());

drop policy if exists "Read article likes" on public.article_likes;
create policy "Read article likes" on public.article_likes for select using(true);
drop policy if exists "Like articles" on public.article_likes;
create policy "Like articles" on public.article_likes for insert to authenticated
with check(user_id=auth.uid());
drop policy if exists "Remove own likes" on public.article_likes;
create policy "Remove own likes" on public.article_likes for delete to authenticated
using(user_id=auth.uid());

drop policy if exists "Read own bookmarks" on public.article_bookmarks;
create policy "Read own bookmarks" on public.article_bookmarks for select to authenticated
using(user_id=auth.uid());
drop policy if exists "Create own bookmarks" on public.article_bookmarks;
create policy "Create own bookmarks" on public.article_bookmarks for insert to authenticated
with check(user_id=auth.uid());
drop policy if exists "Delete own bookmarks" on public.article_bookmarks;
create policy "Delete own bookmarks" on public.article_bookmarks for delete to authenticated
using(user_id=auth.uid());

drop policy if exists "Read views for own articles" on public.article_views;
create policy "Read views for own articles" on public.article_views for select to authenticated
using(exists(select 1 from public.articles a where a.id=article_id and a.author_id=auth.uid()));
drop policy if exists "Record article views" on public.article_views;
create policy "Record article views" on public.article_views for insert
with check(user_id is null or user_id=auth.uid());

drop policy if exists "Read visible comments" on public.article_comments;
create policy "Read visible comments" on public.article_comments for select
using(status='visible' or author_id=auth.uid());
drop policy if exists "Write own comments" on public.article_comments;
create policy "Write own comments" on public.article_comments for insert to authenticated
with check(author_id=auth.uid());
drop policy if exists "Delete own comments" on public.article_comments;
create policy "Delete own comments" on public.article_comments for delete to authenticated
using(author_id=auth.uid());

-- Views and interaction counts are read from the related tables. Do not let clients directly edit view_count.
create or replace function public.record_article_view(p_article_id uuid, p_visitor_key text)
returns boolean language plpgsql security definer set search_path=public, pg_temp as $$
declare inserted_count integer;
begin
  if not exists(select 1 from public.articles where id=p_article_id and status='published') then
    return false;
  end if;
  insert into public.article_views(article_id,user_id,visitor_key)
  values(p_article_id,auth.uid(),left(regexp_replace(p_visitor_key,'[^a-zA-Z0-9_-]','','g'),100))
  on conflict(article_id,visitor_key,viewed_on) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count > 0 then
    update public.articles set view_count=view_count+1 where id=p_article_id;
    return true;
  end if;
  return false;
end; $$;
revoke all on function public.record_article_view(uuid,text) from public;
grant execute on function public.record_article_view(uuid,text) to anon, authenticated;

create or replace function public.set_articles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at=now();
  if new.status='published' and (old.status is distinct from 'published' or old.published_at is null) then
    new.published_at=now();
  end if;
  return new;
end; $$;
drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at before update on public.articles
for each row execute function public.set_articles_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('article-images','article-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do nothing;
drop policy if exists "Public article image reads" on storage.objects;
create policy "Public article image reads" on storage.objects for select using(bucket_id='article-images');
drop policy if exists "Upload own article images" on storage.objects;
create policy "Upload own article images" on storage.objects for insert to authenticated
with check(bucket_id='article-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Update own article images" on storage.objects;
create policy "Update own article images" on storage.objects for update to authenticated
using(bucket_id='article-images' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='article-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Delete own article images" on storage.objects;
create policy "Delete own article images" on storage.objects for delete to authenticated
using(bucket_id='article-images' and (storage.foldername(name))[1]=auth.uid()::text);
