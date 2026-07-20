-- ============================================================
-- 014_workspace_report_reviews.sql
-- Stores the Analyst's Observations & Recommendations for a
-- specific Team Analytics report (workspace + date range), so the
-- "Analyst Reviews → Adds Observations & Recommendations → Export"
-- workflow persists instead of living only in the browser tab.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_report_reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  range_key        text NOT NULL,          -- 'today' | '7d' | '30d' | 'custom'
  range_from       date NOT NULL,
  range_to         date NOT NULL,
  observations     text NOT NULL DEFAULT '',
  recommendations  text NOT NULL DEFAULT '',
  reviewed_by      uuid REFERENCES auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, range_from, range_to)
);

CREATE INDEX IF NOT EXISTS report_reviews_workspace_idx ON public.workspace_report_reviews(workspace_id);

ALTER TABLE public.workspace_report_reviews ENABLE ROW LEVEL SECURITY;

-- Coarse gating at the RLS layer (workspace membership, like every
-- other workspace_* table) — the Analyst/Owner-only write rule for
-- observations & recommendations is enforced in the API route via
-- canManageReportInsights(), the same pattern used for draft
-- create/edit/approve permissions elsewhere in this schema.
CREATE POLICY "report_reviews_select" ON public.workspace_report_reviews FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "report_reviews_insert" ON public.workspace_report_reviews FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "report_reviews_update" ON public.workspace_report_reviews FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
