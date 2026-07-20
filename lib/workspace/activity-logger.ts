import type { SupabaseClient } from "@supabase/supabase-js";

// ── Action constants ─────────────────────────────────────────
// Use these everywhere instead of raw strings to avoid typos
export const WorkspaceActions = {
  // Draft actions
  DRAFT_CREATED:    "draft_created",
  DRAFT_EDITED:     "draft_edited",
  DRAFT_DELETED:    "draft_deleted",
  DRAFT_SUBMITTED:  "draft_submitted",
  DRAFT_APPROVED:   "draft_approved",
  DRAFT_REJECTED:   "draft_rejected",
  DRAFT_SCHEDULED:  "draft_scheduled",
  DRAFT_PUBLISHED:  "draft_published",
  DRAFT_PUBLISH_FAILED: "draft_publish_failed",

  // Comment actions
  COMMENT_ADDED:    "comment_added",

  // Member actions
  MEMBER_INVITED:   "member_invited",
  MEMBER_JOINED:    "member_joined",
  INVITE_REJECTED:  "invite_rejected",
  MEMBER_REMOVED:   "member_removed",
  ROLE_CHANGED:     "role_changed",
  OWNERSHIP_TRANSFERRED: "ownership_transferred",

  // Workspace actions
  WORKSPACE_CREATED: "workspace_created",
  WORKSPACE_UPDATED: "workspace_updated",
  WORKSPACE_DELETED: "workspace_deleted",

  // Team Analytics report actions
  REPORT_GENERATED:     "report_generated",
  REPORT_EXPORTED_CSV:  "report_exported_csv",
  REPORT_EXPORTED_PDF:  "report_exported_pdf",
  REPORT_REVIEW_SAVED:  "report_review_saved",
  REPORT_SUBMITTED:     "report_submitted",
  REPORT_RESUBMITTED:   "report_resubmitted",
  REPORT_CHANGES_REQUESTED: "report_changes_requested",
  REPORT_ARCHIVED:      "report_archived",
  REPORT_DELETED:       "report_deleted",
} as const;

export type WorkspaceAction = typeof WorkspaceActions[keyof typeof WorkspaceActions];

// ── Human readable descriptions ──────────────────────────────
export function getActionLabel(action: WorkspaceAction, metadata?: Record<string, unknown>): string {
  const name = (metadata?.user_name as string) || "Someone";
  const target = (metadata?.target_name as string) || "";
  const reason = (metadata?.reason as string) || "";

  const labels: Record<WorkspaceAction, string> = {
    draft_created:         `${name} created a draft${target ? `: "${target}"` : ""}`,
    draft_edited:          `${name} edited a draft${target ? `: "${target}"` : ""}`,
    draft_deleted:         `${name} deleted a draft${target ? `: "${target}"` : ""}`,
    draft_submitted:       `${name} submitted a draft for approval${target ? `: "${target}"` : ""}`,
    draft_approved:        `${name} approved a draft${target ? `: "${target}"` : ""}`,
    draft_rejected:        `${name} rejected a draft${target ? `: "${target}"` : ""}${reason ? ` — "${reason}"` : ""}`,
    draft_scheduled:       `${name} scheduled a post${target ? `: "${target}"` : ""}`,
    draft_published:       `${name} published a post${target ? `: "${target}"` : ""}`,
    draft_publish_failed:  `${name}'s post failed to publish${target ? `: "${target}"` : ""}${reason ? ` — ${reason}` : ""}`,
    comment_added:         `${name} commented on a draft${target ? `: "${target}"` : ""}`,
    member_invited:        `${name} invited ${target} to the workspace`,
    member_joined:         `${name} joined the workspace`,
    invite_rejected:       `${name} declined the invite to join as ${target || "a member"}`,
    member_removed:        `${name} removed ${target} from the workspace`,
    role_changed:          `${name} changed ${target}'s role`,
    ownership_transferred: `${name} transferred ownership to ${target}`,
    workspace_created:     `${name} created the workspace`,
    workspace_updated:     `${name} updated workspace settings`,
    workspace_deleted:     `${name} deleted the workspace`,
    report_generated:      `${name} generated a Team Analytics report`,
    report_exported_csv:   `${name} exported the Team Analytics report as CSV`,
    report_exported_pdf:   `${name} exported the Team Analytics report as PDF`,
    report_review_saved:   `${name} updated the report's Analyst review`,
    report_submitted:      `${name} submitted a Team Analytics report${target ? `: "${target}"` : ""}`,
    report_resubmitted:    `${name} resubmitted a Team Analytics report after changes${target ? `: "${target}"` : ""}`,
    report_changes_requested: `${name} requested changes on a submitted report${reason ? ` — "${reason}"` : ""}`,
    report_archived:       `${name} archived a submitted report`,
    report_deleted:        `${name} permanently removed an archived report${target ? `: "${target}"` : ""}`,
  };

  return labels[action] || action;
}

// ── Main logger function ─────────────────────────────────────
export async function logActivity(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  action: WorkspaceAction,
  options?: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabase.from("workspace_activity_log").insert({
      workspace_id: workspaceId,
      user_id:      userId,
      action,
      entity_type:  options?.entityType ?? null,
      entity_id:    options?.entityId   ?? null,
      metadata:     options?.metadata   ?? {},
    });
  } catch (err) {
    // Never let logging failure break the main operation
    console.error("Activity log insert failed:", err);
  }
}