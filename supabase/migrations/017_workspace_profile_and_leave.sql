-- ============================================================
-- 017_workspace_profile_and_leave.sql
-- Adds an editable "team profile" description field to workspaces,
-- and RLS support for members leaving a workspace on their own.
-- ============================================================

-- 1. Team profile: an optional short description the owner can set,
--    shown alongside the workspace name.
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

-- 2. Allow a member to delete their OWN membership row (i.e. "leave
--    workspace"), but never the owner's own row — owners must use
--    the "Delete workspace" (dismiss) flow instead.
DROP POLICY IF EXISTS "workspace_members_leave" ON public.workspace_members;
CREATE POLICY "workspace_members_leave" ON public.workspace_members FOR DELETE
  USING (
    user_id = auth.uid()
    AND role <> 'owner'
  );
