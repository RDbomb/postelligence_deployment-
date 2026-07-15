import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("automation_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no settings exist, return default settings structure
  if (!data) {
    return NextResponse.json({
      settings: {
        is_enabled: false,
        post_time: "09:00:00",
        mode: "manual",
        platforms: [],
        categories: [],
        keywords: [],
      }
    });
  }

  return NextResponse.json({ settings: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { is_enabled, post_time, mode, platforms, categories, keywords } = await req.json();

    const { data, error } = await supabase
      .from("automation_settings")
      .upsert({
        user_id: user.id,
        is_enabled: !!is_enabled,
        post_time: post_time || "09:00:00",
        mode: mode || "manual",
        platforms: platforms || [],
        categories: categories || [],
        keywords: keywords || [],
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid payload" }, { status: 400 });
  }
}
