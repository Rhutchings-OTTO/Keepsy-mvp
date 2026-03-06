import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate } from "@/lib/http/validate";

const deleteDataSchema = z.object({ email: z.string().email().max(255).optional().nullable() }).strict();

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/delete-my-data", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/delete-my-data", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Delete requests are unavailable until Supabase is configured." },
      { status: 503 }
    );
  }

  try {
    const parsed = await parseAndValidate(req, deleteDataSchema);
    if ("error" in parsed) {
      return NextResponse.json(parsed.error, { status: parsed.status });
    }
    const body = parsed.data;
    const visitorId =
      req.headers.get("x-visitor-id") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";

    const { error } = await supabase.from("deletion_requests").insert({
      user_key: visitorId,
      email: body.email?.slice(0, 255) ?? null,
      status: "pending",
    });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to submit delete request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
