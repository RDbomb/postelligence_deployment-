export const FACEBOOK_PLATFORM = "facebook";
export const INSTAGRAM_PLATFORM = "instagram";

export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_read_user_content",
  "pages_manage_posts",
];

export type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  instagram_business_account?: MetaInstagramAccount;
};

export type MetaInstagramAccount = {
  id: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
};

type MetaPagesResponse = {
  data?: MetaPage[];
  paging?: {
    next?: string;
  };
};

type MetaPermission = {
  permission: string;
  status: string;
};

type MetaPermissionsResponse = {
  data?: MetaPermission[];
};

type MetaPageInstagramResponse = {
  instagram_business_account?: MetaInstagramAccount;
};

function getGraphVersion() {
  return process.env.META_GRAPH_VERSION || "v23.0";
}

function getClientConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Meta OAuth credentials are missing.");
  }

  return { appId, appSecret };
}

export function getMetaRedirectUri(origin: string) {
  return `${origin}/auth/meta/callback`;
}

export function buildMetaOAuthUrl(origin: string, state: string) {
  const { appId } = getClientConfig();
  const url = new URL(`https://www.facebook.com/${getGraphVersion()}/dialog/oauth`);

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", getMetaRedirectUri(origin));
  url.searchParams.set("state", state);
  url.searchParams.set("scope", META_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "rerequest");

  return url;
}

export async function exchangeMetaCode(origin: string, code: string) {
  const { appId, appSecret } = getClientConfig();
  const url = new URL(`https://graph.facebook.com/${getGraphVersion()}/oauth/access_token`);

  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", getMetaRedirectUri(origin));
  url.searchParams.set("code", code);

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Meta token exchange failed: ${body}`);
  }

  return (await response.json()) as MetaTokenResponse;
}

export async function exchangeForLongLivedMetaToken(accessToken: string) {
  const { appId, appSecret } = getClientConfig();
  const url = new URL(`https://graph.facebook.com/${getGraphVersion()}/oauth/access_token`);

  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", accessToken);

  const response = await fetch(url);

  if (!response.ok) {
    return { access_token: accessToken } satisfies MetaTokenResponse;
  }

  return (await response.json()) as MetaTokenResponse;
}

export async function fetchMetaPages(userAccessToken: string) {
  const url = new URL(`https://graph.facebook.com/${getGraphVersion()}/me/accounts`);

  url.searchParams.set(
    "fields",
    "id,name,access_token,picture{url},instagram_business_account{id,username,name,profile_picture_url}"
  );
  url.searchParams.set("access_token", userAccessToken);
  url.searchParams.set("limit", "100");

  const pages: MetaPage[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const response = await fetch(nextUrl);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Meta Pages lookup failed: ${body}`);
    }

    const payload = (await response.json()) as MetaPagesResponse;
    pages.push(...(payload.data || []));
    nextUrl = payload.paging?.next || null;
  }

  return pages;
}

export async function fetchMetaPermissions(userAccessToken: string) {
  const url = new URL(`https://graph.facebook.com/${getGraphVersion()}/me/permissions`);

  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as MetaPermissionsResponse;
  return payload.data || [];
}

export async function fetchInstagramAccountForPage(pageId: string, pageAccessToken: string) {
  const url = new URL(`https://graph.facebook.com/${getGraphVersion()}/${pageId}`);

  url.searchParams.set(
    "fields",
    "instagram_business_account{id,username,name,profile_picture_url}"
  );
  url.searchParams.set("access_token", pageAccessToken);

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as MetaPageInstagramResponse;
  return payload.instagram_business_account || null;
}

export function getTokenExpiry(expiresIn?: number) {
  if (!expiresIn) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
