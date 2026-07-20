import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, WorkspaceActions } from "@/lib/workspace/activity-logger";
import { canExportReports, canViewTeamAnalytics } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/types";

export const dynamic = "force-dynamic";

const EVENT_ACTIONS = {
  generate: WorkspaceActions.REPORT_GENERATED,
  export_csv: WorkspaceActions.REPORT_EXPORTED_CSV,
  export_pdf: WorkspaceActions.REPORT_EXPORTED_PDF,
} as const;

type EventType = keyof typeof EVENT_ACTIONS;

// POST /api/workspace/[id]/report-event
// Body: { type: "generate" | "export_csv" | "export_pdf" }
// Fire-and-forget audit trail for the report workflow, and the raw
// signal behind the Analyst's "Reports Generated" / "Reports
// Exported" contribution metrics.
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const type = body?.type as EventType;
  if (!type || !(type in EVENT_ACTIONS)) {
    return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
  }

  const role = membership.role as WorkspaceRole;
  if (type === "generate" && !canViewTeamAnalytics(role)) {
    return NextResponse.json({ error: "Not permitted to generate this report." }, { status: 403 });
  }
  if ((type === "export_csv" || type === "export_pdf") && !canExportReports(role)) {
    return NextResponse.json({ error: "Only the Analyst or Owner can export this report." }, { status: 403 });
  }

  const { data: userData } = await admin.auth.admin.getUserById(user.id);
  const userName = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Unknown";

  await logActivity(supabase, params.id, user.id, EVENT_ACTIONS[type], {
    entityType: "team_analytics_report",
    metadata:   { user_name: userName },
  });

  return NextResponse.json({ ok: true });
}
