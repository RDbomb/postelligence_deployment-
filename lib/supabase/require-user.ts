import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the signed-in user for a Server Component, redirecting to /login when
 * there is none.
 *
 * Replaces this three-line pair, repeated across every page in the app shell:
 *
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) redirect("/login");
 *
 * The Supabase client is returned alongside the user because nearly every caller
 * goes on to query with it — returning it avoids constructing a second client.
 *
 * This check is kept even though `proxy.ts` guards the same routes. The proxy is
 * an optimistic gate: it is a single spoofable choke point (CVE-2025-29927), and
 * in the App Router a layout's guard does not prevent its child page from
 * executing. Authorisation belongs next to the data it protects.
 *
 * `redirect()` throws, so TypeScript narrows `user` to non-null after this call.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, user };
}
