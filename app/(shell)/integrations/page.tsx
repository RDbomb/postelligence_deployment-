import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntegrationsClient from "./IntegrationsClient";
import type { SocialAccount } from "@/lib/integrations/social-accounts";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: socialAccounts } = await supabase
    .from("social_accounts")
    .select("id, platform, account_id, account_name, account_avatar_url, status, scopes, metadata, connected_at, updated_at")
    .eq("user_id", user.id)
    .is("workspace_id", null);

  return <IntegrationsClient socialAccounts={(socialAccounts || []) as SocialAccount[]} />;
}