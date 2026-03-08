"use client";

/**
 * SuccessPoller
 *
 * Rendered by the success page server component when the order isn't found
 * on first load (webhook may not have completed yet). Polls Supabase via the
 * /api/order-status route every 2 seconds, up to MAX_ATTEMPTS times.
 *
 * Once the order is found with status "paid" (or any non-pending status) it
 * swaps in the full <OrderSuccess> UI. If still not found after MAX_ATTEMPTS
 * it shows a friendly fallback message.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { OrderSuccess } from "@/components/OrderSuccess";

const POLL_INTERVAL_MS = 2_000;
const MAX_ATTEMPTS = 10;

type OrderData = {
  status: string;
  orderRef: string | null;
  totalGBP: number | null;
  generatedImageUrl: string | null;
  primaryProductName: string;
};

type Props = {
  sessionId: string;
};

export function SuccessPoller({ sessionId }: Props) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;

      try {
        const res = await fetch(
          `/api/order-status?session_id=${encodeURIComponent(sessionId)}`
        );
        if (res.ok) {
          const data = (await res.json()) as OrderData | { found: false };
          if ("found" in data && data.found === false) {
            // Order not written yet — keep polling
          } else {
            const o = data as OrderData;
            if (!cancelled) {
              setOrder(o);
              return; // stop polling
            }
          }
        }
      } catch {
        // Network error — keep polling
      }

      if (cancelled) return;

      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          setTimedOut(true);
          return next;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        return next;
      });
    }

    // Start first poll immediately
    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId]);

  // Order found and paid — show the full success UI
  if (order && order.status === "paid") {
    return (
      <main className="min-h-screen">
        <Reveal variant="fadeUp">
          <OrderSuccess
            productName={order.primaryProductName}
            designUrl={order.generatedImageUrl}
            orderRef={order.orderRef}
          />
        </Reveal>
      </main>
    );
  }

  // Order found but not yet paid (e.g. processing) — or still polling
  if (timedOut || (order && order.status !== "paid")) {
    return (
      <main
        className="min-h-screen py-16"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal variant="fadeUp">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--color-terracotta)" }}
            >
              Order Confirmed
            </p>
            <h1
              className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] sm:text-5xl"
              style={{ color: "var(--color-charcoal)" }}
            >
              Thank you for your order!
            </h1>
            <p
              className="mt-4 text-base leading-8"
              style={{ color: "var(--ink-muted)" }}
            >
              Your order is confirmed — we&apos;re just putting the finishing
              touches on your order details. Check back shortly or look for
              your confirmation email.
            </p>
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

  // Still polling — show a loading state
  return (
    <main
      className="flex min-h-screen items-center justify-center py-16"
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      <div className="text-center">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "var(--color-terracotta)" }}
        >
          Order Confirmed
        </p>
        <h1
          className="mt-3 font-serif text-3xl font-bold tracking-[-0.03em]"
          style={{ color: "var(--color-charcoal)" }}
        >
          Loading your order&hellip;
        </h1>
        <p
          className="mt-4 text-sm"
          style={{ color: "var(--ink-muted)" }}
        >
          Just a moment while we fetch your order details.
        </p>
      </div>
    </main>
  );
}
