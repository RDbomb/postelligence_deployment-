import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AIStudioClient from "./AIStudioClient";

export const dynamic = "force-dynamic";

export default async function AIStudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AIStudioClient
      user={{
        email: user.email,
        user_metadata: user.user_metadata as Record<string, string>,
      }}
    />
  );
}