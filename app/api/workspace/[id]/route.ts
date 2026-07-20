import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, WorkspaceActions } from "@/lib/workspace/activity-logger";
import { canDeleteWorkspace } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/types";

export const dynamic = "force-dynamic";

// ── Helper: get user's role in a workspace ───────────────────
async function getUserRole(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();
  return (data?.role as WorkspaceRole) ?? null;
}

// ── PATCH /api/workspace/[id] ────────────────────────────────
// Update workspace name (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(supabase, params.id, user.id);
  if (role !== "owner") {
    return NextResponse.json({ error: "Only the workspace owner can update workspace settings." }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workspaces")
    .update({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  const { data: userData } = await admin.auth.admin.getUserById(user.id);
  const userName = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Unknown";
  await logActivity(supabase, params.id, user.id, WorkspaceActions.WORKSPACE_UPDATED, {
    metadata: { user_name: userName, new_name: name.trim() },
  });

  return NextResponse.json({ workspace: data });
}

// ── DELETE /api/workspace/[id] ───────────────────────────────
// Delete workspace entirely (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(supabase, params.id, user.id);
  if (!role || !canDeleteWorkspace(role)) {
    return NextResponse.json({ error: "Only the workspace owner can delete the workspace." }, { status: 403 });
  }

  // Deleting the workspace cascades to members, drafts, comments, activity log
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
