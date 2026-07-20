import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/lib/integrations/social-accounts";
import { getLocalSocialAccounts } from "@/lib/integrations/local-social-accounts";
import DashboardShellClient from "@/app/(shell)/dashboard/DashboardShellClient";

export const dynamic = "force-dynamic";

export default async function DashboardSubLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: socialAccounts, error } = await supabase
    .from("social_accounts")
    .select("id, platform, account_id, account_name, account_avatar_url, status, scopes, metadata, connected_at, updated_at")
    .eq("user_id", user.id)
    .is("workspace_id", null);

  const localAccounts = error ? await getLocalSocialAccounts(user.id) : [];

  // Fetch the user's workspace (if they belong to one) for the sidebar
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(name)")
    .eq("user_id", user.id)
    .single();

  const workspaceName = (membership?.workspace as { name?: string } | null)?.name ?? null;

  return (
    <DashboardShellClient
      user={user}
      socialAccounts={error ? localAccounts : ((socialAccounts || []) as SocialAccount[])}
      workspaceName={workspaceName}
    >
      {children}
    </DashboardShellClient>
  );
}