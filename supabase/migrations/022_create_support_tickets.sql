-- Create support tickets table
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  category text not null,
  priority text not null,
  description text not null,
  status text not null default 'open',
  images text[] not null default '{}'::text[],
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.support_tickets enable row level security;

-- Policies for users
create policy "Users can insert their own tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

create policy "Users can update their own tickets"
  on public.support_tickets for update
  using (auth.uid() = user_id);
