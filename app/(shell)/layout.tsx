import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import type { SocialAccount } from "@/lib/integrations/social-accounts";
import { getLocalSocialAccounts } from "@/lib/integrations/local-social-accounts";
import DashboardShellClient from "@/app/(shell)/dashboard/DashboardShellClient";

export const dynamic = "force-dynamic";

/**
 * Everything under this layout is behind authentication, so it should never be
 * indexed. Child pages still set their own `title`; this only adds the robots
 * directive, which they inherit.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function DashboardSubLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();

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