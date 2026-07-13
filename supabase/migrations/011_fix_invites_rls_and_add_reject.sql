-- ============================================================
-- 011_fix_invites_rls_and_add_reject.sql
-- Fixes: invite token always shows "invalid / expired", even
-- with a correct token.
--
-- Cause: invites_select only allowed owner/manager members to
-- read workspace_invites rows. The invitee is by definition NOT
-- a member yet, so both the invite-preview page
-- (/api/workspace/invite/[token]) and the accept route's own
-- lookup of the invite always returned zero rows.
--
-- Fix: also allow a user to see invite rows addressed to their
-- own email (taken from the JWT, no extra table lookup needed).
-- This is also what lets us drive an in-app notification list of
-- "invites addressed to me" instead of a manual token paste.
--
-- Also adds a `rejected` flag so invitees can decline an invite
-- from the notification bell, and tightens invites_update (it was
-- previously `USING (true)`, i.e. any authenticated user could
-- update any invite row).
-- ============================================================

alter table public.workspace_invites
  add column if not exists rejected boolean not null default false;

drop policy if exists "invites_select" on public.workspace_invites;
create policy "invites_select" on public.workspace_invites for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner','manager')
    )
    or email = (auth.jwt() ->> 'email')
  );

drop policy if exists "invites_update" on public.workspace_invites;
create policy "invites_update" on public.workspace_invites for update
  using (
    email = (auth.jwt() ->> 'email')
    or workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner','manager')
    )
  );

create index if not exists idx_workspace_invites_email on public.workspace_invites(email);