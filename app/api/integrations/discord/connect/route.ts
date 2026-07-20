import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDiscordOAuthUrl, fetchDiscordWebhookInfo, DISCORD_PLATFORM } from "@/lib/integrations/discord";
import { upsertSocialAccount } from "@/lib/integrations/upsert-social-account";
import { canManageSocialAccounts } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/", requestUrl.origin));
  const workspaceId = requestUrl.searchParams.get("workspaceId");

  if (workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();
    if (!membership || !canManageSocialAccounts(membership.role as WorkspaceRole)) {
      return NextResponse.redirect(new URL("/team?tab=accounts&discord=error&message=You+cannot+manage+workspace+social+accounts.", requestUrl.origin));
    }
  }

  const state = crypto.randomUUID();
  try {
    const response = NextResponse.redirect(buildDiscordOAuthUrl(requestUrl.origin, state));
    response.cookies.set("postelligence_discord_oauth_state", JSON.stringify({ state, userId: user.id, workspaceId }), {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
    });
    return response;
  } catch (error) {
    const url = new URL(workspaceId ? "/team?tab=accounts" : "/integrations", requestUrl.origin);
    url.searchParams.set("discord", "error");
    url.searchParams.set("message", error instanceof Error ? error.message : "Discord setup is incomplete.");
    return NextResponse.redirect(url);
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { webhookUrl, workspaceId, serverName, channelName, serverLogoUrl } = await request.json();

  if (!webhookUrl) {
    return NextResponse.json({ error: "Discord Webhook URL is required." }, { status: 400 });
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
    const info = await fetchDiscordWebhookInfo(webhookUrl);
    const savedServerName = typeof serverName === "string" && serverName.trim()
      ? serverName.trim()
      : info.guildName;
    const savedChannelName = typeof channelName === "string" && channelName.trim()
      ? channelName.trim().replace(/^#/, "")
      : info.channelName;
    const suppliedServerLogoUrl = typeof serverLogoUrl === "string" && /^https?:\/\//i.test(serverLogoUrl.trim())
      ? serverLogoUrl.trim()
      : null;
    const accountAvatarUrl = suppliedServerLogoUrl || info.guildAvatarUrl || info.botAvatarUrl;
    
    const accountName = savedServerName
      ? `${savedServerName} · ${info.botName || "Discord bot"}`
      : info.botName || "Discord bot";

    await upsertSocialAccount(supabase, {
      user_id: user.id,
      workspace_id: workspaceId || null,
      connected_by: user.id,
      platform: DISCORD_PLATFORM,
      account_id: info.channelId || `webhook-${crypto.randomUUID()}`,
      account_name: accountName,
      // Prefer the server image; fall back to the webhook/bot image.
      account_avatar_url: accountAvatarUrl,
      access_token: webhookUrl, // store webhook URL in access_token
      refresh_token: null,
      token_expires_at: null,
      scopes: [],
      status: "connected",
      metadata: { 
        webhookUrl,
        channelId: info.channelId,
        guildId: info.guildId,
        guildName: savedServerName,
        channelName: savedChannelName,
        botName: info.botName,
        botAvatarUrl: info.botAvatarUrl,
        guildAvatarUrl: suppliedServerLogoUrl || info.guildAvatarUrl
      },
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, name: accountName });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discord webhook connection failed." },
      { status: 400 }
    );
  }
}
