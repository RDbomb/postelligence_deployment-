import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export async function GET() {
  let chatSupportEnabled = true;

  // 1. Try local file storage first (most reliable if database migrations are not run)
  const configPath = path.join(process.cwd(), "support_settings.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config && typeof config.chatSupportEnabled === "boolean") {
        chatSupportEnabled = config.chatSupportEnabled;
        return NextResponse.json({ chatSupportEnabled });
      }
    } catch (e) {
      console.warn("Could not read local support_settings.json:", e);
    }
  }

  // 2. Fallback to Supabase Database
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "chat_support_enabled")
      .single();
    if (data) {
      chatSupportEnabled = !!data.value;
    }
  } catch (err) {
    console.warn("Could not fetch chatSupportEnabled from DB:", err);
  }

  return NextResponse.json({ chatSupportEnabled });
}
export const dynamic = "force-dynamic";
