-- Add typing status column to support tickets
alter table public.support_tickets 
  add column if not exists typing_status jsonb not null default '{"user": false, "admin": false}'::jsonb;
