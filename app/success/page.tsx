import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const raw = params[key];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === "string" ? raw : undefined;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const sessionId = readParam(resolvedParams, "session_id");

  let status: "pending" | "paid" | "failed" | "cancelled" | "processing" = "processing";
  let orderRef: string | null = null;
  let totalGBP: number | null = null;
  let items: Array<{ product_name: string; quantity: number; line_total_gbp: number }> = [];
  let errorMessage: string | null = null;

  if (sessionId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: order, error } = await supabase
        .from("orders")
        .select("order_ref, status, total_gbp")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();
      if (error) {
        errorMessage = "Could not load order status yet.";
      } else if (order) {
        status = order.status;
        orderRef = order.order_ref;
        totalGBP = Number(order.total_gbp);
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_name, quantity, line_total_gbp")
          .eq("order_ref", order.order_ref);
        items = (orderItems || []).map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          line_total_gbp: Number(item.line_total_gbp),
        }));
      }
    }
  }

  const headline =
    status === "paid"
      ? "Order confirmed"
      : status === "failed"
      ? "Payment issue detected"
      : "Payment received";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-black">{headline} ✅</h1>
        <p className="mt-3 text-black/70">
          We are finalizing your order details and preparing it for fulfillment.
        </p>

        <div className="mt-6 space-y-2 text-sm text-black/65">
          <p>Session: {sessionId || "—"}</p>
          <p>Order reference: {orderRef || "Pending assignment"}</p>
          <p>Status: <span className="font-bold uppercase">{status}</span></p>
        </div>

        {typeof totalGBP === "number" && (
          <p className="mt-5 text-lg font-black">Total: £{totalGBP.toFixed(2)}</p>
        )}

        {items.length > 0 && (
          <div className="mt-4 rounded-2xl border border-black/10 p-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-black/55">Items</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {items.map((item, index) => (
                <li key={`${item.product_name}-${index}`} className="flex justify-between gap-2">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>£{Number(item.line_total_gbp).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorMessage && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/create" className="rounded-xl bg-black px-4 py-2 font-bold text-white">
            Create another design
          </Link>
          <Link href="/gift-ideas" className="rounded-xl border border-black/15 px-4 py-2 font-bold text-black">
            Browse gift ideas
          </Link>
        </div>

        <p className="mt-6 text-xs text-black/50">
          Final remaining integration: Printify order execution after webhook-confirmed payment.
        </p>
      </div>
    </main>
  );
}