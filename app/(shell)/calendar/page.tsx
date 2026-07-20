import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", user.id)
    .is("workspace_id", null)
    .order("scheduled_time", { ascending: true });

  return <CalendarClient posts={posts || []} />;
}