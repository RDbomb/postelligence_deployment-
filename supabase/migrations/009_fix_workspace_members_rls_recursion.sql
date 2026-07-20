-- ============================================================
-- 009_fix_workspace_members_rls_recursion.sql
-- Fixes: "infinite recursion detected in policy for relation
-- workspace_members"
--
-- Root cause: the members_select / members_insert / members_update /
-- members_delete policies on workspace_members queried
-- workspace_members from within their own USING / WITH CHECK clause.
-- Evaluating that subquery re-triggers the same policy, forever.
--
-- Fix: move the membership/role check into SECURITY DEFINER helper
-- functions. These run as the function owner and therefore bypass
-- RLS on the internal lookup, so they can safely be used inside a
-- policy on the same table without recursing.
-- ============================================================

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
  );
$$;

create or replace function public.workspace_member_role(p_workspace_id uuid, p_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.workspace_members
  where workspace_id = p_workspace_id and user_id = p_user_id;
$$;

revoke all on function public.is_workspace_member(uuid, uuid) from public;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;

revoke all on function public.workspace_member_role(uuid, uuid) from public;
grant execute on function public.workspace_member_role(uuid, uuid) to authenticated;

-- Replace the recursive policies
drop policy if exists "members_select" on public.workspace_members;
drop policy if exists "members_insert" on public.workspace_members;
drop policy if exists "members_update" on public.workspace_members;
drop policy if exists "members_delete" on public.workspace_members;

-- SELECT: see members of any workspace you belong to
create policy "members_select" on public.workspace_members for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

-- INSERT: you may only ever add yourself. This covers both real cases
-- in the app: creating a workspace (inserting yourself as owner) and
-- accepting an invite (inserting yourself with the invited role).
-- Adding other users always goes through the workspace_invites flow,
-- never a direct insert of someone else's row.
create policy "members_insert" on public.workspace_members for insert
  with check (user_id = auth.uid());

-- UPDATE: only the workspace owner can change a member's role
create policy "members_update" on public.workspace_members for update
  using (public.workspace_member_role(workspace_id, auth.uid()) = 'owner');

-- DELETE: only the workspace owner can remove a member
create policy "members_delete" on public.workspace_members for delete
  using (public.workspace_member_role(workspace_id, auth.uid()) = 'owner');