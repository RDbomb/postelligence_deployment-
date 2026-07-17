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
        is_enabled: true,
        post_time: "09:00:00",
        mode: "manual",
        platforms: [],
        categories: [],
        keywords: [],
        approval_email: user.email || "",
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
    const { 
      is_enabled, 
      post_time, 
      mode, 
      platforms, 
      categories, 
      keywords, 
      approval_email, 
      timezone,
      schedule_type,
      post_times,
      post_days,
      post_day_of_month,
      frontend_url,
      use_same_settings,
      time_configs
    } = await req.json();

    const { data, error } = await supabase
      .from("automation_settings")
      .upsert({
        user_id: user.id,
        is_enabled: is_enabled !== undefined ? !!is_enabled : true,
        post_time: (post_times && post_times[0]) || post_time || "09:00:00",
        mode: mode || "manual",
        platforms: platforms || [],
        categories: categories || [],
        keywords: keywords || [],
        approval_email: approval_email || user.email || "",
        timezone: timezone || "UTC",
        schedule_type: schedule_type || "daily",
        post_times: post_times || ["09:00:00"],
        post_days: post_days || ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
        post_day_of_month: post_day_of_month !== undefined ? Number(post_day_of_month) : 1,
        frontend_url: frontend_url || "http://localhost:3000",
        use_same_settings: use_same_settings !== undefined ? !!use_same_settings : true,
        time_configs: time_configs || {},
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
