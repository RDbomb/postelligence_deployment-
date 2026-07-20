import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route prefixes that require an authenticated Supabase session.
 *
 * These mirror the segments inside the `app/(shell)/` route group, which is the
 * signed-in application shell. Route groups do not affect the URL, so the
 * pathnames here are the real ones.
 */
const PROTECTED_PREFIXES = [
  "/ai-studio",
  "/analytics",
  "/automation",
  "/calendar",
  "/create",
  "/dashboard",
  "/drafts",
  "/integrations",
  "/library",
  "/settings",
  "/support",
  "/team",
  "/workspace",
] as const;

/**
 * Public pathnames that sit *underneath* a protected prefix and must stay open.
 *
 * `/automation/action-completed` lives at `app/automation/action-completed`,
 * outside the `(shell)` group. It is the landing page for the token-authenticated
 * external approval links produced by `/api/automation/external-approve`, which
 * are delivered over Discord/Telegram to people who are not signed in. Guarding
 * it would break that flow entirely.
 */
const PUBLIC_EXCEPTIONS = ["/automation/action-completed"] as const;

/**
 * Signed-out-only pages. An authenticated visitor is bounced to the dashboard.
 */
const AUTH_PAGES = ["/login"] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedPath(pathname: string) {
  if (matchesPrefix(pathname, PUBLIC_EXCEPTIONS)) return false;
  return matchesPrefix(pathname, PROTECTED_PREFIXES);
}

/**
 * Refreshes the Supabase auth cookies and applies the route guard.
 *
 * Two things happen here, and the order matters:
 *
 *  1. `getUser()` revalidates the access token against Supabase's auth server and,
 *     when it has expired, issues a refreshed pair of cookies. Without this running
 *     on each request, a user's session silently dies when the access token lapses.
 *     Nothing may run between `createServerClient` and `getUser` — see the comment
 *     at the call site.
 *
 *  2. The refreshed cookies must survive whatever response we return. On a redirect
 *     we copy them onto the new response; returning a bare `NextResponse.redirect`
 *     would throw the refresh away and log the user out on the next hop.
 *
 * This is an *optimistic* gate. It is deliberately not the only auth check —
 * see the note in `proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without credentials there is no session to refresh and no way to authorise
  // anyone. Pass through rather than 500 every request in the app — the page and
  // route handlers throw a descriptive error of their own.
  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: no code between createServerClient and getUser. Anything that
  // awaits here can let a request through before the token has been revalidated,
  // which makes session bugs intermittent and very hard to reproduce.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    return copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (user && matchesPrefix(pathname, AUTH_PAGES)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  return supabaseResponse;
}

/**
 * Carries the refreshed auth cookies from the pass-through response onto a
 * redirect, so a rotated token is not lost when we bounce the request.
 */
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}
