import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTelegramBotInfo, fetchTelegramChatInfo, TELEGRAM_PLATFORM } from "@/lib/integrations/telegram";
import { upsertSocialAccount } from "@/lib/integrations/upsert-social-account";
import { canManageSocialAccounts } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { botToken, chatId, workspaceId } = await request.json();

  if (!botToken || !chatId) {
    return NextResponse.json({ error: "Bot token and Chat/Channel ID are required." }, { status: 400 });
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
    const botInfo = await fetchTelegramBotInfo(botToken);
    const chatInfo = await fetchTelegramChatInfo(botToken, chatId);

    const accountName = chatInfo.title 
      ? `${chatInfo.title} (via @${botInfo.username})` 
      : `@${chatInfo.username || chatId} (via @${botInfo.username})`;

    await upsertSocialAccount(supabase, {
      user_id: user.id,
      workspace_id: workspaceId || null,
      connected_by: user.id,
      platform: TELEGRAM_PLATFORM,
      account_id: String(chatInfo.id) || chatId,
      account_name: accountName,
      account_avatar_url: null,
      access_token: botToken, // Bot token acts as the access token
      refresh_token: null,
      token_expires_at: null,
      scopes: [],
      status: "connected",
      metadata: {
        botToken,
        chatId,
        botUsername: botInfo.username,
        botName: botInfo.name,
        chatTitle: chatInfo.title,
        chatType: chatInfo.type,
        chatUsername: chatInfo.username
      },
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, name: accountName });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Telegram connection failed." },
      { status: 400 }
    );
  }
}
