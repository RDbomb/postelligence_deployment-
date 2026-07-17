-- Add platforms column to automation_logs
alter table public.automation_logs add column if not exists platforms text[] not null default '{}';
