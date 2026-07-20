import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import CalendarClient from "./CalendarClient";

export const metadata: Metadata = {
  title: "Calendar",
  description: "See and reschedule everything queued to publish."
};


export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { supabase, user } = await requireUser();

  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", user.id)
    .is("workspace_id", null)
    .order("scheduled_time", { ascending: true });

  return <CalendarClient posts={posts || []} />;
}