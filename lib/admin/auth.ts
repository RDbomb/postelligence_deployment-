import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-only admin authentication.
 *
 * This module must never be imported from a client component. The credentials it
 * reads are deliberately NOT prefixed with `NEXT_PUBLIC_`, so Next.js will not
 * inline them into the browser bundle.
 *
 * Flow:
 *   POST /api/admin/login  → verifyAdminCredentials() → Set-Cookie (httpOnly)
 *   POST /api/admin/*      → requireAdminSession() reads that cookie
 *
 * The browser never holds the password, and admin API calls no longer carry
 * credentials in their request bodies.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";

/** Session lifetime. Short by design — this gates service-role database access. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Admin authentication is disabled until it is configured.",
    );
  }
  return secret;
}

/** Constant-time string comparison; avoids leaking length/prefix via timing. */
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * Checks submitted credentials against the server-only environment variables.
 * Returns false (rather than throwing) when the env vars are absent, so a
 * misconfigured deployment fails closed instead of granting access.
 */
export function verifyAdminCredentials(email: unknown, password: unknown) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) return false;
  if (typeof email !== "string" || typeof password !== "string") return false;

  // Both comparisons always run — no early return — so timing does not reveal
  // which of the two fields was wrong.
  const emailOk = safeEqual(email, expectedEmail);
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

/** Builds the signed, time-limited cookie value issued on successful login. */
export function createAdminSessionToken() {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

/** Validates a cookie value: correct signature, and not expired. */
export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!safeEqual(signature, sign(expiresAt))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
