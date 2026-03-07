import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { Reveal } from "@/components/motion/Reveal";
import { OrderSuccess } from "@/components/OrderSuccess";

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
  let generatedImageUrl: string | null = null;

  if (sessionId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: order, error } = await supabase
        .from("orders")
        .select("order_ref, status, total_gbp, generated_image_url")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();
      if (error) {
        errorMessage = "Your order is confirmed — we're just fetching the details. Check back shortly or email hello@keepsy.store with your session ID.";
      } else if (order) {
        status = order.status;
        orderRef = order.order_ref;
        totalGBP = Number(order.total_gbp);
        generatedImageUrl = order.generated_image_url ?? null;
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

  const primaryProductName = items[0]?.product_name ?? "Keepsy creation";

  if (status === "paid") {
    return (
      <main className="min-h-screen">
        <Reveal variant="fadeUp">
          <OrderSuccess
            productName={primaryProductName}
            designUrl={generatedImageUrl}
            orderRef={orderRef}
          />
        </Reveal>
      </main>
    );
  }

  const isFailed = status === "failed";

  return (
    <main
      className="min-h-screen py-16"
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal variant="fadeUp">
          {/* Status label */}
          <p
            className="text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--color-terracotta)" }}
          >
            {isFailed ? "Payment Issue" : "Order Received"}
          </p>

          {/* Headline */}
          <h1
            className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] sm:text-5xl"
            style={{ color: "var(--color-charcoal)" }}
          >
            {isFailed ? "Payment issue detected" : "Thank you for your order!"}
          </h1>

          <p
            className="mt-4 text-base leading-8"
            style={{ color: "rgba(45,41,38,0.65)" }}
          >
            {isFailed
              ? "Something went wrong with your payment. Please try again or contact support."
              : "We\u2019re finalising your order and preparing your design for print."}
          </p>

          {/* Order details panel */}
          <div className="mt-8 rounded-2xl border border-charcoal/8 bg-white p-6 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.10)] space-y-2 text-sm" style={{ color: "rgba(45,41,38,0.65)" }}>
            {orderRef && (
              <p>
                Order reference:{" "}
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>
                  {orderRef}
                </span>
              </p>
            )}
            {sessionId && (
              <p>
                Session: <span className="font-mono text-xs">{sessionId}</span>
              </p>
            )}
            <p>
              Status:{" "}
              <span
                className="font-bold uppercase"
                style={{ color: "var(--color-terracotta)" }}
              >
                {status}
              </span>
            </p>
          </div>

          {/* Total */}
          {typeof totalGBP === "number" && (
            <p className="mt-6 text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>
              Total:{" "}
              <span style={{ color: "var(--color-terracotta)" }}>
                £{totalGBP.toFixed(2)}
              </span>
            </p>
          )}

          {/* Line items */}
          {items.length > 0 && (
            <div className="mt-5 rounded-2xl border border-charcoal/8 bg-white p-6">
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(45,41,38,0.40)" }}
              >
                Items
              </h2>
              <ul className="mt-4 divide-y divide-charcoal/6 text-sm">
                {items.map((item, index) => (
                  <li
                    key={`${item.product_name}-${index}`}
                    className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    style={{ color: "var(--color-charcoal)" }}
                  >
                    <span>
                      {item.product_name}{" "}
                      <span className="text-charcoal/50">× {item.quantity}</span>
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      £{Number(item.line_total_gbp).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <p className="mt-6 rounded-xl border border-charcoal/10 bg-[#F5EDE0] px-4 py-3 text-sm font-semibold text-terracotta">
              {errorMessage}
            </p>
          )}

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl px-8 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Create another design
            </Link>
            <Link
              href="/gift-ideas"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-charcoal/15 px-8 text-sm font-semibold transition hover:bg-charcoal/5"
              style={{ color: "var(--color-charcoal)" }}
            >
              Browse gift ideas
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
