export const BLUESKY_PLATFORM = "bluesky";

export type BlueskySession = {
  did: string;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
  email?: string;
};

export type BlueskyProfile = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
};

type DidDocumentService = {
  id?: string;
  type?: string;
  serviceEndpoint?: string | { uri?: string };
};

type DidDocument = {
  service?: DidDocumentService[];
};

function getServiceEndpointHost(endpoint: DidDocumentService["serviceEndpoint"]) {
  const rawEndpoint = typeof endpoint === "string" ? endpoint : endpoint?.uri;
  if (!rawEndpoint) return null;

  try {
    return new URL(rawEndpoint).host;
  } catch {
    return rawEndpoint.replace(/^https?:\/\//, "").split("/")[0] || null;
  }
}

export async function resolveBlueskyPdsHostFromDid(did: string): Promise<string | null> {
  try {
    let didDocumentUrl = "";

    if (did.startsWith("did:plc:")) {
      didDocumentUrl = `https://plc.directory/${did}`;
    } else if (did.startsWith("did:web:")) {
      const parts = did.slice("did:web:".length).split(":").map(decodeURIComponent);
      const host = parts.shift();
      if (host) {
        didDocumentUrl = parts.length
          ? `https://${host}/${parts.join("/")}/did.json`
          : `https://${host}/.well-known/did.json`;
      }
    }

    if (!didDocumentUrl) return null;

    const response = await fetch(didDocumentUrl, {
      headers: { Accept: "application/did+json, application/json" },
    });
    if (!response.ok) return null;

    const doc = (await response.json()) as DidDocument;
    const pdsService = doc.service?.find((service) =>
      service.id === "#atproto_pds" ||
      service.id?.endsWith("#atproto_pds") ||
      service.type === "AtprotoPersonalDataServer"
    );

    return getServiceEndpointHost(pdsService?.serviceEndpoint);
  } catch {
    return null;
  }
}

async function resolveBlueskyHandle(handle: string): Promise<string | null> {
  try {
    const url = new URL("https://bsky.social/xrpc/com.atproto.identity.resolveHandle");
    url.searchParams.set("handle", handle.replace(/^@/, ""));
    const response = await fetch(url);
    if (!response.ok) return null;
    const payload = await response.json();
    return typeof payload?.did === "string" ? payload.did : null;
  } catch {
    return null;
  }
}

export async function createBlueskySession(identifier: string, appPassword: string) {
  const did = identifier.startsWith("did:") ? identifier : await resolveBlueskyHandle(identifier);
  const pdsHost = did ? await resolveBlueskyPdsHostFromDid(did) : null;
  const serviceUrl = `https://${pdsHost || "bsky.social"}`;

  const response = await fetch(`${serviceUrl}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password: appPassword })
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(
      json?.message || `Bluesky login failed. Check your handle and app password.`
    );
  }

  const session = (await response.json()) as BlueskySession;
  return { ...session, pdsHost: pdsHost || "bsky.social" } as BlueskySession & { pdsHost: string };
}

export async function fetchBlueskyProfile(accessJwt: string, did: string, serviceUrl = "https://bsky.social") {
  const url = new URL(`${serviceUrl}/xrpc/app.bsky.actor.getProfile`);
  url.searchParams.set("actor", did);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessJwt}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bluesky profile fetch failed: ${text}`);
  }

  return (await response.json()) as BlueskyProfile;
}   
