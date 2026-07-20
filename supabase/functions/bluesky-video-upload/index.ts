import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const accessToken = formData.get("accessToken") as string;
    const did = formData.get("did") as string;
    const pdsUrl = formData.get("pdsUrl") as string;
    const videoFile = formData.get("video") as File;

    if (!accessToken || !did || !pdsUrl || !videoFile) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 1: Create a fresh session using app password for full-scope token
    // The stored accessToken may not have scope for getServiceAuth
    const handle = formData.get("handle") as string;
    const appPassword = formData.get("appPassword") as string;
    
    let sessionToken = accessToken;
    
    if (handle && appPassword) {
      // Always create session on bsky.social — createSession works there even for custom PDS users
      const sessionPdsUrl = "https://bsky.social";
      const sessionRes = await fetch(`${sessionPdsUrl}/xrpc/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle, password: appPassword }),
      });
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        sessionToken = session.accessJwt;
      }
    }

    // Step 2: Get service auth token for video.bsky.app
    // Use the actual PDS host for getServiceAuth
    const actualPdsUrl = formData.get("pdsUrl") as string || pdsUrl;
    const exp = Math.floor(Date.now() / 1000) + 60 * 30;
    const authUrl = new URL(`${actualPdsUrl}/xrpc/com.atproto.server.getServiceAuth`);
    authUrl.searchParams.set("aud", "did:web:video.bsky.app");
    authUrl.searchParams.set("lxm", "com.atproto.repo.uploadBlob");
    authUrl.searchParams.set("exp", String(exp));

    const authRes = await fetch(authUrl, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      return new Response(JSON.stringify({ error: `Service auth failed (${authRes.status}): ${err}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authData = await authRes.json();
    const serviceToken = authData.token;

    if (!serviceToken) {
      return new Response(JSON.stringify({ error: "No service token returned from getServiceAuth" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Upload video to video.bsky.app from edge function (Seoul → US, better routing)
    const bytes = await videoFile.arrayBuffer();
    const uploadUrl = new URL("https://video.bsky.app/xrpc/app.bsky.video.uploadVideo");
    uploadUrl.searchParams.set("did", did);
    uploadUrl.searchParams.set("name", videoFile.name || "postelligence-video.mp4");

    // Retry up to 3 times
    let uploadRes: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceToken}`,
          "Content-Type": videoFile.type || "video/mp4",
          "Content-Length": String(bytes.byteLength),
        },
        body: bytes,
      });
      if (uploadRes.ok || (uploadRes.status !== 502 && uploadRes.status !== 503 && uploadRes.status !== 504)) break;
      if (attempt < 3) await new Promise(r => setTimeout(r, 3000 * attempt));
    }

    if (!uploadRes?.ok) {
      const err = await uploadRes?.text() ?? "unknown";
      return new Response(JSON.stringify({ error: `Video upload failed (${uploadRes?.status}): ${err}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await uploadRes.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});