// lib/integrations/discord.ts
// Discord publishing via Webhook URL (no OAuth needed — user pastes webhook from server settings)

export const DISCORD_PLATFORM = "discord";
export const DISCORD_SCOPES = ["identify", "guilds", "webhook.incoming"];

type DiscordOAuthToken = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  webhook?: {
    id: string;
    token: string;
    guild_id?: string;
    channel_id?: string;
    name?: string;
    avatar?: string | null;
  };
};

type DiscordGuild = { id: string; name: string; icon?: string | null };

function getDiscordOAuthConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to .env.local.");
  }
  return { clientId, clientSecret };
}

export function getDiscordRedirectUri(origin: string) {
  return `${origin}/api/integrations/discord/callback`;
}

export function buildDiscordOAuthUrl(origin: string, state: string) {
  const { clientId } = getDiscordOAuthConfig();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getDiscordRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DISCORD_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url;
}

export async function exchangeDiscordCode(origin: string, code: string) {
  const { clientId, clientSecret } = getDiscordOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getDiscordRedirectUri(origin),
  });
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Discord authorization failed: ${await response.text()}`);
  return await response.json() as DiscordOAuthToken;
}

export async function fetchDiscordGuilds(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Couldn't load your Discord servers.");
  return await response.json() as DiscordGuild[];
}

export function webhookUrlFromOAuth(token: DiscordOAuthToken) {
  const webhook = token.webhook;
  if (!webhook?.id || !webhook.token) throw new Error("Discord did not return a webhook. Please authorize the Discord connection again.");
  return `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;
}

export function discordGuildIconUrl(guild?: DiscordGuild) {
  return guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null;
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
  description?: string;
  image?: { url: string };
  color?: number;
}

/**
 * Validates a Discord webhook URL and fetches channel metadata.
 * The webhook API exposes the webhook/bot identity directly.  Some Discord
 * deployments also include guild details, so use those when they are present.
 */
export async function fetchDiscordWebhookInfo(webhookUrl: string) {
  const res = await fetch(webhookUrl);
  if (!res.ok) throw new Error("Invalid Discord webhook URL. Please check it and try again.");
  const data = await res.json();

  const guildId = data.guild_id as string | undefined;
  const guild = data.guild as { name?: string; icon?: string | null } | undefined;
  const channel = data.channel as { name?: string } | undefined;
  const webhookUser = data.user as { username?: string; global_name?: string; avatar?: string | null; id?: string } | undefined;
  const webhookAvatar = data.avatar as string | null | undefined;
  const webhookId = data.id as string | undefined;

  const botAvatarUrl = webhookAvatar && webhookId
    ? `https://cdn.discordapp.com/avatars/${webhookId}/${webhookAvatar}.png?size=128`
    : webhookUser?.avatar && webhookUser.id
      ? `https://cdn.discordapp.com/avatars/${webhookUser.id}/${webhookUser.avatar}.png?size=128`
      : null;
  const guildIcon = guild?.icon || data.guild_icon as string | null | undefined;
  const guildAvatarUrl = guildId && guildIcon
    ? `https://cdn.discordapp.com/icons/${guildId}/${guildIcon}.png?size=128`
    : null;

  return {
    channelId: data.channel_id as string | undefined,
    channelName: (channel?.name || data.channel_name) as string | undefined,
    guildId,
    guildName: (guild?.name || data.guild_name) as string | undefined,
    // `name` is the webhook (bot) name, not the channel name.
    botName: (webhookUser?.global_name || webhookUser?.username || data.name) as string | undefined,
    botAvatarUrl,
    guildAvatarUrl,
  };
}

/**
 * Publishes a message to a Discord channel via webhook.
 * If an imageUrl is provided, it is added as an embed image.
 */
export async function publishToDiscordWebhook(
  webhookUrl: string,
  text: string,
  imageUrl?: string | null,
  attachment?: File | null,
  attachments: File[] = []
): Promise<string> {
  const payload: DiscordWebhookPayload = {
    content: text || undefined,
  };

  // Send media as native Discord attachments. In particular, a video must not
  // be placed in an image embed (`attachment://video.mp4`), which makes Discord
  // render it as an image preview rather than a playable video.
  const files = Array.from(new Set([attachment, ...attachments].filter((file): file is File => Boolean(file)))).slice(0, 10);
  if (files.length > 0) {
    // Discord webhook messages allow up to ten files. Uploading them directly
    // also preserves a multi-image gallery instead of silently using image #1.

    const form = new FormData();
    form.append("payload_json", JSON.stringify(payload));
    files.forEach((file, index) => {
      form.append(`files[${index}]`, file, file.name || `attachment-${index + 1}`);
    });

    const res = await fetch(`${webhookUrl}?wait=true`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Discord webhook failed (${res.status})`);
    }
    const data = await res.json();
    return data.id as string;
  }

  if (imageUrl) {
    payload.embeds = [{ image: { url: imageUrl } }];
  }

  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Discord webhook failed (${res.status})`);
  }

  const data = await res.json();
  return data.id as string; // Discord message ID
}
