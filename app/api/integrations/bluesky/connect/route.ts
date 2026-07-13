import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBlueskySession, fetchBlueskyProfile, BLUESKY_PLATFORM } from "@/lib/integrations/bluesky";
import { upsertSocialAccount } from "@/lib/integrations/upsert-social-account";
import { canManageSocialAccounts } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // `workspaceId` is only sent when connecting from the Team Workspace
  // "Accounts" tab — in that case the account belongs to the workspace,
  // not to whichever member ran the connect flow. Personal connects
  // (from Integrations) never send this and behave exactly as before.
  const { handle, appPassword, workspaceId } = await request.json();

  if (!handle || !appPassword) {
    return NextResponse.json({ error: "Handle and app password are required." }, { status: 400 });
  }

  if (workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!membership || !canManageSocialAccounts(membership.role as WorkspaceRole)) {
      return NextResponse.json({ error: "Only the workspace Owner or a Manager can connect social accounts." }, { status: 403 });
    }
  }

  try {
    const session = await createBlueskySession(handle, appPassword);
    const pdsHost = "pdsHost" in session && typeof session.pdsHost === "string" ? session.pdsHost : "bsky.social";
    const pdsUrl = `https://${pdsHost}`;
    const profile = await fetchBlueskyProfile(session.accessJwt, session.did, pdsUrl);

    await upsertSocialAccount(supabase, {
      user_id: user.id,
      workspace_id: workspaceId || null,
      connected_by: user.id,
      platform: BLUESKY_PLATFORM,
      account_id: session.did,
      account_name: profile.displayName || profile.handle,
      account_avatar_url: profile.avatar || null,
      access_token: session.accessJwt,
      refresh_token: session.refreshJwt,
      token_expires_at: null,
      scopes: [],
      status: "connected",
      metadata: { handle: profile.handle, pdsHost, appPassword },
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, handle: profile.handle });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bluesky connection failed." },
      { status: 400 }
    );
  }
}