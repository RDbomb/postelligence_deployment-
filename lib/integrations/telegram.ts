// lib/integrations/telegram.ts
// Telegram publishing via Bot API (user provides Bot Token + Chat ID — no OAuth needed)

export const TELEGRAM_PLATFORM = "telegram";

const TELEGRAM_API = "https://api.telegram.org";

/**
 * Verifies bot token and returns bot info.
 */
export async function fetchTelegramBotInfo(botToken: string) {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/getMe`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Invalid Telegram bot token.");
  return {
    id:       data.result.id       as number,
    username: data.result.username as string,
    name:     data.result.first_name as string,
  };
}

/**
 * Fetches info about a Telegram chat/channel/group by chat ID.
 * Chat ID for channels is typically a negative number or @username.
 */
export async function fetchTelegramChatInfo(botToken: string, chatId: string) {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/getChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Could not find that chat. Make sure the bot is added to the channel/group.");
  return {
    id:    data.result.id    as number,
    title: data.result.title as string | undefined,
    type:  data.result.type  as string,
    username: data.result.username as string | undefined,
  };
}

/**
 * Publishes a text message with optional hosted media to a Telegram chat.
 * Telegram receives images through sendPhoto and common video URLs through
 * sendVideo; without media it receives a plain text message.
 */
export async function publishToTelegram(
  botToken: string,
  chatId: string,
  text: string,
  mediaUrl?: string | null
): Promise<string> {
  let res: Response;
  const isVideo = Boolean(mediaUrl && /\.(mp4|mov|webm|avi)(\?|$)/i.test(mediaUrl));

  if (mediaUrl && isVideo) {
    res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendVideo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, video: mediaUrl, caption: text || undefined }),
    });
  } else if (mediaUrl) {
    res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        photo:      mediaUrl,
        caption:    text || undefined,
      }),
    });
  } else {
    res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       text || "(no text)",
      }),
    });
  }

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram publish failed (${res.status})`);
  }
  return String(data.result.message_id);
}
