import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WorkspaceDraftDetailClient from "./WorkspaceDraftDetailClient";
import type { WorkspaceRole } from "@/types";

export default async function WorkspaceDraftDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/workspace");

  // Get draft
  const { data: draft } = await supabase
    .from("workspace_drafts")
    .select("*")
    .eq("id", params.id)
    .eq("workspace_id", membership.workspace_id)
    .single();

  if (!draft) notFound();

  // Enrich draft with creator + reviewer info
  const { data: creatorData } = await admin.auth.admin.getUserById(draft.created_by);
  const reviewerData = draft.reviewed_by ? (await admin.auth.admin.getUserById(draft.reviewed_by)).data : null;
  const enrichedDraft = {
    ...draft,
    creator_name:   creatorData?.user?.user_metadata?.full_name || creatorData?.user?.email || "Unknown",
    creator_avatar: creatorData?.user?.user_metadata?.avatar_url || "",
    reviewer_name:  reviewerData?.user?.user_metadata?.full_name || reviewerData?.user?.email || undefined,
  };

  // Get comments
  const { data: rawComments } = await supabase
    .from("workspace_draft_comments")
    .select("*")
    .eq("draft_id", params.id)
    .order("created_at", { ascending: true });

  // Enrich comments with user info
  const comments = await Promise.all(
    (rawComments || []).map(async (c) => {
      const { data: userData } = await admin.auth.admin.getUserById(c.user_id);
      return {
        ...c,
        user_name:   userData?.user?.user_metadata?.full_name || userData?.user?.email || "Unknown",
        user_avatar: userData?.user?.user_metadata?.avatar_url || "",
      };
    })
  );

  return (
    <WorkspaceDraftDetailClient
      draft={enrichedDraft}
      comments={comments}
      currentRole={membership.role as WorkspaceRole}
      currentUserId={user.id}
    />
  );
}