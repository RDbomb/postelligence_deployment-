import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import AIStudioClient from "./AIStudioClient";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Generate captions, hashtags and images for your posts."
};


export const dynamic = "force-dynamic";

export default async function AIStudioPage() {
  const { supabase, user } = await requireUser();

  return (
    <AIStudioClient
      user={{
        email: user.email,
        user_metadata: user.user_metadata as Record<string, string>,
      }}
    />
  );
}