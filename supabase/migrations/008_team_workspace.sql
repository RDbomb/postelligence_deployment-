-- ============================================================
-- 008_team_workspace.sql
-- Team Workspace feature tables
-- ============================================================

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('owner','manager','creator','analyst')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- 3. Workspace Invites
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL CHECK (role IN ('manager','creator','analyst')),
  token        text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT now() + INTERVAL '7 days'
);

-- 4. Workspace Drafts (separate from personal drafts)
CREATE TABLE IF NOT EXISTS public.workspace_drafts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               text NOT NULL DEFAULT '',
  description         text NOT NULL DEFAULT '',
  media_urls          text[] NOT NULL DEFAULT '{}',
  platforms           text[] NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','pending_approval','approved','rejected','scheduled','published')),
  submitted_at        timestamptz,
  reviewed_by         uuid REFERENCES auth.users(id),
  reviewed_at         timestamptz,
  rejection_reason    text,
  linkedin_media_urn  text,
  youtube_video_id    text,
  scheduled_time      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 5. Workspace Draft Comments
CREATE TABLE IF NOT EXISTS public.workspace_draft_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id     uuid NOT NULL REFERENCES public.workspace_drafts(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 6. Workspace Activity Log
CREATE TABLE IF NOT EXISTS public.workspace_activity_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       text NOT NULL,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 7. Add optional workspace_id to scheduled_posts (backward compatible)
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.workspaces              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_drafts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_draft_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activity_log  ENABLE ROW LEVEL SECURITY;

-- Workspaces: members can view, owner can update/delete
CREATE POLICY "workspace_select" ON public.workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_insert" ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspace_update" ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "workspace_delete" ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Workspace Members: members can view their workspace's members
CREATE POLICY "members_select" ON public.workspace_members FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "members_insert" ON public.workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

CREATE POLICY "members_update" ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "members_delete" ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Workspace Invites: owner/manager can manage
CREATE POLICY "invites_select" ON public.workspace_invites FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

CREATE POLICY "invites_insert" ON public.workspace_invites FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

CREATE POLICY "invites_update" ON public.workspace_invites FOR UPDATE
  USING (true); -- needed for accepting invites

CREATE POLICY "invites_delete" ON public.workspace_invites FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

-- Workspace Drafts: all workspace members can view
CREATE POLICY "wdrafts_select" ON public.workspace_drafts FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "wdrafts_insert" ON public.workspace_drafts FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "wdrafts_update" ON public.workspace_drafts FOR UPDATE
  USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "wdrafts_delete" ON public.workspace_drafts FOR DELETE
  USING (
    created_by = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','manager')
    )
  );

-- Comments: all workspace members can view and post
CREATE POLICY "comments_select" ON public.workspace_draft_comments FOR SELECT
  USING (
    draft_id IN (
      SELECT id FROM public.workspace_drafts
      WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "comments_insert" ON public.workspace_draft_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    draft_id IN (
      SELECT id FROM public.workspace_drafts
      WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "comments_delete" ON public.workspace_draft_comments FOR DELETE
  USING (user_id = auth.uid());

-- Activity Log: all workspace members can view
CREATE POLICY "activity_select" ON public.workspace_activity_log FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "activity_insert" ON public.workspace_activity_log FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_user    ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws      ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_drafts_ws       ON public.workspace_drafts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_drafts_status   ON public.workspace_drafts(status);
CREATE INDEX IF NOT EXISTS idx_workspace_drafts_creator  ON public.workspace_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_comments_draft  ON public.workspace_draft_comments(draft_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_ws     ON public.workspace_activity_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_time   ON public.workspace_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token   ON public.workspace_invites(token);