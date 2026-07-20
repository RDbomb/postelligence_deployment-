import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshYouTubeAccessToken } from "@/lib/integrations/youtube";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { youtube_video_id } = await req.json();
  if (!youtube_video_id) return NextResponse.json({ error: "No youtube_video_id provided" }, { status: 400 });

  const { data: account } = await supabase
    .from("social_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .eq("platform", "youtube")
    .eq("status", "connected")
    .single();

  if (!account?.access_token) {
    return NextResponse.json({ error: "YouTube not connected" }, { status: 400 });
  }

  // Always refresh — access tokens expire in 1 hour
  let accessToken = account.access_token;
  if (account.refresh_token) {
    try {
      const tokens = await refreshYouTubeAccessToken(account.refresh_token);
      accessToken = tokens.access_token;
      await supabase.from("social_accounts").update({
        access_token: tokens.access_token,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      }).eq("user_id", user.id).eq("platform", "youtube");
    } catch {
      // Fall back to stored token
    }
  }

  const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=status", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "youtube#video",
      id: youtube_video_id,
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    console.error("YouTube publish error:", res.status, err);
    return NextResponse.json({ error: `YouTube publish failed: ${err}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}