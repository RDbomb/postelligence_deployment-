export const LINKEDIN_PLATFORM = "linkedin";

export const LINKEDIN_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social"
];

export type LinkedInTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

export type LinkedInUser = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
};

function getClientConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "LinkedIn credentials missing. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env.local."
    );
  }

  return { clientId, clientSecret };
}

export function getLinkedInRedirectUri(origin: string) {
  return `${origin}/auth/linkedin/callback`;
}

export function buildLinkedInOAuthUrl(origin: string, state: string) {
  const { clientId } = getClientConfig();
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getLinkedInRedirectUri(origin));
  url.searchParams.set("scope", LINKEDIN_SCOPES.join(" "));
url.searchParams.set("state", state);
  url.searchParams.set("prompt", "login");

  return url;
}

export async function exchangeLinkedInCode(origin: string, code: string) {
  const { clientId, clientSecret } = getClientConfig();

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", getLinkedInRedirectUri(origin));
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${text}`);
  }

  return (await response.json()) as LinkedInTokenResponse;
}

export async function fetchLinkedInUser(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LinkedIn user fetch failed: ${text}`);
  }

  return (await response.json()) as LinkedInUser;
}

export function getLinkedInTokenExpiry(expiresIn?: number) {
  if (!expiresIn) return null;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}