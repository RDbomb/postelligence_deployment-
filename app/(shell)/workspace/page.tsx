import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkspaceSetupClient from "./WorkspaceSetupClient";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If already in a workspace, redirect to team page
  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (member) redirect("/team");

  return <WorkspaceSetupClient />;
}