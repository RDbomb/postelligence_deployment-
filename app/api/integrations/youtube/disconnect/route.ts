import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { YOUTUBE_PLATFORM } from "@/lib/integrations/youtube";
import { disconnectLocalYouTubeAccount } from "@/lib/integrations/local-social-accounts";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to disconnect YouTube." }, { status: 401 });
  }

  const { error } = await supabase
    .from("social_accounts")
    .update({
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      status: "disconnected",
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .eq("platform", YOUTUBE_PLATFORM)
    .eq("status", "connected");

  if (error) {
    await disconnectLocalYouTubeAccount(user.id);
  }

  return NextResponse.json({ ok: true });
}
