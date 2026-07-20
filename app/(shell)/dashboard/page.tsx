import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import type { SocialAccount } from "@/lib/integrations/social-accounts";
import { getLocalSocialAccounts } from "@/lib/integrations/local-social-accounts";
import DashboardOverviewClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your publishing overview across every connected platform."
};


export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    youtube?: string; meta?: string; instagram?: string; twitter?: string;
    threads?: string; bluesky?: string; pinterest?: string; linkedin?: string;
    reddit?: string; message?: string;
  }>;
};

export default async function DashboardPage(props: Props) {
  const searchParams = await props.searchParams;
  const { supabase, user } = await requireUser();

  const { data: socialAccounts, error } = await supabase
    .from("social_accounts")
    .select("id, platform, account_id, account_name, account_avatar_url, status, scopes, metadata, connected_at, updated_at")
    .eq("user_id", user.id)
    .is("workspace_id", null);

  const localAccounts = error ? await getLocalSocialAccounts(user.id) : [];

  return (
    <DashboardOverviewClient
      user={user}
      socialAccounts={error ? localAccounts : ((socialAccounts || []) as SocialAccount[])}
      youtubeStatus={searchParams?.youtube || null}
      metaStatus={searchParams?.meta || null}
      instagramStatus={searchParams?.instagram || null}
      twitterStatus={searchParams?.twitter || null}
      threadsStatus={searchParams?.threads || null}
      blueskyStatus={searchParams?.bluesky || null}
      pinterestStatus={searchParams?.pinterest || null}
      linkedinStatus={searchParams?.linkedin || null}
      youtubeMessage={searchParams?.message || null}
      metaMessage={searchParams?.message || null}
      instagramMessage={searchParams?.message || null}
      twitterMessage={searchParams?.message || null}
      threadsMessage={searchParams?.message || null}
      blueskyMessage={searchParams?.message || null}
      pinterestMessage={searchParams?.message || null}
      linkedinMessage={searchParams?.message || null}
      redditStatus={searchParams?.reddit || null}
      redditMessage={searchParams?.message || null}
    />
  );
}