export const THREADS_PLATFORM = "threads";

export const THREADS_SCOPES = [
  "threads_basic",
  "threads_content_publish",
  "threads_manage_replies",
  "threads_read_replies"
];

export type ThreadsTokenResponse = {
  access_token: string;
  user_id?: string | number;
};

export type ThreadsLongLivedTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export type ThreadsUser = {
  id: string;
  username?: string;
  name?: string;
  threads_profile_picture_url?: string;
  biography?: string;
};

function getGraphVersion() {
  return process.env.META_GRAPH_VERSION || "v23.0";
}

function getClientConfig() {
  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "Threads credentials missing. Add THREADS_APP_ID and THREADS_APP_SECRET to .env.local."
    );
  }

  return { appId, appSecret };
}

export function getThreadsRedirectUri(origin: string) {
  return `${origin}/auth/threads/callback`;
}

export function buildThreadsOAuthUrl(origin: string, state: string) {
  const { appId } = getClientConfig();
  const url = new URL("https://threads.net/oauth/authorize");

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", getThreadsRedirectUri(origin));
  url.searchParams.set("scope", THREADS_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeThreadsCode(origin: string, code: string) {
  const { appId, appSecret } = getClientConfig();

  const body = new URLSearchParams();
  body.set("client_id", appId);
  body.set("client_secret", appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", getThreadsRedirectUri(origin));
  body.set("code", code);

  const response = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Threads token exchange failed: ${text}`);
  }

  return (await response.json()) as ThreadsTokenResponse;
}

export async function exchangeForLongLivedThreadsToken(accessToken: string) {
  const { appSecret } = getClientConfig();
  const url = new URL("https://graph.threads.net/access_token");

  url.searchParams.set("grant_type", "th_exchange_token");
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  if (!response.ok) return { access_token: accessToken } as ThreadsLongLivedTokenResponse;

  return (await response.json()) as ThreadsLongLivedTokenResponse;
}

export async function fetchThreadsUser(accessToken: string) {
  // ✅ Threads API does not use versioned paths — just /me
  const url = new URL(`https://graph.threads.net/me`);
  url.searchParams.set("fields", "id,username,name,threads_profile_picture_url");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Threads user fetch failed: ${text}`);
  }

  return (await response.json()) as ThreadsUser;
}

export function getThreadsTokenExpiry(expiresIn?: number) {
  if (!expiresIn) return null;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}