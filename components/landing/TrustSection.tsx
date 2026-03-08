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
    <section className="py-20 sm:py-28" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className={CONTAINER}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h2 className="font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-4xl">
            Why Thousands Choose Keepsy
          </h2>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
