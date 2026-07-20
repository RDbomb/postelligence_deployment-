import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 proxy (the file convention formerly named `middleware.ts`).
 *
 * Responsibilities:
 *   - Refresh the Supabase auth cookies on every matched request, so sessions do
 *     not expire out from under a signed-in user.
 *   - Redirect signed-out visitors away from the app shell, and signed-in
 *     visitors away from /login.
 *
 * This guard is OPTIMISTIC and is intentionally NOT the only auth check.
 * The `getUser()` calls in pages, layouts and route handlers are kept on purpose:
 * a proxy is a single spoofable choke point (see CVE-2025-29927, where a crafted
 * `x-middleware-subrequest` header skipped Next.js middleware entirely), and in
 * the App Router a layout's guard does not stop its child page from executing.
 * Authorisation belongs next to the data it protects; this layer exists to avoid
 * rendering work and to keep tokens fresh.
 */
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     *   - /api/*        route handlers authenticate themselves and must return
     *                   401 JSON rather than be redirected to an HTML login page.
     *                   This also keeps the cron endpoint (/api/scheduler/run) and
     *                   the token-authenticated external-approve link reachable.
     *   - /auth/*       OAuth callbacks; redirecting these breaks the code exchange.
     *   - /admin        authenticates client-side against sessionStorage, not Supabase.
     *   - _next/*       build output and image optimiser.
     *   - static assets matched by file extension.
     */
    "/((?!api|auth|admin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|mp4|webm)$).*)",
  ],
};
