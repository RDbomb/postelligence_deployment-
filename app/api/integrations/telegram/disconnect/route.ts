import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TELEGRAM_PLATFORM } from "@/lib/integrations/telegram";
import { canManageSocialAccounts } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/types";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const workspaceId = requestUrl.searchParams.get("workspaceId");

  if (workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!membership || !canManageSocialAccounts(membership.role as WorkspaceRole)) {
      return NextResponse.json({ error: "Only the workspace Owner or a Manager can disconnect social accounts." }, { status: 403 });
    }

    await supabase.from("social_accounts")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("platform", TELEGRAM_PLATFORM);
  } else {
    await supabase.from("social_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", TELEGRAM_PLATFORM)
      .is("workspace_id", null);
  }

  return NextResponse.json({ ok: true });
}
