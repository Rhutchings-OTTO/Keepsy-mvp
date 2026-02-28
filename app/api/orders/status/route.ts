import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        status: "processing",
        source: "fallback",
        message: "Order status is unavailable until Supabase is configured.",
      },
      { status: 200 }
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("order_ref, stripe_session_id, status, currency, total_gbp, created_at, updated_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch order status." }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json(
      {
        status: "processing",
        message: "Payment received. We are finalizing your order details.",
      },
      { status: 200 }
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price_gbp, line_total_gbp")
    .eq("order_ref", order.order_ref);

  return NextResponse.json({
    status: order.status,
    orderRef: order.order_ref,
    sessionId: order.stripe_session_id,
    currency: order.currency,
    totalGBP: order.total_gbp,
    items: items ?? [],
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
}
