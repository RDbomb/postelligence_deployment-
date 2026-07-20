import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LINKEDIN_PLATFORM } from "@/lib/integrations/linkedin";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await supabase.from("social_accounts").update({
    access_token: null, refresh_token: null, token_expires_at: null,
    status: "disconnected", updated_at: new Date().toISOString()
  }).eq("user_id", user.id).eq("platform", LINKEDIN_PLATFORM).eq("status", "connected");

  return NextResponse.json({ ok: true });
}