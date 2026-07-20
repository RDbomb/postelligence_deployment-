import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, workspace and preferences."
};


export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

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