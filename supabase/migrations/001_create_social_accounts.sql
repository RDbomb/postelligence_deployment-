create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  account_id text not null,
  account_name text not null,
  account_avatar_url text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, account_id)
);

create index if not exists social_accounts_user_id_idx
  on public.social_accounts(user_id);

create index if not exists social_accounts_platform_idx
  on public.social_accounts(platform);

alter table public.social_accounts enable row level security;

create policy "Users can read their own social accounts"
  on public.social_accounts
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own social accounts"
  on public.social_accounts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own social accounts"
  on public.social_accounts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own social accounts"
  on public.social_accounts
  for delete
  using (auth.uid() = user_id);
