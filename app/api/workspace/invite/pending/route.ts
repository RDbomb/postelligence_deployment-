import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ── GET /api/workspace/invite/pending ───────────────────────
// Returns invites addressed to the current user's email that are
// still pending (not accepted, not rejected, not expired).
// Powers the notification bell in the topbar.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invites, error } = await supabase
    .from("workspace_invites")
    .select("id, token, role, created_at, expires_at, invited_by, workspace:workspaces(id, name)")
    .eq("email", user.email)
    .eq("accepted", false)
    .eq("rejected", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich each invite with the inviting owner/manager's display name AND
  // email, so the person can see exactly who sent the request and which
  // workspace it's for — not just a name that might be ambiguous.
  const admin = createAdminClient();
  const enriched = await Promise.all(
    (invites || []).map(async (invite) => {
      let invited_by_name: string | null = null;
      let invited_by_email: string | null = null;
      if (invite.invited_by) {
        const { data: inviterData } = await admin.auth.admin.getUserById(invite.invited_by);
        invited_by_name =
          inviterData?.user?.user_metadata?.full_name ||
          inviterData?.user?.user_metadata?.name ||
          null;
        invited_by_email = inviterData?.user?.email || null;
      }
      return { ...invite, invited_by_name, invited_by_email };
    })
  );

  return NextResponse.json({ invites: enriched });
}