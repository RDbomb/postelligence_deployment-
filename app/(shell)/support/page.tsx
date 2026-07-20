import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with your account."
};


export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const { supabase, user } = await requireUser();

  return <SupportClient user={user} />;
}
