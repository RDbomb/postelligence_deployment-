import { NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler/auto-publisher";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent") || "";
  const url = new URL(request.url);
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret");
  const isVercelCron = userAgent.includes("vercel-cron") || request.headers.get("x-vercel-cron") === "1";

  if (cronSecret && providedSecret !== cronSecret && !isVercelCron) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!cronSecret && !isVercelCron) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runScheduler();
    return NextResponse.json({ ok: true, ...result, ran: new Date().toISOString() });
  } catch (error) {
    console.error("[Scheduler] Run failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler failed." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!cronSecret) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runScheduler();
    return NextResponse.json({ ok: true, ...result, ran: new Date().toISOString() });
  } catch (error) {
    console.error("[Scheduler] Run failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler failed." },
      { status: 500 }
    );
  }
}
