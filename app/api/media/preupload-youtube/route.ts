import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshYouTubeAccessToken } from "@/lib/integrations/youtube";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const mediaUrl = formData.get("mediaUrl") as string;
  const title = formData.get("title") as string || "Untitled Video";
  const description = formData.get("description") as string || "";
  const workspaceId = formData.get("workspaceId") as string | null;

  // A Team draft publishes through the workspace's own YouTube account,
  // never whichever member happens to be scheduling it.
  const accountQuery = workspaceId
    ? supabase.from("social_accounts").select("access_token, refresh_token, account_id, token_expires_at")
        .eq("workspace_id", workspaceId).eq("platform", "youtube").eq("status", "connected").single()
    : supabase.from("social_accounts").select("access_token, refresh_token, account_id, token_expires_at")
        .eq("user_id", user.id).is("workspace_id", null).eq("platform", "youtube").eq("status", "connected").single();

  const { data: account } = await accountQuery;

  if (!account?.access_token) {
    return NextResponse.json({ error: workspaceId ? "The workspace has no connected YouTube account." : "YouTube not connected" }, { status: 400 });
  }

  if (!mediaUrl) return NextResponse.json({ error: "No media URL provided" }, { status: 400 });

  let accessToken = account.access_token;

  // Refresh token if expired
  const isExpired = account.token_expires_at && new Date(account.token_expires_at) <= new Date();
  if (isExpired && account.refresh_token) {
    try {
      const tokens = await refreshYouTubeAccessToken(account.refresh_token);
      accessToken = tokens.access_token;
      const updateQuery = supabase.from("social_accounts").update({
        access_token: tokens.access_token,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      }).eq("platform", "youtube");
      if (workspaceId) await updateQuery.eq("workspace_id", workspaceId);
      else await updateQuery.eq("user_id", user.id).is("workspace_id", null);
    } catch {
      return NextResponse.json({ error: "YouTube token refresh failed. Reconnect YouTube." }, { status: 401 });
    }
  }

  try {
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) throw new Error("Could not fetch video from storage");
    const videoBuffer = await mediaRes.arrayBuffer();
    const contentType = mediaRes.headers.get("content-type") || "video/mp4";

    const metadata = {
      snippet: { title, description, categoryId: "22" },
      status: { privacyStatus: "private" }, // private until scheduled time
    };

    const metaPart = JSON.stringify(metadata);
    const boundary = "postelligence_boundary";
    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      metaPart,
      `--${boundary}`,
      `Content-Type: ${contentType}`,
      "",
      "",
    ].join("\r\n");

    const bodyBytes = new TextEncoder().encode(body);
    const closingBytes = new TextEncoder().encode(`\r\n--${boundary}--`);
    const videoBytes = new Uint8Array(videoBuffer);

    const combined = new Uint8Array(bodyBytes.length + videoBytes.length + closingBytes.length);
    combined.set(bodyBytes, 0);
    combined.set(videoBytes, bodyBytes.length);
    combined.set(closingBytes, bodyBytes.length + videoBytes.length);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: combined,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`YouTube upload failed: ${err}`);
    }

    const uploadData = await uploadRes.json();
    const videoId: string = uploadData.id;
    if (!videoId) throw new Error("YouTube did not return a video ID");

    return NextResponse.json({ videoId, type: "youtube" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "YouTube pre-upload failed" },
      { status: 500 }
    );
  }
}