"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

type OrderSuccessProps = {
  productName: string;
  designUrl?: string | null;
};

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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* 3D Spotlight Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mb-12 flex aspect-square w-full max-w-lg items-center justify-center rounded-full bg-gradient-to-b from-white/20 to-transparent shadow-[0_0_100px_rgba(0,0,0,0.05)]"
      >
        {designUrl ? (
          <img
            src={designUrl}
            alt="Your Creation"
            className="h-64 w-64 rotate-12 object-contain drop-shadow-2xl"
          />
        ) : (
          <div className="h-64 w-64 rotate-12 rounded-2xl bg-charcoal/5" />
        )}
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-4 font-serif text-5xl text-charcoal"
      >
        Masterpiece Confirmed.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mb-12 max-w-sm text-charcoal/60"
      >
        Your 1-of-1 {productName} has been sent to our atelier for production.
        Expect a digital update as it takes physical form.
      </motion.p>

      {/* The Gallery Plaque */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center rounded-2xl border border-white/65 bg-white/70 p-8 shadow-xl backdrop-blur-xl"
      >
        <span className="mb-4 text-[10px] uppercase tracking-[0.4em] text-charcoal/40">
          Official Artifact
        </span>
        <div className="mb-6 h-px w-12 bg-charcoal/8" />
        <p className="mb-1 font-serif text-xl italic">&quot;Keepsy No. 8421&quot;</p>
        <p className="text-xs text-charcoal/40">Secured & Registered</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 flex flex-wrap justify-center gap-3"
      >
        <MagneticLink
          href="/create"
          className="rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-terra-glow transition hover:opacity-90 inline-block"
        >
          Create another design
        </MagneticLink>
        <MagneticLink
          href="/gift-ideas"
          className="rounded-full border border-charcoal/15 px-6 py-3 font-bold text-charcoal transition hover:bg-charcoal/5 inline-block"
        >
          Browse gift ideas
        </MagneticLink>
      </motion.div>
    </div>
  );
}
