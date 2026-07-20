import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SupportClient from "./SupportClient";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <SupportClient user={user} />;
}
