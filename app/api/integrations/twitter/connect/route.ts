import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRequestToken, buildTwitterOAuthUrl } from "@/lib/integrations/twitter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/", requestUrl.origin));

  try {
    const { oauthToken, oauthTokenSecret } = await getRequestToken(requestUrl.origin);
    const oauthUrl = buildTwitterOAuthUrl(oauthToken);
    const response = NextResponse.redirect(oauthUrl);

    response.cookies.set(
      "postsync_twitter_oauth_state",
      JSON.stringify({ oauthToken, oauthTokenSecret, userId: user.id }),
      { httpOnly: true, maxAge: 60 * 10, path: "/", sameSite: "lax", secure: requestUrl.protocol === "https:" }
    );

    return response;
  } catch (error) {
    const redirectUrl = new URL("/dashboard", requestUrl.origin);
    redirectUrl.searchParams.set("twitter", "error");
    redirectUrl.searchParams.set("message", error instanceof Error ? error.message : "Twitter setup failed.");
    return NextResponse.redirect(redirectUrl);
  }
}