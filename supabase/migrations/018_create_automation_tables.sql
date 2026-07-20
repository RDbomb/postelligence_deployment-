-- ============================================================
-- Postelligence: Automation Settings and Logs tables
-- Migration: 018
-- ============================================================

-- 1. AUTOMATION SETTINGS TABLE
create table if not exists public.automation_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  is_enabled boolean not null default false,
  post_time time not null default '09:00:00',
  mode text not null default 'manual' check (mode in ('manual', 'automatic')),
  platforms text[] not null default '{}',
  categories text[] not null default '{}',
  keywords text[] not null default '{}',
  approval_email text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists automation_settings_user_id_idx on public.automation_settings(user_id);
alter table public.automation_settings enable row level security;

create policy "Users can view their own automation settings"
  on public.automation_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own automation settings"
  on public.automation_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own automation settings"
  on public.automation_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own automation settings"
  on public.automation_settings for delete
  using (auth.uid() = user_id);

-- 2. AUTOMATION LOGS TABLE
create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trend_title text not null,
  caption text not null,
  media_url text not null default '',
  mode text not null, -- 'manual' | 'automatic'
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'published', 'failed')),
  scheduled_post_id uuid references public.scheduled_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automation_logs_user_id_idx on public.automation_logs(user_id);
alter table public.automation_logs enable row level security;

create policy "Users can view their own automation logs"
  on public.automation_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own automation logs"
  on public.automation_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own automation logs"
  on public.automation_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own automation logs"
  on public.automation_logs for delete
  using (auth.uid() = user_id);

-- 3. TRIGGERS FOR UPDATED_AT
create trigger automation_settings_set_updated_at
  before update on public.automation_settings
  for each row execute function public.set_updated_at();

create trigger automation_logs_set_updated_at
  before update on public.automation_logs
  for each row execute function public.set_updated_at();
