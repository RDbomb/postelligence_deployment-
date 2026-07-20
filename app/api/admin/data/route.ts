import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

interface SupportTicketMessage {
  sender: "user" | "admin";
  text: string;
  time: string;
}

interface AdminSupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: string;
  images: string[] | null;
  messages: SupportTicketMessage[] | null;
  typing_status: { user?: boolean; admin?: boolean } | null;
  created_at: string;
  updated_at?: string | null;
  user_email: string;
  user_name: string;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (email !== "postsync@2007" || password !== "rishi@1307") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 1. Fetch system stats
    const { count: automationsCount } = await supabase
      .from("automation_settings")
      .select("*", { count: "exact", head: true });

    const { count: logsCount } = await supabase
      .from("automation_logs")
      .select("*", { count: "exact", head: true });

    const { count: postsCount } = await supabase
      .from("scheduled_posts")
      .select("*", { count: "exact", head: true });

    // 2. Fetch live support tickets from DB (with fallback if table does not exist yet)
    let liveTickets: AdminSupportTicket[] = [];
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        liveTickets = await Promise.all(
          data.map(async (ticket) => {
            try {
              const { data: userAuth } = await supabase.auth.admin.getUserById(ticket.user_id);
              return {
                ...ticket,
                user_email: userAuth?.user?.email || "unknown@domain.com",
                user_name: userAuth?.user?.user_metadata?.name || userAuth?.user?.user_metadata?.full_name || userAuth?.user?.email?.split("@")[0] || "User"
              };
            } catch {
              return {
                ...ticket,
                user_email: "unknown@domain.com",
                user_name: "User"
              };
            }
          })
        );
      }
    } catch (err) {
      console.warn("support_tickets table may not exist yet:", err);
    }

    // 3. Fetch recent automation logs (latest 50)
    const { data: recentLogs } = await supabase
      .from("automation_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // 4. Fetch recent scheduled posts (latest 50)
    const { data: scheduledPosts } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_at", { ascending: false })
      .limit(50);

    // 5. Fetch live chat support enable state (hybrid storage)
    let chatSupportEnabled = true;

    // Check local config file first
    const configPath = path.join(process.cwd(), "support_settings.json");
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (config && typeof config.chatSupportEnabled === "boolean") {
          chatSupportEnabled = config.chatSupportEnabled;
        }
      } catch (e) {
        console.warn("Could not read local support_settings.json:", e);
      }
    } else {
      // Check database as fallback
      try {
        const { data: settingRecord } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "chat_support_enabled")
          .single();
        if (settingRecord) {
          chatSupportEnabled = !!settingRecord.value;
        }
      } catch (err) {
        console.warn("Could not query system_settings:", err);
      }
    }

    return NextResponse.json({
      stats: {
        automations: automationsCount || 0,
        logs: logsCount || 0,
        posts: postsCount || 0,
      },
      tickets: liveTickets,
      logs: recentLogs || [],
      posts: scheduledPosts || [],
      chatSupportEnabled
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: message || "Failed to retrieve admin data" }, { status: 500 });
  }
}
