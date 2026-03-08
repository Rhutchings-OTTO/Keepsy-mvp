/**
 * GET /api/order-status?session_id=<stripe_session_id>
 *
 * Lightweight endpoint used by SuccessPoller to check whether the Stripe
 * webhook has finished writing the order to Supabase.
 *
 * Returns { found: false } when the order doesn't exist yet so the poller
 * knows to keep retrying, or a typed OrderData payload when it does.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { schemas, validateWithSchema } from "@/lib/http/validate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const rl = await guardRateLimit(req, "/api/order-status", "GET", requestId);
  if ("response" in rl) return rl.response;

  const url = new URL(req.url);
  const sessionIdRaw = url.searchParams.get("session_id");
  const validated = validateWithSchema(
    { session_id: sessionIdRaw ?? "" },
    z.object({ session_id: schemas.sessionId }).strict()
  );
  if ("error" in validated) {
    return NextResponse.json(validated.error, { status: validated.status });
  }
  const sessionId = validated.data.session_id;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("order_ref, status, total_gbp, generated_image_url")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  if (!order) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity, line_total_gbp")
    .eq("order_ref", order.order_ref);

  const primaryProductName =
    (items ?? [])[0]?.product_name ?? "Keepsy creation";

  return NextResponse.json({
    status: order.status,
    orderRef: order.order_ref,
    totalGBP: order.total_gbp != null ? Number(order.total_gbp) : null,
    generatedImageUrl: order.generated_image_url ?? null,
    primaryProductName,
  });
}
