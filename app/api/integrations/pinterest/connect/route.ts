import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPinterestOAuthUrl } from "@/lib/integrations/pinterest";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/", requestUrl.origin));

  try {
    const state = crypto.randomUUID();
    const oauthUrl = buildPinterestOAuthUrl(requestUrl.origin, state);
    const response = NextResponse.redirect(oauthUrl);

    response.cookies.set(
      "postelligence_pinterest_oauth_state",
      JSON.stringify({ state, userId: user.id }),
      { httpOnly: true, maxAge: 60 * 10, path: "/", sameSite: "lax", secure: requestUrl.protocol === "https:" }
    );

    return response;
  } catch (error) {
    const redirectUrl = new URL("/dashboard", requestUrl.origin);
    redirectUrl.searchParams.set("pinterest", "error");
    redirectUrl.searchParams.set("message", error instanceof Error ? error.message : "Pinterest setup incomplete.");
    return NextResponse.redirect(redirectUrl);
  }
}