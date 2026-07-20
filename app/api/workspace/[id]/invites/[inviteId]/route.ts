import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canManageMembers } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/types";

export const dynamic = "force-dynamic";

// ── DELETE /api/workspace/[id]/invites/[inviteId] ───────────
// Cancels a pending invite (owner/manager only). Lets the same
// email be re-invited afterward, since the "already invited"
// check only looks at non-cancelled pending invites.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; inviteId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.id)
    .eq("user_id", user.id)
    .single();

  const role = (membership?.role as WorkspaceRole) ?? null;
  if (!role || !canManageMembers(role)) {
    return NextResponse.json({ error: "Only the workspace owner can cancel invites." }, { status: 403 });
  }

  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", params.inviteId)
    .eq("workspace_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}