import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import AutomationClient, { type AutomationLog } from "./AutomationClient";

export const metadata: Metadata = {
  title: "Automation",
  description: "Rules that publish and schedule on your behalf."
};


export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const { supabase, user } = await requireUser();

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
      initialLogs={(logs as AutomationLog[] | null) ?? []}
    />
  );
}
