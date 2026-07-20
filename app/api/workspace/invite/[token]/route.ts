import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── GET /api/workspace/invite/[token] ───────────────────────
// Validate an invite token and return workspace info
// Used to show the "You've been invited to X workspace" page
export async function GET(_req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .select("*, workspace:workspaces(id, name)")
    .eq("token", params.token)
    .eq("accepted", false)
    .eq("rejected", false)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error || !invite) {
    return NextResponse.json(
      { error: "Invite not found or has expired." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    invite: {
      id:           invite.id,
      email:        invite.email,
      role:         invite.role,
      token:        invite.token,
      expires_at:   invite.expires_at,
      workspace:    invite.workspace,
    },
  });
}