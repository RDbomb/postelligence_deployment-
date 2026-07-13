export type SocialAccount = {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  account_avatar_url: string | null;
  status: "connected" | "disconnected" | "expired" | string;
  scopes: string[] | null;
  metadata: Record<string, unknown> | null;
  connected_at: string | null;
  updated_at: string | null;
  // Present when this account belongs to a Team Workspace rather than an
  // individual user. `connected_by` is the member who connected it — for
  // display only, it never affects who the account publishes as.
  workspace_id?: string | null;
  connected_by?: string | null;
  connected_by_name?: string;
};

export function getConnectedYouTubeAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "youtube" && account.status === "connected"
  );
}

export function getConnectedFacebookAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "facebook" && account.status === "connected"
  );
}

export function getConnectedInstagramAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "instagram" && account.status === "connected"
  );
}
export function getConnectedTwitterAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "twitter" && account.status === "connected"
  );
}

export function getConnectedThreadsAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "threads" && account.status === "connected"
  );
}

export function getConnectedBlueskyAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "bluesky" && account.status === "connected"
  );
}

export function getConnectedPinterestAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "pinterest" && account.status === "connected"
  );
}

export function getConnectedLinkedInAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "linkedin" && account.status === "connected"
  );
}
export function getConnectedRedditAccount(accounts: SocialAccount[]) {
  return accounts.find(
    (account) => account.platform === "reddit" && account.status === "connected"
  );
}