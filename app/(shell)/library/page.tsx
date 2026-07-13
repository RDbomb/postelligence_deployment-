import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("media_library")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  return <LibraryClient items={items || []} />;
}