-- ============================================================
-- 016_workspace_reports_and_notifications.sql
-- Turns the Analyst's "Save Review" step into a real submission
-- workflow: workspace_report_reviews stays as the Analyst's working
-- draft (Observations & Recommendations), but clicking "Submit
-- Report" now snapshots the full report (Executive Summary,
-- Observations, Recommendations, Charts, Team & Platform Analytics)
-- into workspace_reports as an official, immutable-until-changes-
-- requested record that the Owner/Manager can view, download, and
-- archive from a dedicated Reports section.
--
-- workspace_notifications powers the in-app bell for "a new report
-- was submitted" (Owner/Manager) and "changes were requested on your
-- report" (Analyst) — separate from the existing workspace_invites
-- notification stream so invite handling is untouched.
-- ============================================================

-- 1. Official submitted reports ---------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  range_key             text NOT NULL,          -- 'today' | '7d' | '30d' | 'custom'
  range_from            date NOT NULL,
  range_to              date NOT NULL,

  status                text NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted', 'changes_requested', 'archived')),

  -- Snapshot of the report content at submission time, so the
  -- official record never silently changes underneath the Owner/
  -- Manager even if live analytics later shift.
  executive_summary     text NOT NULL DEFAULT '',
  observations          text NOT NULL DEFAULT '',
  recommendations       text NOT NULL DEFAULT '',
  charts_data           jsonb NOT NULL DEFAULT '{}'::jsonb,     -- overview / platform / top-post / publishing-issue tables
  analytics_data        jsonb NOT NULL DEFAULT '{}'::jsonb,     -- team & platform analytics + member roster snapshot

  submitted_by          uuid REFERENCES auth.users(id),
  submitted_at          timestamptz NOT NULL DEFAULT now(),

  change_request_note   text,
  change_requested_by   uuid REFERENCES auth.users(id),
  change_requested_at   timestamptz,

  archived_by           uuid REFERENCES auth.users(id),
  archived_at           timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (workspace_id, range_from, range_to)
);

CREATE INDEX IF NOT EXISTS workspace_reports_workspace_idx ON public.workspace_reports(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_reports_submitted_by_idx ON public.workspace_reports(submitted_by);
CREATE INDEX IF NOT EXISTS workspace_reports_status_idx ON public.workspace_reports(workspace_id, status);

ALTER TABLE public.workspace_reports ENABLE ROW LEVEL SECURITY;

-- Coarse gating at the RLS layer (workspace membership) — same
-- pattern as workspace_report_reviews. Fine-grained rules (Analyst
-- only sees their own submissions; only Owner/Analyst can submit;
-- only Owner/Manager can archive; only Owner can request changes)
-- are enforced in the API routes, mirroring canManageReportInsights().
CREATE POLICY "workspace_reports_select" ON public.workspace_reports FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_reports_insert" ON public.workspace_reports FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_reports_update" ON public.workspace_reports FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- 2. In-app notifications ----------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- recipient
  type          text NOT NULL CHECK (type IN ('report_submitted', 'report_changes_requested', 'report_archived')),
  title         text NOT NULL,
  body          text NOT NULL DEFAULT '',
  entity_type   text NOT NULL DEFAULT 'workspace_report',
  entity_id     uuid,
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_notifications_recipient_idx
  ON public.workspace_notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.workspace_notifications ENABLE ROW LEVEL SECURITY;

-- A notification is private to its recipient. Rows are written by
-- the API route using the service-role admin client (the submitting
-- Analyst isn't themselves a member of "being the Owner", so a
-- normal RLS insert check can't authorize writing another user's
-- notification) — so no INSERT policy is needed for the anon/authed
-- role here, only SELECT/UPDATE for the recipient to read their own
-- feed and mark items read.
CREATE POLICY "workspace_notifications_select" ON public.workspace_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "workspace_notifications_update" ON public.workspace_notifications FOR UPDATE
  USING (user_id = auth.uid());
