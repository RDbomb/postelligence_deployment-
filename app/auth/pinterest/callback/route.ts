import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL(`/api/integrations/pinterest/callback${url.search}`, url.origin));
}