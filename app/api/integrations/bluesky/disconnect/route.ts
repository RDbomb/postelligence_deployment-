import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BLUESKY_PLATFORM } from "@/lib/integrations/bluesky";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await supabase.from("social_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", BLUESKY_PLATFORM);

  return NextResponse.json({ ok: true });
}