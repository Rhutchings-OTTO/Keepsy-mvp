"use client";

import { useEffect } from "react";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

type OrderSuccessProps = {
  productName: string;
  designUrl?: string | null;
};

const NEXT_STEPS = [
  {
    step: "01",
    title: "Design sent to print",
    body: "Your artwork is queued at our print partner and goes into production within the hour.",
  },
  {
    step: "02",
    title: "Printed & packed",
    body: "Every order is printed on premium materials and carefully packed before it ships.",
  },
  {
    step: "03",
    title: "Shipped to your door",
    body: "You'll receive a tracking email the moment your parcel is collected by the courier.",
  },
];

export function OrderSuccess({ productName, designUrl }: OrderSuccessProps) {
  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#D4AF37", "#F9F8F6", "#AA8F39"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#D4AF37", "#F9F8F6", "#AA8F39"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      {/* Hero confirmation strip */}
      <section
        className="py-20 sm:py-28 text-center"
        style={{ backgroundColor: "var(--color-forest)" }}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <motion.svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              aria-hidden="true"
            >
              <motion.path
                d="M8 18L15 25L28 11"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              />
            </motion.svg>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50"
          >
            Order Confirmed
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 font-serif font-bold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            It&apos;s On Its Way!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mx-auto mt-5 max-w-sm text-base leading-8 text-white/65"
          >
            Your {productName} has been confirmed and sent to production. We&apos;ll keep you updated every step of the way.
          </motion.p>
        </div>
      </section>

      {/* Design preview (if available) */}
      {designUrl && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="py-12 text-center"
          style={{ backgroundColor: "#F5EDE0" }}
        >
          <div className="mx-auto max-w-xs px-4">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-charcoal/40">
              Your Design
            </p>
            <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
              <img
                src={designUrl}
                alt="Your Creation"
                className="mx-auto h-56 w-56 object-contain"
              />
            </div>
          </div>
        </motion.section>
      )}

      {/* What happens next */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--color-terracotta)" }}
            >
              What Happens Next
            </p>
          </motion.div>

          <div className="mt-8 grid gap-0 sm:grid-cols-3">
            {NEXT_STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <div className="border-b border-charcoal/10 py-8 sm:border-b-0 sm:border-r sm:px-8 first:pl-0 last:border-r-0 last:pr-0">
                  <span
                    className="font-serif text-4xl font-bold leading-none"
                    style={{ color: "rgba(196,113,74,0.25)" }}
                  >
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-bold text-charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-charcoal/60">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section
        className="py-14 sm:py-16"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
            Keep the magic going
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
            Make Another Memory?
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <MagneticLink
              href="/create"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-8 text-base font-semibold transition hover:opacity-90 inline-block"
              style={{ backgroundColor: "var(--color-charcoal)", color: "white" }}
            >
              Create Another Design
            </MagneticLink>
            <MagneticLink
              href="/gift-ideas"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/30 px-8 text-base font-semibold text-white/80 transition hover:border-white/60 hover:text-white inline-block"
            >
              Browse Gift Ideas
            </MagneticLink>
          </div>
        </div>
      </section>
    </div>
  );
}
