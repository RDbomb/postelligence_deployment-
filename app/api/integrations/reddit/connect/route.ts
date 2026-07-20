import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildRedditOAuthUrl } from "@/lib/integrations/reddit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/", requestUrl.origin));

  try {
    const state = crypto.randomUUID();
    const oauthUrl = buildRedditOAuthUrl(requestUrl.origin, state);
    const response = NextResponse.redirect(oauthUrl);

    response.cookies.set(
      "postelligence_reddit_oauth_state",
      JSON.stringify({ state, userId: user.id }),
      { httpOnly: true, maxAge: 60 * 10, path: "/", sameSite: "lax", secure: requestUrl.protocol === "https:" }
    );

    return response;
  } catch (error) {
    const redirectUrl = new URL("/dashboard", requestUrl.origin);
    redirectUrl.searchParams.set("reddit", "error");
    redirectUrl.searchParams.set("message", error instanceof Error ? error.message : "Reddit setup is incomplete.");
    return NextResponse.redirect(redirectUrl);
  }
}
