import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/**
 * Exchanges admin credentials for an httpOnly session cookie.
 *
 * The credentials are verified against server-only env vars and never leave the
 * server; the browser receives only an opaque signed token it cannot read.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!verifyAdminCredentials(email, password)) {
      // Deliberately vague: do not reveal whether the account or the password
      // was the problem, or whether admin auth is configured at all.
      return NextResponse.json(
        { error: "Invalid administrative credentials." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(),
      adminSessionCookieOptions,
    );
    return response;
  } catch (err: unknown) {
    // A missing ADMIN_SESSION_SECRET throws here. Report it as a server error
    // rather than an auth failure, but do not echo the message to the client.
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Administrative login is unavailable." },
      { status: 500 },
    );
  }
}
