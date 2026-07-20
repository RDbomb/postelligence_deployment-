-- ============================================================
-- Postelligence: Atomic claiming for the auto-publish scheduler
-- Migration: 015
-- ============================================================
--
-- ROOT CAUSE of "posts sometimes publish twice/thrice, some fail":
-- the scheduler(s) only ever ran a plain SELECT for
-- status = 'pending' AND scheduled_time <= now(), processed those rows,
-- and wrote the final status at the very end. While a post was being
-- published (which can take 10s of seconds per platform, longer for
-- Instagram/Threads video), it still showed as "pending" in the database.
-- That means:
--   1. Two overlapping scheduler runs (e.g. the Vercel cron hitting
--      /api/scheduler/run every minute, and/or a pg_cron tick firing the
--      Supabase Edge Function while the previous run was still busy with a
--      big batch of 20-25 posts) could both select the SAME rows and
--      publish them again, in parallel -> duplicate posts.
--   2. If a run got cut off mid-way (function timeout/crash) before it
--      reached the final status update, the row stayed "pending" forever
--      and the next tick reprocessed it from scratch -> another duplicate,
--      and sometimes a genuine failure from the platform (rate limit /
--      duplicate-content rejection) on the second attempt.
--
-- FIX: claim rows atomically by flipping them to 'publishing' inside a
-- single UPDATE ... FOR UPDATE SKIP LOCKED statement. Postgres guarantees
-- only one caller can lock/claim a given row, so this is safe even with
-- multiple schedulers or overlapping invocations running at the same time.

alter table public.scheduled_posts
  add column if not exists claim_attempts integer not null default 0;

alter table public.scheduled_posts
  add column if not exists claimed_at timestamptz;

create or replace function public.claim_due_scheduled_posts(p_batch_size int)
returns setof public.scheduled_posts
language plpgsql
as $$
begin
  -- Give up on posts that have been stuck in "publishing" for a long time
  -- (the scheduler run that claimed them crashed or timed out) AND have
  -- already been retried 3 times. Marking them "failed" explicitly means
  -- they show up as a real, visible failure the user can reschedule,
  -- instead of sitting invisibly in limbo and potentially being retried
  -- forever.
  update public.scheduled_posts
  set status = 'failed',
      platform_results = platform_results || jsonb_build_array(
        jsonb_build_object(
          'platform', 'system',
          'status', 'failed',
          'message', 'Publishing did not complete after multiple attempts. Please reschedule this post.'
        )
      ),
      updated_at = now()
  where status = 'publishing'
    and claimed_at < now() - interval '10 minutes'
    and claim_attempts >= 3;

  -- Claim (a) newly-due pending posts and (b) posts stuck in "publishing"
  -- from a crashed/timed-out run that hasn't hit the retry cap yet.
  -- SKIP LOCKED means concurrent callers never wait on / double-claim the
  -- same row — each row goes to exactly one caller.
  return query
  update public.scheduled_posts
  set status = 'publishing',
      claimed_at = now(),
      claim_attempts = claim_attempts + 1,
      updated_at = now()
  where id in (
    select id from public.scheduled_posts
    where (
      (status = 'pending' and scheduled_time <= now())
      or (status = 'publishing' and claimed_at < now() - interval '10 minutes' and claim_attempts < 3)
    )
    order by scheduled_time asc
    limit p_batch_size
    for update skip locked
  )
  returning *;
end;
$$;

grant execute on function public.claim_due_scheduled_posts(int) to service_role;
grant execute on function public.claim_due_scheduled_posts(int) to authenticated;