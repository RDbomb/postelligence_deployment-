import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type WorkspaceNotificationType =
  | "report_submitted"
  | "report_changes_requested"
  | "report_archived"
  | "invite_rejected";

// ── Look up the user ids of workspace members holding any of the
// given roles, optionally excluding the acting user (no need to
// notify yourself about your own action). ─────────────────────
export async function getMemberIdsByRole(
  supabase: SupabaseClient,
  workspaceId: string,
  roles: string[],
  excludeUserId?: string
): Promise<string[]> {
  const { data } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .in("role", roles);

  return (data || [])
    .map((m) => m.user_id as string)
    .filter((id) => id && id !== excludeUserId);
}

// ── Write an in-app notification for one or more recipients. Uses
// the service-role admin client because the recipient is very often
// someone other than the authenticated caller (e.g. the Analyst
// submitting a report notifies the Owner/Manager) — a normal RLS
// insert check can't authorize writing another user's row. ───────
export async function notifyWorkspaceUsers(
  workspaceId: string,
  userIds: string[],
  type: WorkspaceNotificationType,
  title: string,
  body: string,
  entity?: { entityType?: string; entityId?: string }
): Promise<void> {
  const recipients = Array.from(new Set(userIds)).filter(Boolean);
  if (recipients.length === 0) return;

  const rows = recipients.map((user_id) => ({
    workspace_id: workspaceId,
    user_id,
    type,
    title,
    body,
    entity_type: entity?.entityType ?? "workspace_report",
    entity_id: entity?.entityId ?? null,
  }));

  try {
    const admin = createAdminClient();
    await admin.from("workspace_notifications").insert(rows);
  } catch (err) {
    // Never let a notification failure break the underlying action
    // (report submission, archive, etc.)
    console.error("Notification insert failed:", err);
  }
}