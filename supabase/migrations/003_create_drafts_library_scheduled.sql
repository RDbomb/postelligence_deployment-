-- ============================================================
-- PostSync: Drafts, Media Library, and Scheduled Posts tables
-- Migration: 003
-- ============================================================

-- -----------------------------------------------------------
-- 1. DRAFTS TABLE
-- -----------------------------------------------------------
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  media_urls text[] not null default '{}',
  platforms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drafts_user_id_idx on public.drafts(user_id);
create index if not exists drafts_updated_at_idx on public.drafts(updated_at desc);

alter table public.drafts enable row level security;

create policy "Users can read their own drafts"
  on public.drafts for select
  using (auth.uid() = user_id);

create policy "Users can create their own drafts"
  on public.drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on public.drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own drafts"
  on public.drafts for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger drafts_set_updated_at
  before update on public.drafts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------
-- 2. MEDIA LIBRARY TABLE
-- -----------------------------------------------------------
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null, -- 'image' | 'video'
  file_size bigint,
  uploaded_at timestamptz not null default now()
);

create index if not exists media_library_user_id_idx on public.media_library(user_id);
create index if not exists media_library_uploaded_at_idx on public.media_library(uploaded_at desc);

alter table public.media_library enable row level security;

create policy "Users can read their own media"
  on public.media_library for select
  using (auth.uid() = user_id);

create policy "Users can insert their own media"
  on public.media_library for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own media"
  on public.media_library for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------
-- 3. SCHEDULED POSTS TABLE
-- -----------------------------------------------------------
create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  media_urls text[] not null default '{}',
  platforms text[] not null default '{}',
  scheduled_time timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'publishing', 'published', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_posts_user_id_idx on public.scheduled_posts(user_id);
create index if not exists scheduled_posts_scheduled_time_idx on public.scheduled_posts(scheduled_time);
create index if not exists scheduled_posts_status_idx on public.scheduled_posts(status);

alter table public.scheduled_posts enable row level security;

create policy "Users can read their own scheduled posts"
  on public.scheduled_posts for select
  using (auth.uid() = user_id);

create policy "Users can create their own scheduled posts"
  on public.scheduled_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scheduled posts"
  on public.scheduled_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own scheduled posts"
  on public.scheduled_posts for delete
  using (auth.uid() = user_id);

create trigger scheduled_posts_set_updated_at
  before update on public.scheduled_posts
  for each row execute function public.set_updated_at();
