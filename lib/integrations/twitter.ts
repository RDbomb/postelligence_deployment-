import crypto from "crypto";

export const TWITTER_PLATFORM = "twitter";
export const TWITTER_SCOPES = ["tweet.read", "tweet.write", "users.read"];

export type TwitterUser = {
  id: string;
  name: string;
  screen_name: string;
  profile_image_url_https?: string;
};

function getClientConfig() {
  const consumerKey = process.env.TWITTER_CONSUMER_KEY;
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      "Twitter credentials missing. Add TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET to .env.local."
    );
  }

  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

function getRedirectUri(origin: string) {
  return process.env.TWITTER_REDIRECT_URI || `${origin}/auth/twitter/callback`;
}

function percentEncode(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string
) {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;

  const headerValue =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  return headerValue;
}

export async function getRequestToken(origin: string) {
  const { consumerKey, consumerSecret } = getClientConfig();
  const url = "https://api.twitter.com/oauth/request_token";
  const callbackUrl = getRedirectUri(origin);

  const oauthParams: Record<string, string> = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = ["POST", percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(consumerSecret)}&`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;

  const headerValue =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: headerValue },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter request token failed: ${text}`);
  }

  const text = await response.text();
  const params = new URLSearchParams(text);
  const oauthToken = params.get("oauth_token");
  const oauthTokenSecret = params.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error("Twitter did not return oauth_token");
  }

  return { oauthToken, oauthTokenSecret };
}

export function buildTwitterOAuthUrl(oauthToken: string) {
  return `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;
}

export async function exchangeTwitterToken(oauthToken: string, oauthVerifier: string) {
  const { consumerKey, consumerSecret } = getClientConfig();
  const url = "https://api.twitter.com/oauth/access_token";

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_version: "1.0",
  };

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = ["POST", percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(consumerSecret)}&`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;

  const headerValue =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: headerValue },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter access token exchange failed: ${text}`);
  }

  const text = await response.text();
  const params = new URLSearchParams(text);

  return {
    accessToken: params.get("oauth_token")!,
    accessTokenSecret: params.get("oauth_token_secret")!,
    userId: params.get("user_id")!,
    screenName: params.get("screen_name")!,
  };
}

export async function fetchTwitterUser(accessToken: string, accessTokenSecret: string) {
  const { consumerKey, consumerSecret } = getClientConfig();
  const url = "https://api.twitter.com/1.1/account/verify_credentials.json";
  const params = {
    include_entities: "false",
    skip_status: "true",
    include_email: "false",
  };

  const header = buildOAuthHeader("GET", url, params, consumerKey, consumerSecret, accessToken, accessTokenSecret);

  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${url}?${queryString}`, {
    headers: { Authorization: header },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter user fetch failed: ${text}`);
  }

  return (await response.json()) as TwitterUser;
}