"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Region } from "@/lib/region";
import { setRegion } from "@/lib/region";
import { DynamicLogo } from "@/components/DynamicLogo";

// NOTE (Phase 3 perf fix 3.5): The Three.js / @react-three/fiber cloud scene that
// previously ran here was replaced with a CSS-only animated cloud illusion.
// The original Canvas + CloudSceneWithPerf components ran a GPU-intensive WebGL
// render for every first-time visitor before the homepage was visible. The CSS
// version achieves the same warm atmospheric feel with zero JS animation overhead.

type PremiumGatewayProps = {
  onComplete: (region: Region) => void;
};

export function PremiumGateway({ onComplete }: PremiumGatewayProps) {
  const [phase, setPhase] = useState<"idle" | "washing" | "flying">("idle");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [washOrigin, setWashOrigin] = useState({ x: 0, y: 0 });

  const startTransition = (region: Region, event: React.MouseEvent) => {
    setSelectedRegion(region);
    setWashOrigin({ x: event.clientX, y: event.clientY });
    setPhase("washing");
    setTimeout(() => setPhase("flying"), 500);
    setTimeout(() => {
      setRegion(region);
      onComplete(region);
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] h-screen w-screen overflow-y-auto"
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      {/* ACT 1: Regional Selection — editorial boutique design */}
      {phase === "idle" && (
        <div className="relative flex min-h-full w-full flex-col items-center justify-center overflow-x-hidden px-5 py-12 sm:py-16">
          {/* Subtle warm background texture */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 15%, rgba(196,113,74,0.08) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 85% 85%, rgba(44,74,62,0.06) 0%, transparent 55%),
                radial-gradient(ellipse 40% 40% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 50%)
              `,
            }}
          />

          {/* Decorative thin horizontal rule top */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 h-px origin-left"
            style={{ backgroundColor: "var(--color-terracotta)", opacity: 0.3 }}
          />

          <div className="relative z-10 w-full max-w-3xl">
            {/* Logo — centered, prominent */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mb-10 flex justify-center"
            >
              <DynamicLogo href={null} width={160} className="text-charcoal" />
            </motion.div>

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-center text-[11px] font-bold uppercase tracking-[0.26em]"
              style={{ color: "var(--color-terracotta)" }}
            >
              Personalised keepsakes, made with love
            </motion.p>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 text-center font-serif font-bold tracking-[-0.05em] text-charcoal"
              style={{ fontSize: "clamp(1.75rem, 8vw, 4rem)" }}
            >
              Where Are We Shipping To?
            </motion.h1>

            {/* Subline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="mx-auto mt-4 max-w-sm text-center text-base leading-7 text-charcoal/55"
            >
              Choose your region for local pricing, shipping, and gifting occasions.
            </motion.p>

            {/* Thin divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="mx-auto mt-8 h-px w-12 origin-center"
              style={{ backgroundColor: "var(--color-terracotta)", opacity: 0.4 }}
            />

            {/* Region cards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 grid gap-4 sm:grid-cols-2"
            >
              <RegionCard
                region="UK"
                countryName="United Kingdom"
                currency="Shop in GBP · £"
                flag="🇬🇧"
                onSelect={(e) => startTransition("UK", e)}
              />
              <RegionCard
                region="US"
                countryName="United States"
                currency="Shop in USD · $"
                flag="🇺🇸"
                onSelect={(e) => startTransition("US", e)}
              />
            </motion.div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.65 }}
              className="mt-8 text-center text-xs text-charcoal/35"
            >
              Premium quality on every order · 30-day returns · Secure checkout
            </motion.p>
          </div>

          {/* Decorative bottom rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 right-0 h-px origin-right"
            style={{ backgroundColor: "var(--color-forest)", opacity: 0.2 }}
          />
        </div>
      )}

      {/* ACT 2: Color Wash - expands from click point */}
      <AnimatePresence>
        {phase === "washing" && selectedRegion && (
          <motion.div
            key="wash"
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ clipPath: `circle(0px at ${washOrigin.x}px ${washOrigin.y}px)` }}
            animate={{ clipPath: `circle(200vmax at ${washOrigin.x}px ${washOrigin.y}px)` }}
            transition={{ duration: 0.7, ease: [0.2, 0.9, 0.2, 1] }}
            style={{
              backgroundColor: selectedRegion === "UK" ? "#012169" : "#3C3B6E",
            }}
          />
        )}
      </AnimatePresence>

      {/* ACT 3: CSS Cloud Flight - replaces GPU-intensive Three.js canvas */}
      <AnimatePresence>
        {phase === "flying" && (
          <motion.div
            key="flying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-hidden"
            style={{ backgroundColor: "var(--color-cream)" }}
          >
            {/* CSS animated cloud blobs — simulates warm atmospheric depth */}
            <div className="absolute inset-0" aria-hidden>
              <div className="gateway-cloud-blob gateway-cloud-blob--1" />
              <div className="gateway-cloud-blob gateway-cloud-blob--2" />
              <div className="gateway-cloud-blob gateway-cloud-blob--3" />
              <div className="gateway-cloud-blob gateway-cloud-blob--4" />
              <div className="gateway-cloud-blob gateway-cloud-blob--5" />
            </div>

            {/* ACT 4: Cream fade-out — arrival at 2.5s */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-[51]"
              style={{ backgroundColor: "var(--color-cream)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ duration: 2.5, times: [0, 0.72, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Region Selection Card ────────────────────────────────────────────────────

type RegionCardProps = {
  region: Region;
  countryName: string;
  currency: string;
  flag: string;
  onSelect: (e: React.MouseEvent) => void;
};

function RegionCard({ region, countryName, currency, flag, onSelect }: RegionCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4, boxShadow: "0 20px 48px -20px rgba(196,113,74,0.22)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onSelect}
      aria-label={`Shop ${countryName}`}
      className="group relative flex w-full cursor-pointer flex-col items-start gap-5 overflow-hidden rounded-2xl border-2 bg-white p-6 text-left transition-colors"
      style={{ borderColor: "rgba(45,41,38,0.08)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-terracotta)";
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFAF6";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(45,41,38,0.08)";
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "white";
      }}
    >
      {/* Flag circle */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
        style={{ backgroundColor: region === "UK" ? "rgba(1,33,105,0.08)" : "rgba(60,59,110,0.08)" }}
      >
        {flag}
      </div>

      {/* Text */}
      <div className="flex-1">
        <h2 className="font-serif text-2xl font-bold tracking-[-0.03em] text-charcoal">
          {countryName}
        </h2>
        <p className="mt-1.5 text-sm text-charcoal/50">{currency}</p>
      </div>

      {/* Arrow indicator */}
      <div className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-charcoal/30 group-hover:text-terracotta transition-colors">
        <span>Continue</span>
        <span>→</span>
      </div>
    </motion.button>
  );
}
