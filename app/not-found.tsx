"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ShoppingBag, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="max-w-lg"
      >
        {/* Decorative illustration */}
        <div className="mb-8 text-[5rem] leading-none select-none" aria-hidden>
          🎁
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">
          404 — Page Not Found
        </p>
        <h1 className="mb-4 font-serif text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-[-0.03em] text-charcoal">
          Oops! This page wandered off.
        </h1>
        <p className="mb-10 text-lg leading-8 text-charcoal/60">
          It might have been moved, renamed, or maybe it never existed. Let&apos;s get you back to
          something beautiful.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-terracotta px-6 text-sm font-semibold text-white shadow-terra-glow transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Home size={16} />
            Back Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-charcoal/15 bg-white/80 px-6 text-sm font-semibold text-charcoal shadow-warm-sm backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5"
          >
            <ShoppingBag size={16} />
            Shop Collection
          </Link>
          <Link
            href="/create"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-forest/20 bg-forest/8 px-6 text-sm font-semibold text-forest transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Sparkles size={16} />
            Create a Gift
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
