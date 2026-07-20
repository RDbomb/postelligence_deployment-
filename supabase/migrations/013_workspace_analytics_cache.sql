-- ============================================================
-- 013_workspace_analytics_cache.sql
-- Extends analytics_cache so Team Analytics can use the same
-- stale-while-revalidate caching pattern as Solo Analytics,
-- without touching the existing personal-cache behavior.
--
-- Design mirrors migration 012 (social_accounts): analytics_cache
-- gains a nullable `workspace_id`. Personal cache rows keep
-- workspace_id = NULL and behave exactly as before. Workspace
-- cache rows are keyed by workspace_id instead of user_id.
-- ============================================================

ALTER TABLE public.analytics_cache
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- The old table-wide unique constraint on user_id can't distinguish
-- "this user's personal cache" from "a workspace cache row this user
-- happened to write" — replace it with two partial unique indexes,
-- same trick used for social_accounts in migration 012.
ALTER TABLE public.analytics_cache DROP CONSTRAINT IF EXISTS analytics_cache_user_unique;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_cache_personal_unique
  ON public.analytics_cache (user_id) WHERE workspace_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_cache_workspace_unique
  ON public.analytics_cache (workspace_id) WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS analytics_cache_workspace_id_idx ON public.analytics_cache(workspace_id);

-- Workspace members can read the workspace's cache row. Any member can
-- also trigger a write (refresh) — cached analytics aren't sensitive,
-- unlike the underlying account tokens used to produce them.
CREATE POLICY "workspace analytics cache select" ON public.analytics_cache FOR SELECT
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace analytics cache insert" ON public.analytics_cache FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL AND
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace analytics cache update" ON public.analytics_cache FOR UPDATE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace analytics cache delete" ON public.analytics_cache FOR DELETE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );
