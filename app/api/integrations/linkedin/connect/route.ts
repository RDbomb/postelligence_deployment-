import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLinkedInOAuthUrl } from "@/lib/integrations/linkedin";
import { canManageSocialAccounts } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/", requestUrl.origin));

  // `workspaceId` present means "connect this as the workspace's account"
  // (Team Workspace → Accounts tab), gated to Owner/Manager. Personal
  // connects from the Integrations page never send this param.
  const workspaceId = requestUrl.searchParams.get("workspaceId");
  if (workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!membership || !canManageSocialAccounts(membership.role as WorkspaceRole)) {
      const redirectUrl = new URL("/team", requestUrl.origin);
      redirectUrl.searchParams.set("linkedin", "error");
      redirectUrl.searchParams.set("message", "Only the workspace Owner or a Manager can connect social accounts.");
      return NextResponse.redirect(redirectUrl);
    }
  }

  try {
    const state = crypto.randomUUID();
    const oauthUrl = buildLinkedInOAuthUrl(requestUrl.origin, state);
    const response = NextResponse.redirect(oauthUrl);

    response.cookies.set(
      "postsync_linkedin_oauth_state",
      JSON.stringify({ state, userId: user.id, workspaceId: workspaceId || null }),
      { httpOnly: true, maxAge: 60 * 10, path: "/", sameSite: "lax", secure: requestUrl.protocol === "https:" }
    );

    return response;
  } catch (error) {
    const redirectUrl = new URL("/dashboard", requestUrl.origin);
    redirectUrl.searchParams.set("linkedin", "error");
    redirectUrl.searchParams.set("message", error instanceof Error ? error.message : "LinkedIn setup incomplete.");
    return NextResponse.redirect(redirectUrl);
  }
}