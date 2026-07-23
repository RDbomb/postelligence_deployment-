import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canPublish } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/types";
import { schedulePostWithInngest } from "@/lib/inngest/client";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ?workspace_id= lets the Team Workspace Calendar/Drafts views list posts
  // scheduled for the whole workspace. Omitted, this is the unchanged
  // solo-user query (only the caller's own personal posts).
  const workspaceId = req.nextUrl.searchParams.get("workspace_id");

  let query = supabase
    .from("scheduled_posts")
    .select("*")
    .order("scheduled_time", { ascending: true });

  query = workspaceId ? query.eq("workspace_id", workspaceId) : query.eq("user_id", user.id).is("workspace_id", null);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, description, media_urls, platforms, scheduled_time,
    linkedin_media_urn, youtube_video_id,
    // Only sent by Team Workspace flows (see workspace/drafts/[id]/publish).
    // Solo users never send these and get identical behavior to before.
    workspace_id, workspace_draft_id,
  } = body;

  if (!scheduled_time) {
    return NextResponse.json({ error: "scheduled_time is required" }, { status: 400 });
  }

  const selectedPlatforms = Array.isArray(platforms) ? platforms : [];
  const requiresMedia = selectedPlatforms.some((p: string) =>
    ["instagram", "youtube", "pinterest"].includes(p.toLowerCase())
  );
  const mediaList = Array.isArray(media_urls) ? media_urls.filter(Boolean) : [];

  if (requiresMedia && mediaList.length === 0) {
    return NextResponse.json(
      { error: "Instagram, YouTube, and Pinterest require an image or video file. Please attach media before scheduling." },
      { status: 400 }
    );
  }

  if (workspace_id) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", workspace_id)
      .single();

    if (!membership) return NextResponse.json({ error: "Not a member of this workspace." }, { status: 403 });
    if (!canPublish(membership.role as WorkspaceRole)) {
      return NextResponse.json({ error: "Only managers and owners can schedule for this workspace." }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert({
      user_id: user.id,
      workspace_id: workspace_id || null,
      workspace_draft_id: workspace_draft_id || null,
      title: title || "",
      description: description || "",
      media_urls: media_urls || [],
      platforms: platforms || [],
      scheduled_time,
      status: "pending",
      linkedin_media_urn: linkedin_media_urn || null,
      youtube_video_id: youtube_video_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Dispatch event to Inngest to sleep until scheduled_time and auto-publish
  if (data?.scheduled_time) {
    await schedulePostWithInngest({ postId: data.id, scheduledTime: data.scheduled_time });
  }

  return NextResponse.json({ post: data });
}
