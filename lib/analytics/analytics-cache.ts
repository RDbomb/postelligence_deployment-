import { createClient } from "@/lib/supabase/server";
import type { AnalyticsDashboardData } from "@/lib/analytics/social-analytics";

// How long cached data is considered "fresh" — serve instantly, no API calls
const FRESH_TTL_MINUTES = 30;

// How long before we consider cache "stale" — serve stale + refresh in background
const STALE_TTL_MINUTES = 60;

export type CacheResult =
  | { hit: true; data: AnalyticsDashboardData; stale: boolean; cachedAt: string }
  | { hit: false };

/**
 * Read cached analytics for this user from Supabase.
 * Returns:
 *   - hit: false            → no cache, caller must fetch fresh
 *   - hit: true, stale: false → fresh cache, serve immediately
 *   - hit: true, stale: true  → stale cache, serve immediately + trigger background refresh
 */
export async function readAnalyticsCache(userId: string): Promise<CacheResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analytics_cache")
    .select("data, cached_at")
    .eq("user_id", userId)
    .is("workspace_id", null)
    .single();

  if (error || !data) return { hit: false };

  const cachedAt = new Date(data.cached_at);
  const ageMinutes = (Date.now() - cachedAt.getTime()) / 1000 / 60;

  // Older than STALE_TTL — treat as cache miss, fetch fresh
  if (ageMinutes > STALE_TTL_MINUTES) return { hit: false };

  return {
    hit: true,
    data: data.data as AnalyticsDashboardData,
    stale: ageMinutes > FRESH_TTL_MINUTES,
    cachedAt: data.cached_at,
  };
}

/**
 * Write analytics data to the cache for this user.
 * Uses upsert so it works whether or not a row already exists.
 */
export async function writeAnalyticsCache(
  userId: string,
  analytics: AnalyticsDashboardData
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("analytics_cache").upsert(
    {
      user_id: userId,
      workspace_id: null,
      data: analytics as unknown as Record<string, unknown>,
      cached_at: new Date().toISOString(),
      is_refreshing: false,
    },
    { onConflict: "user_id" }
  );
}

/**
 * Mark this user's cache row as currently refreshing.
 * Prevents multiple concurrent background refreshes.
 */
export async function markCacheRefreshing(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // Only set is_refreshing = true if it's currently false
  const { data, error } = await supabase
    .from("analytics_cache")
    .update({ is_refreshing: true })
    .eq("user_id", userId)
    .is("workspace_id", null)
    .eq("is_refreshing", false)
    .select("id")
    .single();

  if (error || !data) return false; // already refreshing or no row
  return true;
}

/**
 * Invalidate (delete) the cache for a user.
 * Call this when the user clicks "Refresh" to force a fresh fetch.
 */
export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("analytics_cache").delete().eq("user_id", userId).is("workspace_id", null);
}

// ── Workspace (Team Analytics) cache ─────────────────────────────
// Same stale-while-revalidate pattern as above, keyed by workspace_id
// instead of user_id (see migration 013). Kept as separate functions
// so the personal-analytics code path above is never touched.

export async function readWorkspaceAnalyticsCache(workspaceId: string): Promise<CacheResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analytics_cache")
    .select("data, cached_at")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) return { hit: false };

  const cachedAt = new Date(data.cached_at);
  const ageMinutes = (Date.now() - cachedAt.getTime()) / 1000 / 60;

  if (ageMinutes > STALE_TTL_MINUTES) return { hit: false };

  return {
    hit: true,
    data: data.data as AnalyticsDashboardData,
    stale: ageMinutes > FRESH_TTL_MINUTES,
    cachedAt: data.cached_at,
  };
}

/**
 * Write cached analytics for a workspace. Not a plain upsert — see the
 * comment on upsertSocialAccount for why: Postgres can't infer an
 * ON CONFLICT target against a *partial* unique index (which is what
 * distinguishes personal vs workspace cache rows), so we look the row
 * up ourselves and issue an explicit insert or update.
 */
export async function writeWorkspaceAnalyticsCache(
  workspaceId: string,
  userId: string,
  analytics: AnalyticsDashboardData
): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("analytics_cache")
    .select("id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const fields = {
    user_id: userId,
    workspace_id: workspaceId,
    data: analytics as unknown as Record<string, unknown>,
    cached_at: new Date().toISOString(),
    is_refreshing: false,
  };

  if (existing?.id) {
    await supabase.from("analytics_cache").update(fields).eq("id", existing.id);
  } else {
    await supabase.from("analytics_cache").insert(fields);
  }
}

export async function markWorkspaceCacheRefreshing(workspaceId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analytics_cache")
    .update({ is_refreshing: true })
    .eq("workspace_id", workspaceId)
    .eq("is_refreshing", false)
    .select("id")
    .single();

  if (error || !data) return false;
  return true;
}

export async function invalidateWorkspaceAnalyticsCache(workspaceId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("analytics_cache").delete().eq("workspace_id", workspaceId);
}