import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/auth";

/**
 * Guard for admin route handlers.
 *
 * Returns a 401 `NextResponse` when the caller has no valid admin session, or
 * `null` when the request may proceed. Callers do this:
 *
 *   const denied = await requireAdminSession();
 *   if (denied) return denied;
 *
 * These routes talk to Supabase with the service role key, which bypasses Row
 * Level Security — so this check is the only thing standing between the public
 * internet and unrestricted database access. Treat it accordingly.
 */
export async function requireAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!verifyAdminSessionToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
  } catch (err: unknown) {
    // Missing ADMIN_SESSION_SECRET throws during verification. Fail closed.
    console.error("Admin session verification failed:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
