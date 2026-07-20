alter table public.scheduled_posts
  add column if not exists platform_results jsonb not null default '[]'::jsonb;

