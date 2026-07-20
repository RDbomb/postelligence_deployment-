"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import type { SocialAccount } from "@/lib/integrations/social-accounts";
import type { WorkspaceRole } from "@/types";
import { canCreateDraft, canEditDraft } from "@/lib/workspace/permissions";
import CreateClient from "@/app/(shell)/create/CreateClient";

interface TeamUser {
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

export default function TeamComposeClient({
  workspaceId,
  currentRole,
  user,
  blueskyStatus,
  blueskyMessage,
  editDraftId,
}: {
  workspaceId: string;
  currentRole: WorkspaceRole;
  user: TeamUser;
  blueskyStatus?: string | null;
  blueskyMessage?: string | null;
  editDraftId?: string | null;
}) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [draftLoaded, setDraftLoaded] = useState(!editDraftId);
  const [draftTitle, setDraftTitle]       = useState("");
  const [draftCaption, setDraftCaption]   = useState("");
  const [draftMediaUrl, setDraftMediaUrl] = useState("");
  const [draftMediaUrls, setDraftMediaUrls] = useState<string[]>([]);
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>([]);

  // Composing new content is Creator/Owner-only; editing an existing
  // draft additionally follows the normal edit permission (e.g. the
  // Owner can edit any draft, not just ones they authored).
  const allowed = editDraftId ? canEditDraft(currentRole) : canCreateDraft(currentRole);

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/social-accounts`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load connected accounts.");
        const mapped: SocialAccount[] = (data.accounts || []).map((a: any) => ({
          id: a.id,
          platform: a.platform,
          account_id: a.account_id,
          account_name: a.account_name,
          account_avatar_url: a.account_avatar_url,
          status: a.status,
          scopes: null,
          metadata: a.metadata,
          connected_at: a.connected_at,
          updated_at: a.updated_at,
          workspace_id: workspaceId,
          connected_by: a.connected_by,
        }));
        setAccounts(mapped);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load connected accounts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workspaceId, allowed]);

  // Arrived here via "Edit" on an existing workspace draft — load its
  // content so Compose opens pre-filled instead of blank.
  useEffect(() => {
    if (!editDraftId || !allowed) return;
    let cancelled = false;
    setDraftLoaded(false);
    (async () => {
      try {
        const res = await fetch(`/api/workspace/drafts/${editDraftId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load draft.");
        const d = data.draft;
        setDraftTitle(d.title || "");
        setDraftCaption(d.description || "");
        setDraftMediaUrl(d.media_urls?.[0] || "");
        setDraftMediaUrls(d.media_urls || []);
        setDraftPlatforms(d.platforms?.length ? d.platforms : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load draft.");
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [editDraftId, allowed]);

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
        <ShieldCheck className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {editDraftId ? "You don't have permission to edit this draft" : "Composing is handled by Creators"}
        </p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
          As {currentRole === "manager" ? "a Manager" : "an Analyst"}, you review, approve, schedule, and publish
          drafts once a Creator submits them — head to the Schedule or Members tab to see what's in progress.
        </p>
      </div>
    );
  }

  if (loading || !draftLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> {editDraftId ? "Loading draft..." : "Loading connected accounts..."}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>;
  }

  return (
    <CreateClient
      key={editDraftId || "new"}
      user={user}
      socialAccounts={accounts}
      initialTitle={draftTitle}
      initialCaption={draftCaption}
      initialMediaUrl={draftMediaUrl}
      initialMediaUrls={draftMediaUrls}
      initialPlatforms={draftPlatforms}
      workspaceDraftId={editDraftId || null}
      composeTarget="workspace"
      workspaceId={workspaceId}
      youtubeStatus={null}
      metaStatus={null}
      instagramStatus={null}
      twitterStatus={null}
      threadsStatus={null}
      blueskyStatus={blueskyStatus ?? null}
      pinterestStatus={null}
      youtubeMessage={null}
      metaMessage={null}
      instagramMessage={null}
      twitterMessage={null}
      threadsMessage={null}
      blueskyMessage={blueskyMessage ?? null}
      pinterestMessage={null}
      linkedinStatus={null}
      linkedinMessage={null}
      redditStatus={null}
      redditMessage={null}
    />
  );
}