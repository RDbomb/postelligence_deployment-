import type { WorkspaceRole } from "@/types";

// ── Can the role publish or schedule posts? ──────────────────
export function canPublish(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Can the role connect/disconnect the workspace's social accounts?
// Social accounts belong to the workspace, never to an individual
// member — only Owner and Manager may change which accounts the
// workspace publishes through.
export function canManageSocialAccounts(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Can the role reschedule or cancel an already-scheduled post? ─
export function canManageSchedule(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Can the role approve or reject workspace drafts? ─────────
export function canApprove(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Can the role submit a draft for approval? ────────────────
export function canSubmit(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager" || role === "creator";
}

// ── Can the role create workspace drafts? ────────────────────
// Managers approve/schedule/publish but do not author content — only
// the Owner (full admin access) and Creator (whose job is authoring)
// can start a new draft.
export function canCreateDraft(role: WorkspaceRole): boolean {
  return role === "owner" || role === "creator";
}

// ── Can the role edit a workspace draft? ─────────────────────
// Creators can only edit their own (enforced at API level)
export function canEditDraft(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager" || role === "creator";
}

// ── Can the role delete a workspace draft? ───────────────────
// Creators can only delete their own (enforced at API level)
export function canDeleteDraft(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager" || role === "creator";
}

// ── Can the role comment on workspace drafts? ────────────────
export function canComment(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager" || role === "creator";
}

// ── Can the role view analytics? ─────────────────────────────
export function canViewAnalytics(role: WorkspaceRole): boolean {
  return true; // all roles can view analytics
}

// ── Can the role view team analytics? ────────────────────────
export function canViewTeamAnalytics(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager" || role === "analyst";
}

// ── Can the role manage members (invite, remove, change role)?
export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "owner";
}

// ── Can the role change another member's role? ───────────────
export function canChangeRoles(role: WorkspaceRole): boolean {
  return role === "owner";
}

// ── Can the role transfer ownership? ─────────────────────────
export function canTransferOwnership(role: WorkspaceRole): boolean {
  return role === "owner";
}

// ── Can the role delete the workspace? ───────────────────────
export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

// ── Can the role view pending approvals? ─────────────────────
export function canViewPendingApprovals(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Can the role export the Team Analytics report (CSV/PDF)? ─
// Exporting the executive report is the Analyst's job (and the
// Owner's, since Owner has every access). Manager can generate and
// review the report on-screen but not download it; Creator doesn't
// see Team Analytics at all.
export function canExportReports(role: WorkspaceRole): boolean {
  return role === "owner" || role === "analyst";
}

// ── Can the role write Analyst Observations / Recommendations on
// the Team Analytics report? Same set as export — it's the
// Analyst's report to review and sign off on.
export function canManageReportInsights(role: WorkspaceRole): boolean {
  return role === "owner" || role === "analyst";
}

// ── Can the role submit the Team Analytics report as an official
// workspace report (turning "Save Review" into "Submit Report")?
// Same set as canManageReportInsights — submission is the natural
// conclusion of the Analyst's (or Owner's) review.
export function canSubmitReport(role: WorkspaceRole): boolean {
  return role === "owner" || role === "analyst";
}

// ── Can the role see the Reports section at all? Owner/Manager see
// every submitted report; Analyst sees their own submission history.
// Creator has no reason to see business reports.
export function canViewReportsSection(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager" || role === "analyst";
}

// ── Can the role view/download/archive *any* submitted report
// (not just their own)? This is the Owner/Manager oversight view.
export function canManageSubmittedReports(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Can the role request changes on an already-submitted report,
// unlocking it for the Analyst to edit and resubmit? Owner and
// Manager both have oversight of submitted reports (see
// canManageSubmittedReports), so both may send one back to the
// Analyst for edits — this is the one exception to "Analyst can't
// modify a report after submission."
export function canRequestReportChanges(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager";
}

// ── Utility: get human-readable label for a role ─────────────
export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    owner: "Owner",
    manager: "Manager",
    creator: "Creator",
    analyst: "Analyst",
  };
  return labels[role];
}

// ── Utility: get role badge color classes ────────────────────
export function getRoleBadgeClass(role: WorkspaceRole): string {
  const classes: Record<WorkspaceRole, string> = {
    owner:   "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    creator: "bg-green-100 text-green-700",
    analyst: "bg-orange-100 text-orange-700",
  };
  return classes[role];
}

// ── Utility: roles that can be assigned when inviting ────────
export const ASSIGNABLE_ROLES: WorkspaceRole[] = [
  "manager",
  "creator",
  "analyst",
];