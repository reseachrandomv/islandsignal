-- IslandSignal database schema + row-level security
-- Run this whole file once in Supabase Dashboard > SQL Editor > New query > Run.

create extension if not exists "pgcrypto";

-- ISLANDS ------------------------------------------------------------
create table if not exists public.islands (
  id text primary key,                 -- short slug, e.g. 'male'
  name text not null,
  atoll text
);

-- PROFILES (one per auth user) --------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 40),
  role text not null default 'user' check (role in ('user','trusted','official','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1))
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- POSTS --------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  island_id text not null references public.islands(id),
  category text not null check (category in ('water','electricity','internet','ferry','roads','lost_found','missing_pet','announcement','event','notice')),
  title text not null check (char_length(title) between 4 and 90),
  body text not null check (char_length(body) between 10 and 1000),
  area text check (char_length(area) <= 80),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  image_url text,
  trust text not null default 'community' check (trust in ('official','trusted','community')),
  status text not null default 'active' check (status in ('active','resolved','removed')),
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index if not exists posts_feed_idx on public.posts (island_id, status, created_at desc);

-- Set trust from author's role and expiry from category; block users changing protected fields.
create or replace function public.posts_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if tg_op = 'INSERT' then
    select role into r from profiles where id = auth.uid();
    new.author_id := auth.uid();
    new.trust := case when r in ('official','admin') then 'official' when r = 'trusted' then 'trusted' else 'community' end;
    new.status := 'active';
    new.created_at := now();
    new.expires_at := now() + case new.category
      when 'ferry' then interval '12 hours' when 'roads' then interval '72 hours'
      when 'lost_found' then interval '14 days' when 'missing_pet' then interval '14 days'
      when 'announcement' then interval '7 days' when 'event' then interval '7 days'
      when 'notice' then interval '14 days' else interval '24 hours' end;
    -- simple rate limit: max 10 posts per user per hour
    if (select count(*) from posts where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
      raise exception 'Too many reports in the last hour. Please wait.';
    end if;
  elsif tg_op = 'UPDATE' and not public.is_admin() then
    -- authors may only mark their own post resolved
    if new.status not in ('active','resolved') or new.trust <> old.trust or new.author_id is distinct from old.author_id
       or new.title <> old.title or new.body <> old.body or new.island_id <> old.island_id then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists posts_before_write on public.posts;
create trigger posts_before_write before insert or update on public.posts
  for each row execute function public.posts_before_write();

-- CONFIRMATIONS ("still happening") & FLAGS ---------------------------
create table if not exists public.confirmations (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.flags (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Feed view with counts and author name (respects posts RLS via security_invoker)
create or replace view public.posts_view with (security_invoker = on) as
select p.*, pr.display_name as author_name,
  (select count(*) from confirmations c where c.post_id = p.id)::int as confirm_count,
  (select count(*) from flags f where f.post_id = p.id)::int as flag_count
from posts p left join profiles pr on pr.id = p.author_id;

-- Admin RPCs
create or replace function public.admin_set_trust(p_id uuid, p_trust text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  update posts set trust = p_trust where id = p_id;
end $$;
create or replace function public.admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  update profiles set role = p_role where id = p_user;
end $$;

-- ROW LEVEL SECURITY -------------------------------------------------
alter table public.islands enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.confirmations enable row level security;
alter table public.flags enable row level security;

drop policy if exists "islands readable" on public.islands;
create policy "islands readable" on public.islands for select using (true);
drop policy if exists "islands admin" on public.islands;
create policy "islands admin" on public.islands for all using (is_admin()) with check (is_admin());

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select
  using (status <> 'removed' or author_id = auth.uid() or is_admin());
drop policy if exists "posts signed-in insert" on public.posts;
create policy "posts signed-in insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists "posts author or admin update" on public.posts;
create policy "posts author or admin update" on public.posts for update to authenticated
  using (author_id = auth.uid() or is_admin());
drop policy if exists "posts admin delete" on public.posts;
create policy "posts admin delete" on public.posts for delete using (is_admin());

drop policy if exists "confirm read" on public.confirmations;
create policy "confirm read" on public.confirmations for select using (true);
drop policy if exists "confirm insert own" on public.confirmations;
create policy "confirm insert own" on public.confirmations for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "flags admin read" on public.flags;
create policy "flags admin read" on public.flags for select using (is_admin() or user_id = auth.uid());
drop policy if exists "flags insert own" on public.flags;
create policy "flags insert own" on public.flags for insert to authenticated with check (user_id = auth.uid());

-- flag_count in the view needs to count all flags; expose via a definer function instead of direct reads
create or replace function public.flag_count(p uuid) returns int language sql stable security definer set search_path=public as
$$ select count(*)::int from flags where post_id = p $$;
create or replace view public.posts_view with (security_invoker = on) as
select p.*, pr.display_name as author_name,
  (select count(*) from confirmations c where c.post_id = p.id)::int as confirm_count,
  public.flag_count(p.id) as flag_count
from posts p left join profiles pr on pr.id = p.author_id;

-- STORAGE: public bucket for report photos (5 MB, images only) --------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "report images read" on storage.objects;
create policy "report images read" on storage.objects for select using (bucket_id = 'report-images');
drop policy if exists "report images upload own folder" on storage.objects;
create policy "report images upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "report images admin delete" on storage.objects;
create policy "report images admin delete" on storage.objects for delete using (bucket_id = 'report-images' and public.is_admin());

-- REALTIME for live feed / notifications
alter publication supabase_realtime add table public.posts;
