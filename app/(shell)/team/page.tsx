import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActionLabel } from "@/lib/workspace/activity-logger";
import TeamClient from "./TeamClient";
import type { WorkspaceRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: { bluesky?: string; message?: string };
}) {
  const supabase = createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("*, workspace:workspaces(*)")
    .eq("user_id", user.id)
    .single();

  // Not in a workspace — redirect to setup
  if (!membership) redirect("/workspace");

  const workspace   = membership.workspace as any;
  const currentRole = membership.role as WorkspaceRole;

  // Fetch all members
  const { data: rawMembers } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("joined_at", { ascending: true });

  // Enrich members with user info
  const members = await Promise.all(
    (rawMembers || []).map(async (m) => {
      const { data: userData } = await admin.auth.admin.getUserById(m.user_id);
      return {
        ...m,
        email:      userData?.user?.email      ?? "",
        full_name:  userData?.user?.user_metadata?.full_name  ?? "",
        avatar_url: userData?.user?.user_metadata?.avatar_url ?? "",
      };
    })
  );

  // Fetch pending invites (owner/manager only)
  let invites: any[] = [];
  if (currentRole === "owner" || currentRole === "manager") {
    const { data } = await supabase
      .from("workspace_invites")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("accepted", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    invites = data || [];
  }

  // Fetch activity log (last 50)
  const { data: rawLogs } = await supabase
    .from("workspace_activity_log")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Enrich logs with user info
  const activityLogs = await Promise.all(
    (rawLogs || []).map(async (log) => {
      const { data: userData } = await admin.auth.admin.getUserById(log.user_id);
      const userName  = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Unknown";
      const metadata  = { ...((log.metadata as Record<string, unknown>) || {}), user_name: userName };
      return {
        ...log,
        user_name:   userName,
        user_avatar: userData?.user?.user_metadata?.avatar_url || "",
        label:       getActionLabel(log.action as any, metadata),
      };
    })
  );

  return (
    <TeamClient
      workspace={workspace}
      members={members}
      invites={invites}
      activityLogs={activityLogs}
      currentRole={currentRole}
      currentUserId={user.id}
      currentUser={{ email: user.email, user_metadata: user.user_metadata }}
      blueskyStatus={searchParams?.bluesky || null}
      blueskyMessage={searchParams?.message || null}
    />
  );
}