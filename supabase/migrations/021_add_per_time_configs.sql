-- Migration 021: Add per-time configurations support
alter table public.automation_settings 
  add column if not exists use_same_settings boolean not null default true,
  add column if not exists time_configs jsonb not null default '{}'::jsonb;
