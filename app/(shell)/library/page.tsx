import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import LibraryClient from "./LibraryClient";

export const metadata: Metadata = {
  title: "Media library",
  description: "Images and video ready to attach to a post."
};


export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { supabase, user } = await requireUser();

  const { data: items } = await supabase
    .from("media_library")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  return <LibraryClient items={items || []} />;
}