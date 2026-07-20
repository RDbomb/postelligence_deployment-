import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActionLabel } from "@/lib/workspace/activity-logger";
import type { WorkspaceRole, WorkspaceActivityLog } from "@/types";

export const dynamic = "force-dynamic";

// ── GET /api/workspace/[id]/activity ────────────────────────
// Returns paginated activity log for a workspace
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Must be a member
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Not a member of this workspace." }, { status: 403 });
  }

  // Pagination via query params
  const url    = new URL(req.url);
  const limit  = parseInt(url.searchParams.get("limit")  || "30");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data: logs, error, count } = await supabase
    .from("workspace_activity_log")
    .select("*", { count: "exact" })
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with user info
  const enriched = await Promise.all(
    (logs || []).map(async (log) => {
      const { data: userData } = await admin.auth.admin.getUserById(log.user_id);
      const userName   = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Unknown";
      const avatarUrl  = userData?.user?.user_metadata?.avatar_url || "";
      const metadata   = { ...((log.metadata as Record<string, unknown>) || {}), user_name: userName };
      return {
        ...log,
        user_name:   userName,
        user_avatar: avatarUrl,
        label:       getActionLabel(log.action as any, metadata),
      } as WorkspaceActivityLog & { label: string };
    })
  );

  return NextResponse.json({
    logs:   enriched,
    total:  count ?? 0,
    limit,
    offset,
  });
}