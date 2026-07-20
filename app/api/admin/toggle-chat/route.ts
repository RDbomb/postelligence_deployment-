import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { email, password, enabled } = await req.json();
    if (email !== "postsync@2007" || password !== "rishi@1307") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isChatEnabled = !!enabled;

    // 1. Always write to local config file (guaranteed success for local dev/prod server runtime)
    try {
      const configPath = path.join(process.cwd(), "support_settings.json");
      fs.writeFileSync(configPath, JSON.stringify({ chatSupportEnabled: isChatEnabled }), "utf8");
    } catch (err) {
      console.error("Failed to write to local support_settings.json file:", err);
    }

    // 2. Write to Supabase Database (if table exists)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      await supabase
        .from("system_settings")
        .upsert({
          key: "chat_support_enabled",
          value: isChatEnabled
        });
    } catch (dbErr) {
      console.warn("Could not save toggle state to database table (migration might not be run):", dbErr);
    }

    return NextResponse.json({ success: true, chatSupportEnabled: isChatEnabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to toggle system setting" }, { status: 500 });
  }
}
