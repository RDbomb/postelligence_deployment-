import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disconnectLocalMetaAccounts } from "@/lib/integrations/local-social-accounts";

export const dynamic = "force-dynamic";

function getMetaPlatform(request: Request) {
  const platform = new URL(request.url).searchParams.get("platform");
  return platform === "facebook" || platform === "instagram" ? platform : null;
}

export async function DELETE(request: Request) {
  const platform = getMetaPlatform(request);

  if (!platform) {
    return NextResponse.json({ error: "A valid Meta platform is required." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    .eq("platform", platform);

  if (error) {
    await disconnectLocalMetaAccounts(user.id, platform);
  }

  return NextResponse.json({ ok: true });
}
