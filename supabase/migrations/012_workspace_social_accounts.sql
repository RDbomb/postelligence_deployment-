-- ============================================================
-- 012_workspace_social_accounts.sql
-- Workspace-owned social accounts + linking scheduled posts back
-- to the workspace draft that spawned them.
--
-- Design: rather than a parallel table, `social_accounts` gains a
-- nullable `workspace_id`. Personal accounts keep workspace_id = NULL
-- and behave exactly as before (solo-user flow untouched). Workspace
-- accounts have workspace_id set and are owned by the workspace, not
-- by whichever member connected them. `user_id` becomes "who connected
-- it" for workspace rows and remains the owning identity for personal
-- rows, so no existing personal-account code path changes.
-- ============================================================

-- 1. Add workspace ownership + audit column
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS connected_by uuid REFERENCES auth.users(id);

UPDATE public.social_accounts SET connected_by = user_id WHERE connected_by IS NULL;

-- 2. Replace the old table-wide unique constraint with two partial ones,
--    since a workspace account and a member's personal account can now
--    legitimately share the same platform+account_id.
ALTER TABLE public.social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_platform_account_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_personal_unique
  ON public.social_accounts (user_id, platform, account_id)
  WHERE workspace_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_workspace_unique
  ON public.social_accounts (workspace_id, platform, account_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS social_accounts_workspace_id_idx ON public.social_accounts(workspace_id);

-- 3. RLS — additive policies for workspace-owned rows. The pre-existing
--    "own account" policies from 001 still apply unchanged to personal
--    rows (workspace_id IS NULL, user_id = auth.uid()).
CREATE POLICY "workspace social accounts select" ON public.social_accounts FOR SELECT
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace social accounts insert" ON public.social_accounts FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

CREATE POLICY "workspace social accounts update" ON public.social_accounts FOR UPDATE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

CREATE POLICY "workspace social accounts delete" ON public.social_accounts FOR DELETE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

-- 4. Link scheduled_posts back to the workspace draft that spawned them.
--    Needed so the background scheduler can flip the draft to
--    published/failed once the job actually runs, and so Reschedule /
--    Cancel Schedule can find the right row.
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS workspace_draft_id uuid REFERENCES public.workspace_drafts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace_draft ON public.scheduled_posts(workspace_draft_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace_id    ON public.scheduled_posts(workspace_id);

-- 6. A scheduled post can fail in the background, long after the draft was
--    flipped to "scheduled" and the person has moved on. Give the draft a
--    dedicated terminal state for that instead of overloading "rejected"
--    (which implies it needs the creator's attention/edits) — a failed
--    publish is an infrastructure problem, not a content problem.
ALTER TABLE public.workspace_drafts DROP CONSTRAINT IF EXISTS workspace_drafts_status_check;
ALTER TABLE public.workspace_drafts ADD CONSTRAINT workspace_drafts_status_check
  CHECK (status IN ('draft','pending_approval','approved','rejected','scheduled','published','failed'));

-- 5. Let workspace members see/manage workspace-scoped scheduled posts,
--    not just the member who happened to create the row (needed for
--    Reschedule/Cancel Schedule by a different owner/manager, and so
--    Creators/Analysts can see the post is live in Calendar).
CREATE POLICY "workspace scheduled posts select" ON public.scheduled_posts FOR SELECT
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace scheduled posts update" ON public.scheduled_posts FOR UPDATE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

CREATE POLICY "workspace scheduled posts delete" ON public.scheduled_posts FOR DELETE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );
