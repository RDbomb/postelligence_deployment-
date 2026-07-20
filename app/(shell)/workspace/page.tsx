import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import { redirect } from "next/navigation";
import WorkspaceSetupClient from "./WorkspaceSetupClient";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Manage your shared workspace."
};


export default async function WorkspacePage() {
  const { supabase, user } = await requireUser();

  // If already in a workspace, redirect to team page
  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (member) redirect("/team");

  return <WorkspaceSetupClient />;
}