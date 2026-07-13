-- ============================================================
-- 010_fix_workspaces_select_after_insert.sql
-- Fixes: "new row violates row-level security policy for table
-- workspaces" when creating a new workspace.
--
-- Cause: supabase-js's .insert().select() asks Postgres to return
-- the newly inserted row, which means the row must also pass the
-- table's SELECT policy (not just the INSERT policy). workspace_select
-- only granted access via workspace_members, but the owner's membership
-- row for a brand new workspace doesn't exist yet at the moment the
-- workspace itself is inserted (it's created in a separate follow-up
-- insert in app/api/workspace/route.ts). Chicken-and-egg -> RLS
-- violation, even though the INSERT's own WITH CHECK passes fine.
--
-- Fix: also allow the owner to see their own workspace directly,
-- independent of workspace_members.
-- ============================================================

drop policy if exists "workspace_select" on public.workspaces;

create policy "workspace_select" on public.workspaces for select
  using (
    owner_id = auth.uid()
    or id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );