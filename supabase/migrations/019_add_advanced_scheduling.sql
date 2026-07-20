-- ============================================================
-- Postelligence: Advanced Scheduling Support
-- Migration: 019
-- ============================================================

ALTER TABLE public.automation_settings 
  ADD COLUMN IF NOT EXISTS schedule_type text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS post_times text[] NOT NULL DEFAULT '{"09:00:00"}',
  ADD COLUMN IF NOT EXISTS post_days text[] NOT NULL DEFAULT '{"monday","tuesday","wednesday","thursday","friday","saturday","sunday"}',
  ADD COLUMN IF NOT EXISTS post_day_of_month integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS frontend_url text NOT NULL DEFAULT 'http://localhost:3000',
  ADD COLUMN IF NOT EXISTS last_triggered_slot text;
