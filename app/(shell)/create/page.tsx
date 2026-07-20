import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/lib/integrations/social-accounts";
import { getLocalSocialAccounts } from "@/lib/integrations/local-social-accounts";
import CreateClient from "./CreateClient";

export const dynamic = "force-dynamic";

type CreatePageProps = {
  searchParams?: {
    youtube?: string; meta?: string; instagram?: string; twitter?: string;
    threads?: string; bluesky?: string; pinterest?: string; linkedin?: string;
    reddit?: string; mediaUrl?: string; title?: string; caption?: string;
    platforms?: string; message?: string;
    workspaceDraftId?: string;
    draftId?: string;
  };
};

export default async function CreatePostPage({ searchParams }: CreatePageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: socialAccounts, error: socialAccountsError }, { data: settings }] =
    await Promise.all([
      supabase
        .from("social_accounts")
        .select("id, platform, account_id, account_name, account_avatar_url, status, scopes, metadata, connected_at, updated_at")
        .eq("user_id", user.id)
        .is("workspace_id", null),
      supabase
        .from("user_settings")
        .select("default_platforms")
        .eq("user_id", user.id)
        .single(),
    ]);

  const localSocialAccounts = socialAccountsError ? await getLocalSocialAccounts(user.id) : [];

  // Check workspace membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id, role, workspace_id")
    .eq("user_id", user.id)
    .single();

  // ── Coming from a Team draft (Schedule / Publish Now) ────────
  // Load the approved workspace draft so the compose form is
  // pre-filled instead of landing on a blank page.
  let workspaceDraftId: string | null = null;
  let draftTitle = "";
  let draftCaption = "";
  let draftMediaUrl = "";
  let draftMediaUrls: string[] = [];
  let draftPlatforms: string[] | null = null;

  if (searchParams?.workspaceDraftId && membership) {
    const { data: workspaceDraft } = await supabase
      .from("workspace_drafts")
      .select("*")
      .eq("id", searchParams.workspaceDraftId)
      .eq("workspace_id", membership.workspace_id)
      .single();

    if (workspaceDraft) {
      workspaceDraftId = workspaceDraft.id;
      draftTitle = workspaceDraft.title || "";
      draftCaption = workspaceDraft.description || "";
      draftMediaUrl = workspaceDraft.media_urls?.[0] || "";
      draftMediaUrls = workspaceDraft.media_urls || [];
      draftPlatforms = workspaceDraft.platforms?.length ? workspaceDraft.platforms : null;
    }
  }

  // ── Coming from My Drafts > Edit ─────────────────────────────
  // Load the personal draft so Compose opens pre-filled, and saving
  // updates this same draft instead of creating a new one.
  let personalDraftId: string | null = null;

  if (searchParams?.draftId) {
    const { data: personalDraft } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", searchParams.draftId)
      .eq("user_id", user.id)
      .single();

    if (personalDraft) {
      personalDraftId = personalDraft.id;
      draftTitle = personalDraft.title || "";
      draftCaption = personalDraft.description || "";
      draftMediaUrl = personalDraft.media_urls?.[0] || "";
      draftMediaUrls = personalDraft.media_urls || [];
      draftPlatforms = personalDraft.platforms?.length ? personalDraft.platforms : null;
    }
  }

  const defaultPlatforms =
    draftPlatforms ??
    searchParams?.platforms?.split(",").map((p) => p.trim()).filter(Boolean) ??
    settings?.default_platforms ??
    ["linkedin", "youtube", "bluesky"];

  return (
    <CreateClient
      user={user}
      socialAccounts={socialAccountsError ? localSocialAccounts : ((socialAccounts || []) as SocialAccount[])}
      initialMediaUrl={draftMediaUrl || searchParams?.mediaUrl || ""}
      initialMediaUrls={draftMediaUrls}
      initialTitle={draftTitle || searchParams?.title || ""}
      initialCaption={draftCaption || searchParams?.caption || ""}
      initialPlatforms={defaultPlatforms}
      workspaceDraftId={workspaceDraftId}
      personalDraftId={personalDraftId}
      isInWorkspace={!!membership}
      youtubeStatus={searchParams?.youtube || null}
      metaStatus={searchParams?.meta || null}
      instagramStatus={searchParams?.instagram || null}
      twitterStatus={searchParams?.twitter || null}
      threadsStatus={searchParams?.threads || null}
      blueskyStatus={searchParams?.bluesky || null}
      pinterestStatus={searchParams?.pinterest || null}
      youtubeMessage={searchParams?.message || null}
      metaMessage={searchParams?.message || null}
      instagramMessage={searchParams?.message || null}
      twitterMessage={searchParams?.message || null}
      threadsMessage={searchParams?.message || null}
      blueskyMessage={searchParams?.message || null}
      pinterestMessage={searchParams?.message || null}
      linkedinStatus={searchParams?.linkedin || null}
      linkedinMessage={searchParams?.message || null}
      redditStatus={null}
      redditMessage={null}
    />
  );
}