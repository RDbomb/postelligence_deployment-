import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { THREADS_PLATFORM } from "@/lib/integrations/threads";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await supabase.from("social_accounts").update({
    access_token: null, refresh_token: null, token_expires_at: null,
    status: "disconnected", updated_at: new Date().toISOString()
  }).eq("user_id", user.id).eq("platform", THREADS_PLATFORM).eq("status", "connected");

  return NextResponse.json({ ok: true });
}