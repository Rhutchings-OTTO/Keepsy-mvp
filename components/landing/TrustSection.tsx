"use client";

// TrustSection — extracted from LandingPage (Phase 3 fix 3.7).
//
// This section has no dependency on region, gateway state, or any shared
// LandingPage state. Extracted so it can be lazy-loaded with next/dynamic,
// deferring its Framer Motion animations and lucide icon bundle until after
// above-the-fold content has painted.
//
// Note: remains "use client" due to Framer Motion (whileInView, motion.div).

import { motion } from "framer-motion";
import { Package, Printer, BadgeCheck, Truck, RotateCcw, Lock } from "lucide-react";

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const TRUST_BADGES = [
  { icon: Package, label: "Premium Materials" },
  { icon: Printer, label: "Vivid Lasting Prints" },
  { icon: BadgeCheck, label: "Gift-Ready Packaging" },
  { icon: Truck, label: "Fast US & UK Shipping" },
  { icon: RotateCcw, label: "Easy 30-Day Returns" },
  { icon: Lock, label: "Secure Checkout" },
];

export function TrustSection() {
  return (
    <section className="py-10 sm:py-20" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className={CONTAINER}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          {/* PLACEHOLDER COUNT: "Over 500 thoughtful gift-givers" is a holding
              phrase awaiting real customer-count data. The exact wording must
              remain identical here and in the SOCIAL_PROOF_ITEMS marquee in
              app/LandingPage.tsx — they reference the same number. Update
              both places together when real data is wired up. */}
          <h2 className="font-serif text-2xl font-bold tracking-[-0.03em] text-charcoal sm:text-4xl">
            Over 500 thoughtful gift-givers
          </h2>
        </motion.div>

        {/* Mobile: horizontal scroll strip */}
        <div className="relative mt-6 -mx-5 sm:hidden">
          {/* Right-edge gradient fade to signal scrollable content */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-10"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--color-cream))",
            }}
          />
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex w-[38vw] flex-shrink-0 snap-start flex-col items-center gap-2 rounded-xl border border-charcoal/8 bg-white px-3 py-4 text-center"
              >
                <Icon size={22} style={{ color: "var(--color-terracotta)" }} />
                <p className="text-[11px] font-semibold leading-snug text-charcoal">{label}</p>
              </div>
            ))}
            {/* Spacer to ensure trailing padding after last card */}
            <div className="w-px flex-shrink-0" />
          </div>
        </div>

        {/* sm+: grid */}
        <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {TRUST_BADGES.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
                className="flex flex-col items-center gap-3 rounded-xl border border-charcoal/8 bg-white px-4 py-6 text-center"
              >
                <Icon size={26} style={{ color: "var(--color-terracotta)" }} />
                <p className="text-xs font-semibold leading-snug text-charcoal">
                  {badge.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
