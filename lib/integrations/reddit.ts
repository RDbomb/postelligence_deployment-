export const REDDIT_PLATFORM = "reddit";

export const REDDIT_SCOPES = [
  "identity",
  "submit",
  "read"
];

export type RedditTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type RedditUser = {
  id: string;
  name: string;
  icon_img?: string;
};

function getClientConfig() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Reddit credentials missing. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env.local."
    );
  }

  return { clientId, clientSecret };
}

export function getRedditRedirectUri(origin: string) {
  return `${origin}/auth/reddit/callback`;
}

export function buildRedditOAuthUrl(origin: string, state: string) {
  const { clientId } = getClientConfig();
  const url = new URL("https://www.reddit.com/api/v1/authorize");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", getRedditRedirectUri(origin));
  url.searchParams.set("duration", "permanent");
  url.searchParams.set("scope", REDDIT_SCOPES.join(" "));

  return url;
}

export async function exchangeRedditCode(origin: string, code: string) {
  const { clientId, clientSecret } = getClientConfig();
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", getRedditRedirectUri(origin));

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
      "User-Agent": "Postelligence/1.0"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Reddit token exchange failed: ${text}`);
  }

  return (await response.json()) as RedditTokenResponse;
}

export async function fetchRedditUser(accessToken: string) {
  const response = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Postelligence/1.0"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Reddit user fetch failed: ${text}`);
  }

  const json = await response.json();
  return json as RedditUser;
}

export function getRedditTokenExpiry(expiresIn?: number) {
  if (!expiresIn) return null;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
