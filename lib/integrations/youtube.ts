export const YOUTUBE_PLATFORM = "youtube";

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.force-ssl"
];

export type YouTubeTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type YouTubeChannel = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  raw: unknown;
};

type YouTubeChannelApiResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
  }>;
};

function getClientConfig() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("YouTube OAuth credentials are missing.");
  }

  return { clientId, clientSecret };
}

export function getYouTubeRedirectUri(origin: string) {
  return process.env.YOUTUBE_REDIRECT_URI || `${origin}/auth/youtube/callback`;
}

export function buildYouTubeOAuthUrl(origin: string, state: string) {
  const { clientId } = getClientConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getYouTubeRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");

  return url;
}

export async function exchangeYouTubeCode(origin: string, code: string) {
  const { clientId, clientSecret } = getClientConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getYouTubeRedirectUri(origin)
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  return (await response.json()) as YouTubeTokenResponse;
}

export async function refreshYouTubeAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getClientConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token refresh failed: ${body}`);
  }

  return (await response.json()) as YouTubeTokenResponse;
}

export async function fetchYouTubeChannel(accessToken: string): Promise<YouTubeChannel> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("mine", "true");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube channel lookup failed: ${body}`);
  }

  const payload = (await response.json()) as YouTubeChannelApiResponse;
  const channel = payload.items?.[0];

  if (!channel?.id) {
    throw new Error("No YouTube channel was returned for this Google account.");
  }

  return {
    id: channel.id,
    name: channel.snippet?.title || "YouTube Channel",
    thumbnailUrl:
      channel.snippet?.thumbnails?.high?.url ||
      channel.snippet?.thumbnails?.medium?.url ||
      channel.snippet?.thumbnails?.default?.url ||
      null,
    raw: channel
  };
}

export function getTokenExpiry(expiresIn?: number) {
  if (!expiresIn) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
