-- Create global system settings table
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null
);

-- Enable RLS
alter table public.system_settings enable row level security;

-- Select policies
create policy "Anyone can select system settings"
  on public.system_settings for select
  using (true);

-- Insert/Update default values
insert into public.system_settings (key, value)
values ('chat_support_enabled', 'true'::jsonb)
on conflict (key) do nothing;
