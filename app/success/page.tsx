import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { MagneticLink } from "@/components/ui/MagneticLink";
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
        errorMessage = "Could not load order status yet.";
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
          />
        </Reveal>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Reveal variant="fadeUp">
        <div className="rounded-[2rem] border border-white/65 bg-[linear-gradient(180deg,rgba(253,246,238,0.92),rgba(247,236,224,0.95))] p-8 shadow-warm-md backdrop-blur-xl sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: status === "failed" ? "#C0392B" : "var(--color-terracotta)" }}>
            {status === "failed" ? "Payment Issue" : "Order Received"}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.03em] sm:text-4xl" style={{ color: "var(--color-charcoal)" }}>
            {status === "failed" ? "Payment issue detected" : "Thank you for your order!"}
          </h1>
          <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
            {status === "failed"
              ? "Something went wrong with your payment. Please try again or contact support."
              : "We\u2019re finalising your order and preparing your design for print."}
          </p>

          <div className="mt-6 rounded-xl border border-white/60 bg-white/60 p-4 space-y-2 text-sm" style={{ color: "rgba(45,41,38,0.65)" }}>
            {orderRef && <p>Order reference: <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>{orderRef}</span></p>}
            {sessionId && <p>Session: <span className="font-mono text-xs">{sessionId}</span></p>}
            <p>Status: <span className="font-bold uppercase" style={{ color: "var(--color-terracotta)" }}>{status}</span></p>
          </div>

          {typeof totalGBP === "number" && (
            <p className="mt-5 text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>
              Total: <span style={{ color: "var(--color-terracotta)" }}>£{totalGBP.toFixed(2)}</span>
            </p>
          )}

          {items.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/60 bg-white/60 p-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(45,41,38,0.45)" }}>Items</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {items.map((item, index) => (
                  <li key={`${item.product_name}-${index}`} className="flex justify-between gap-2" style={{ color: "var(--color-charcoal)" }}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span style={{ color: "var(--color-terracotta)" }}>£{Number(item.line_total_gbp).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorMessage && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {errorMessage}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-terra-glow transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Create another design
            </Link>
            <Link
              href="/gift-ideas"
              className="inline-flex h-12 items-center gap-2 rounded-full border px-6 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ borderColor: "rgba(45,41,38,0.15)", color: "var(--color-charcoal)", backgroundColor: "rgba(255,255,255,0.80)" }}
            >
              Browse gift ideas
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
