import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AutomationClient from "./AutomationClient";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch initial settings
  const { data: settings } = await supabase
    .from("automation_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialSettings = settings || {
    is_enabled: false,
    post_time: "09:00:00",
    mode: "manual",
    platforms: [],
    categories: [],
    keywords: [],
  };

  // Fetch initial logs with referenced scheduled post platforms
  const { data: logs } = await supabase
    .from("automation_logs")
    .select(`
      *,
      scheduled_posts (
        platforms
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AutomationClient
      user={user}
      initialSettings={initialSettings}
      initialLogs={(logs as any) || []}
    />
  );
}
