import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { ticketId, role, isTyping } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Fetch current typing status
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("typing_status")
      .eq("id", ticketId)
      .single();

    const currentTyping = ticket?.typing_status || { user: false, admin: false };
    const updatedTyping = {
      ...currentTyping,
      [role]: !!isTyping
    };

    const { error } = await supabase
      .from("support_tickets")
      .update({ typing_status: updatedTyping })
      .eq("id", ticketId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update typing state" }, { status: 500 });
  }
}
