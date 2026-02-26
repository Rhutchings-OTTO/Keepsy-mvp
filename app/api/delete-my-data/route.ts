import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Delete requests are unavailable until Supabase is configured." },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as { email?: string };
    const visitorId =
      req.headers.get("x-visitor-id") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";

    const { error } = await supabase.from("deletion_requests").insert({
      user_key: visitorId,
      email: body?.email?.slice(0, 255) || null,
      status: "pending",
    });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to submit delete request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
