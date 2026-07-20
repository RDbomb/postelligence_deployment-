import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/notifications
// Returns the current user's most recent in-app notifications
// (report submitted / changes requested / archived, etc.) across
// whichever workspace(s) they belong to. Powers the notification
// bell alongside the existing pending-invites stream.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: notifications, error } = await supabase
    .from("workspace_notifications")
    .select("id, workspace_id, type, title, body, entity_type, entity_id, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notifications: notifications || [] });
}
