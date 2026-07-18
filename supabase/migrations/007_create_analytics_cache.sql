-- ============================================================
-- Postelligence: Analytics Cache Table
-- Migration: 007
-- ============================================================
--
-- PURPOSE:
--   Stores the last fetched analytics result per user so the
--   Analytics page loads instantly from cache instead of calling
--   every platform API on every page load.
--
-- HOW IT WORKS (stale-while-revalidate pattern):
--   1. On page load, the server checks this table first.
--   2. If a fresh cache row exists (< 30 min old) → serve it instantly.
--   3. If the row is stale (30–60 min old) → serve it instantly AND
--      trigger a background refresh via POST /api/analytics/refresh.
--   4. If no row or older than 60 min → fetch live from all platforms,
--      then write the result here for next time.
--
-- COLUMNS:
--   user_id       → one row per Postelligence user (unique constraint)
--   data          → full AnalyticsDashboardData JSON blob
--   cached_at     → when the data was last fetched from platform APIs
--   is_refreshing → prevents duplicate background refreshes running
--                   concurrently for the same user
--
-- TTL CONSTANTS (defined in lib/analytics/analytics-cache.ts):
--   FRESH_TTL_MINUTES = 30   → serve cache without refreshing
--   STALE_TTL_MINUTES = 60   → serve cache + background refresh
--   > 60 min old             → treat as cache miss, fetch fresh
--
-- NOTE FOR DEVELOPERS:
--   This table already exists in production. This migration file is
--   provided so new developers can recreate it in a fresh Supabase
--   project. Running it on the production database is safe because
--   of the "if not exists" guard.
-- ============================================================

create table if not exists public.analytics_cache (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  data          jsonb       not null,
  cached_at     timestamptz not null default now(),
  is_refreshing boolean     not null default false,

  constraint analytics_cache_user_unique unique (user_id)
);

-- Only the owning user can read/write their own cache row
alter table public.analytics_cache enable row level security;

create policy "Users can read own analytics cache"
  on public.analytics_cache for select
  using (auth.uid() = user_id);

create policy "Users can insert own analytics cache"
  on public.analytics_cache for insert
  with check (auth.uid() = user_id);

create policy "Users can update own analytics cache"
  on public.analytics_cache for update
  using (auth.uid() = user_id);

create policy "Users can delete own analytics cache"
  on public.analytics_cache for delete
  using (auth.uid() = user_id);

-- Index for fast single-user lookup (the only query pattern used)
create index if not exists analytics_cache_user_id_idx
  on public.analytics_cache (user_id);