import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntegrationsClient from "./IntegrationsClient";
import type { SocialAccount } from "@/lib/integrations/social-accounts";
import { fetchDiscordWebhookInfo } from "@/lib/integrations/discord";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: socialAccounts } = await supabase
    .from("social_accounts")
    .select("id, platform, account_id, account_name, account_avatar_url, access_token, status, scopes, metadata, connected_at, updated_at")
    .eq("user_id", user.id)
    .is("workspace_id", null);

  // Older Discord connections were saved as "Discord Webhook (#name)" with
  // no avatar. Resolve them when the integrations page opens so they display
  // the actual connected bot/server identity without a reconnect.
  const displayAccounts = await Promise.all((socialAccounts || []).map(async (account) => {
    const { access_token: accessToken, ...safeAccount } = account;

    if (account.platform !== "discord" || account.status !== "connected" || !accessToken) {
      return safeAccount;
    }

    try {
      const info = await fetchDiscordWebhookInfo(accessToken);
      return {
        ...safeAccount,
        account_name: info.guildName
          ? `${info.guildName} · ${info.botName || "Discord bot"}`
          : info.botName || account.account_name,
        account_avatar_url: info.guildAvatarUrl || info.botAvatarUrl || account.account_avatar_url,
      };
    } catch {
      // Keep the saved details if Discord is temporarily unreachable.
      return safeAccount;
    }
  }));

  return <IntegrationsClient socialAccounts={displayAccounts as SocialAccount[]} />;
}
