import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, WorkspaceActions } from "@/lib/workspace/activity-logger";

export const dynamic = "force-dynamic";

// ── POST /api/workspace/invite/accept ───────────────────────
// Accept an invite token — adds user to workspace
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  // Validate the invite. Must not already be accepted OR rejected —
  // a rejected invite is a closed decision and must never be
  // accept-able afterward (e.g. via a stale token/tab).
  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invites")
    .select("*, workspace:workspaces(id, name)")
    .eq("token", token)
    .eq("accepted", false)
    .eq("rejected", false)
    .eq("email", user.email)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invite not found or has expired." },
      { status: 404 }
    );
  }

  // Check user is not already in a workspace
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return NextResponse.json(
      { error: "You are already a member of a workspace. Leave it before accepting a new invite." },
      { status: 400 }
    );
  }

  // Add user to workspace
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: invite.workspace_id,
      user_id:      user.id,
      role:         invite.role,
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Mark invite as accepted
  await supabase
    .from("workspace_invites")
    .update({ accepted: true })
    .eq("id", invite.id);

  // Log activity
  const { data: userData } = await admin.auth.admin.getUserById(user.id);
  const userName = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Unknown";

  await logActivity(supabase, invite.workspace_id, user.id, WorkspaceActions.MEMBER_JOINED, {
    metadata: { user_name: userName },
  });

  return NextResponse.json({
    success:     true,
    workspace:   invite.workspace,
    role:        invite.role,
  });
}