import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("default_platforms")
    .eq("user_id", user.id)
    .single();

  return (
    <SettingsClient
      initialDefaultPlatforms={settings?.default_platforms ?? ["linkedin", "youtube", "bluesky"]}
      initialUser={user}
    />
  );
}