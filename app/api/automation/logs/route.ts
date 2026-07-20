import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("automation_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { logId, action, caption, mediaUrl, scheduledPostId, status } = await req.json();

    if (!logId) {
      return NextResponse.json({ error: "Missing logId" }, { status: 400 });
    }

    let updateData: any = {};

    if (action === "reject") {
      updateData.status = "rejected";
    } else if (action === "approve") {
      updateData.status = status || "approved";
      if (scheduledPostId) {
        updateData.scheduled_post_id = scheduledPostId;
      }
    } else if (action === "edit") {
      if (caption !== undefined) updateData.caption = caption;
      if (mediaUrl !== undefined) updateData.media_url = mediaUrl;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("automation_logs")
      .update(updateData)
      .eq("id", logId)
      .eq("user_id", user.id) // Ensure security
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request payload" }, { status: 400 });
  }
}
