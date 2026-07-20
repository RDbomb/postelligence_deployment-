import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DraftsClient from "./DraftsClient";
import type { WorkspaceDraft, WorkspaceRole } from "@/types";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const supabase = await createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Personal drafts (unchanged)
  const { data: drafts } = await supabase
    .from("drafts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Connected platforms — feeds the Edit/Schedule platform pickers so
  // they show what's actually connected instead of a fixed guess.
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("platform")
    .eq("user_id", user.id)
    .eq("status", "connected")
    .is("workspace_id", null);
  const connectedPlatforms = Array.from(new Set((accounts || []).map((a) => a.platform)));

  // Check workspace membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("*, workspace:workspaces(*)")
    .eq("user_id", user.id)
    .single();

  let workspaceDrafts: WorkspaceDraft[] = [];
  let currentRole: WorkspaceRole | null = null;

  if (membership) {
    currentRole = membership.role as WorkspaceRole;

    // Fetch workspace drafts
    let query = supabase
      .from("workspace_drafts")
      .select("*")
      .eq("workspace_id", membership.workspace_id)
      .order("updated_at", { ascending: false });

    // Creators only see their own
    if (currentRole === "creator") {
      query = query.eq("created_by", user.id);
    }

    const { data: rawDrafts } = await query;

    // Enrich with creator info
    workspaceDrafts = await Promise.all(
      (rawDrafts || []).map(async (d) => {
        const { data: creatorData } = await admin.auth.admin.getUserById(d.created_by);
        return {
          ...d,
          creator_name:   creatorData?.user?.user_metadata?.full_name || creatorData?.user?.email || "Unknown",
          creator_avatar: creatorData?.user?.user_metadata?.avatar_url || "",
        };
      })
    );
  }

  return (
    <DraftsClient
      drafts={drafts || []}
      workspaceDrafts={workspaceDrafts}
      currentRole={currentRole}
      isInWorkspace={!!membership}
      connectedPlatforms={connectedPlatforms}
    />
  );
}
