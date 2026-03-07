import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type TrackPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type OrderStatus =
  | "pending"
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

const STEPS: { key: OrderStatus | "confirmed"; label: string; sub: string }[] = [
  { key: "confirmed",     label: "Order Confirmed",   sub: "Payment received, design queued for print" },
  { key: "in_production", label: "In Production",     sub: "Being printed on premium materials" },
  { key: "shipped",       label: "Shipped",           sub: "With the courier, heading to you" },
  { key: "delivered",     label: "Delivered",         sub: "Enjoy your keepsake!" },
];

function stepIndex(status: OrderStatus): number {
  if (status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "in_production") return 1;
  return 0; // paid / pending / confirmed
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = (await searchParams) ?? {};
  const ref = Array.isArray(params.ref) ? params.ref[0] : params.ref;

  if (!ref) {
    return <NotFound message="No order reference provided." />;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return <NotFound message="Order tracking is temporarily unavailable." />;
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_ref, status, total_gbp, product_type, customer_name, tracking_number, tracking_url, created_at"
    )
    .eq("order_ref", ref)
    .maybeSingle();

  if (!order) {
    return <NotFound message={`No order found for reference "${ref}".`} />;
  }

  const status = order.status as OrderStatus;
  const activeStep = stepIndex(status);
  const isFailed = status === "failed" || status === "cancelled";

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* Header strip */}
      <section
        className="py-16 sm:py-20 text-center"
        style={{ backgroundColor: "var(--color-forest)" }}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
            Order Tracking
          </p>
          <h1
            className="mt-4 font-serif font-bold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            {isFailed ? "Order Issue" : "Track Your Order"}
          </h1>
          <p className="mt-3 text-sm text-white/50 font-mono">{order.order_ref}</p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        {/* Stepper */}
        {!isFailed && (
          <div className="rounded-2xl border border-charcoal/8 bg-white p-6 sm:p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.08)]">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] mb-6"
              style={{ color: "var(--color-terracotta)" }}
            >
              Progress
            </p>
            <ol className="space-y-0">
              {STEPS.map((step, i) => {
                const isDone = i < activeStep;
                const isActive = i === activeStep;
                const isPending = i > activeStep;
                return (
                  <li key={step.key} className="flex gap-4">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: isDone
                            ? "var(--color-forest)"
                            : isActive
                            ? "var(--color-terracotta)"
                            : "rgba(45,41,38,0.08)",
                          color: isDone || isActive ? "#fff" : "rgba(45,41,38,0.35)",
                        }}
                      >
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className="w-px flex-1 my-1"
                          style={{
                            backgroundColor: isDone
                              ? "var(--color-forest)"
                              : "rgba(45,41,38,0.08)",
                            minHeight: 28,
                          }}
                        />
                      )}
                    </div>
                    {/* Label */}
                    <div className="pb-7 pt-0.5">
                      <p
                        className="font-serif text-base font-bold"
                        style={{
                          color: isPending
                            ? "rgba(45,41,38,0.35)"
                            : "var(--color-charcoal)",
                        }}
                      >
                        {step.label}
                      </p>
                      <p
                        className="mt-0.5 text-sm"
                        style={{ color: "rgba(45,41,38,0.5)" }}
                      >
                        {step.sub}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <div className="rounded-2xl border border-charcoal/8 bg-white p-6 sm:p-8">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3"
              style={{ color: "var(--color-terracotta)" }}
            >
              Order Status
            </p>
            <p className="font-serif text-lg font-bold" style={{ color: "var(--color-charcoal)" }}>
              {status === "cancelled" ? "Order cancelled" : "Payment issue"}
            </p>
            <p className="mt-2 text-sm" style={{ color: "rgba(45,41,38,0.6)" }}>
              Please contact us at{" "}
              <a href="mailto:hello@keepsy.store" style={{ color: "var(--color-terracotta)" }}>
                hello@keepsy.store
              </a>{" "}
              with your order reference and we&apos;ll sort it out.
            </p>
          </div>
        )}

        {/* Tracking info */}
        {status === "shipped" && (order.tracking_number || order.tracking_url) && (
          <div className="rounded-2xl border border-charcoal/8 bg-white p-6 sm:p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.08)]">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4"
              style={{ color: "var(--color-terracotta)" }}
            >
              Shipping Details
            </p>
            {order.tracking_number && (
              <p className="text-sm" style={{ color: "rgba(45,41,38,0.65)" }}>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>
                  Tracking number:{" "}
                </span>
                <span className="font-mono">{order.tracking_number}</span>
              </p>
            )}
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl px-7 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--color-forest)" }}
              >
                Track with Courier →
              </a>
            )}
          </div>
        )}

        {/* Order summary */}
        <div className="rounded-2xl border border-charcoal/8 bg-white p-6 sm:p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.08)]">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4"
            style={{ color: "var(--color-terracotta)" }}
          >
            Order Summary
          </p>
          <dl className="space-y-2 text-sm" style={{ color: "rgba(45,41,38,0.65)" }}>
            {order.customer_name && (
              <div className="flex justify-between gap-4">
                <dt className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Name</dt>
                <dd>{order.customer_name}</dd>
              </div>
            )}
            {order.product_type && (
              <div className="flex justify-between gap-4">
                <dt className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Product</dt>
                <dd className="capitalize">{order.product_type}</dd>
              </div>
            )}
            {order.total_gbp && (
              <div className="flex justify-between gap-4">
                <dt className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Total</dt>
                <dd>£{Number(order.total_gbp).toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Estimated delivery</dt>
              <dd>5–10 business days</dd>
            </div>
          </dl>
        </div>

        {/* Help + CTA */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/create"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-7 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Create Another Design
          </Link>
          <a
            href="mailto:hello@keepsy.store"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-charcoal/15 px-7 text-sm font-semibold transition hover:bg-charcoal/5"
            style={{ color: "var(--color-charcoal)" }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <main className="min-h-screen py-20" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className="mx-auto max-w-xl px-4 text-center">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "var(--color-terracotta)" }}
        >
          Order Not Found
        </p>
        <h1
          className="mt-4 font-serif text-3xl font-bold"
          style={{ color: "var(--color-charcoal)" }}
        >
          We couldn&apos;t find that order
        </h1>
        <p className="mt-4 text-base" style={{ color: "rgba(45,41,38,0.6)" }}>
          {message}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-7 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Go Home
          </Link>
          <a
            href="mailto:hello@keepsy.store"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-charcoal/15 px-7 text-sm font-semibold"
            style={{ color: "var(--color-charcoal)" }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
