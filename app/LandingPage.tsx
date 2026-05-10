"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Gift,
  ImageIcon,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { HeroPromptVisual } from "@/components/landing/HeroPromptVisual";
// Package, Printer, BadgeCheck, Truck, RotateCcw, Lock moved to TrustSection
import { DynamicLogo } from "@/components/DynamicLogo";
const RegionSelector = dynamic(
  () => import("@/components/RegionSelector"),
  { ssr: false }
);
import { getRegion, setRegion, type Region } from "@/lib/region";

const PremiumGateway = dynamic(
  () => import("@/components/PremiumGateway").then((mod) => mod.PremiumGateway),
  { ssr: false }
);

// Phase 3 fix 3.7 — lazy-load the two largest below-the-fold sections so their
// Framer Motion animations and icon bundles don't block the initial paint.
// These sections have no dependency on region or shared state.
const ReviewsSection = dynamic(
  () => import("@/components/landing/ReviewsSection").then((mod) => mod.ReviewsSection),
  { ssr: false }
);
const TrustSection = dynamic(
  () => import("@/components/landing/TrustSection").then((mod) => mod.TrustSection),
  { ssr: false }
);

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

// ─── Data ────────────────────────────────────────────────────────────────────

// PLACEHOLDER COUNT: "Over 500 thoughtful gift-givers" is a holding phrase
// awaiting real customer-count data. The exact wording must remain identical
// here and in the TrustSection heading — they reference the same number.
// Update both places together when real data is wired up.
const SOCIAL_PROOF_ITEMS = [
  "★★★★★  Over 500 thoughtful gift-givers",
  "🚀  Free Fast Shipping",
  "🌍  Made & Shipped with Love",
  "↩️  30-Day Returns",
  "🔒  Secure Checkout",
  "⚡  Fast US & UK Delivery",
];

// PLACEHOLDER REVIEW COUNTS: `displayReviews` are stand-in values until the
// real review feed is wired up. Update when real data is available.
// `isBestseller` flags the single best-selling product — only one item across
// this list should be true at a time. Currently set on the Personalised
// Greeting Card (highest review count of the four).
const FEATURED_PRODUCTS = [
  {
    name: "Custom Pet Portrait Mug",
    priceUS: "$19.99",
    priceUK: "£14.99",
    rating: "★★★★★",
    displayReviews: 47,
    isBestseller: false,
    src: "/images/collections/collection-pet-mug.png",
    alt: "Custom mug with a ginger cat portrait surrounded by flowers",
  },
  {
    name: "Personalised Greeting Card",
    priceUS: "$9.99",
    priceUK: "£6.99",
    rating: "★★★★★",
    displayReviews: 89,
    isBestseller: true,
    src: "/images/collections/collection-newbaby-card.png",
    alt: "Best Dad Already personalised greeting card for a new baby",
  },
  {
    name: "The Cozy Custom Hoodie",
    priceUS: "$56.99",
    priceUK: "£44.99",
    rating: "★★★★★",
    displayReviews: 23,
    isBestseller: false,
    src: "/images/collections/collection-wedding-hoodie.png",
    alt: "Custom wedding hoodie personalised with Jamie and Saida's names",
  },
  {
    name: "Personalised Friends T-Shirt",
    priceUS: "$37.99",
    priceUK: "£29.99",
    rating: "★★★★★",
    displayReviews: 12,
    isBestseller: false,
    src: "/images/collections/collection-friends-tshirt.png",
    alt: "Personalised t-shirt featuring four friends together",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    icon: ImageIcon,
    step: "01",
    title: "Choose Your Product",
    body: "Pick a mug, card, tee, or hoodie from our collection of beautiful keepsakes.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Make It Personal",
    body: "Upload a photo or describe your idea in plain words — no design skills needed.",
  },
  {
    icon: Gift,
    step: "03",
    title: "We Do the Rest",
    body: "We create the artwork, print it on premium materials, and ship it to your door.",
  },
];

// REVIEWS and TRUST_BADGES constants moved to their extracted components:
// - components/landing/ReviewsSection.tsx
// - components/landing/TrustSection.tsx

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeaturedProductCard({
  product,
  index,
  region,
}: {
  product: (typeof FEATURED_PRODUCTS)[0];
  index: number;
  region: Region;
}) {
  const [imgVisible, setImgVisible] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-charcoal/8 bg-white"
    >
      {/* Bestseller badge — only on the single bestseller */}
      {product.isBestseller && (
        <div
          className="absolute left-3 top-3 z-10 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
          style={{ backgroundColor: "var(--color-gold)" }}
        >
          Bestseller
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden bg-[#F5EDE0]" style={{ aspectRatio: "4/5" }}>
        {imgVisible ? (
          <Image
            src={product.src}
            alt={product.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgVisible(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag size={40} className="text-terracotta/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-serif text-base font-bold leading-tight text-charcoal sm:text-lg">
          {product.name}
        </p>
        <div className="mt-1.5 hidden items-center gap-1.5 sm:flex">
          <span className="text-sm" style={{ color: "var(--color-gold)" }}>{product.rating}</span>
          <span className="text-xs text-charcoal/45">({product.displayReviews})</span>
        </div>
        <div className="mt-auto pt-3">
          <span className="block text-base font-bold text-charcoal sm:text-lg">
            {region === "UK" ? product.priceUK : product.priceUS}
          </span>
          <Link
            href="/shop"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 sm:inline-flex sm:px-4"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Shop Now
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [region, setCurrentRegion] = useState<Region | null>(() => initialRegion ?? getRegion());
  const [showGateway, setShowGateway] = useState<boolean>(() => {
    const resolvedRegion = initialRegion ?? getRegion();
    return !resolvedRegion;
  });
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [footerShopOpen, setFooterShopOpen] = useState(false);
  const [footerCompanyOpen, setFooterCompanyOpen] = useState(false);
  const [footerHelpOpen, setFooterHelpOpen] = useState(false);

  const activeRegion = region ?? "US";

  useEffect(() => {
    if (showGateway) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showGateway]);

  const handleSelectRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  const handleGatewayComplete = (nextRegion: Region) => {
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!emailValue.trim() || emailLoading) return;
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      });
      const data = await res.json() as { success?: boolean; alreadySubscribed?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setEmailError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setEmailSubmitted(true);
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden text-charcoal ${
        showGateway ? "fixed inset-0 h-screen" : ""
      }`}
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      {showGateway ? (
        <PremiumGateway onComplete={handleGatewayComplete} />
      ) : (
        <>
          {/* ── Header ── */}
          <header className="relative z-30 border-b border-charcoal/8">
            <div className={`${CONTAINER} flex items-center justify-between py-4`}>
              <DynamicLogo href="/" width={140} className="text-charcoal" />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegionSelectorOpen(true)}
                  className="hidden rounded-full border border-charcoal/15 bg-transparent px-4 py-2 text-sm font-medium text-charcoal/70 transition hover:border-charcoal/30 sm:inline-flex"
                >
                  {activeRegion} shipping
                </button>
                <Link
                  href="/shop"
                  className="inline-flex min-h-[44px] items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </header>

          <main>
            {/* ── 1. HERO — personalisation-led split layout ── */}
            <section className="overflow-hidden">
              <div className={CONTAINER}>
                <div className="grid items-center gap-10 py-10 lg:min-h-[88vh] lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-24">
                  {/* Left: Headline + sub-head + CTAs */}
                  <motion.div
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: -28 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col"
                  >
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2">
                      <div className="h-px w-8" style={{ backgroundColor: "var(--color-terracotta)" }} />
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: "var(--color-terracotta)" }}
                      >
                        One-of-a-Kind, Made With Care
                      </span>
                    </div>

                    {/* Main headline */}
                    <h1
                      className="mt-5 text-balance font-serif font-black leading-[0.97] tracking-[-0.04em] text-charcoal"
                      style={{ fontSize: "clamp(2.2rem, 5.6vw, 4.6rem)" }}
                    >
                      Describe the gift.<br />
                      We&apos;ll make it real.
                    </h1>

                    <p className="mt-5 max-w-md text-base leading-7 text-charcoal/65 sm:text-[17px] sm:leading-8">
                      Type your idea, see it on a hoodie, mug, or canvas, then order the one you love. No design skills needed.
                    </p>

                    {/* CTAs — primary CREATE, secondary BROWSE */}
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        href="/create"
                        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold text-white shadow-[0_12px_28px_-12px_rgba(196,113,74,0.55)] transition-all hover:shadow-[0_16px_36px_-14px_rgba(196,113,74,0.65)] hover:-translate-y-0.5"
                        style={{ backgroundColor: "var(--color-terracotta)" }}
                      >
                        Start creating
                        <ArrowRight size={17} />
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-7 text-base font-semibold text-charcoal transition-all hover:-translate-y-0.5"
                        style={{ borderColor: "var(--color-charcoal)" }}
                      >
                        Browse the shop
                        <ShoppingBag size={16} />
                      </Link>
                    </div>

                    {/* Trust microcopy below CTAs */}
                    <p className="mt-5 flex items-center gap-2 text-sm text-charcoal/60">
                      <span style={{ color: "var(--color-gold)" }}>★★★★★</span>
                      Real reviews from real gift-givers
                    </p>
                  </motion.div>

                  {/* Right: Visual prompt-input hook (routes to /create) */}
                  <motion.div
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: 28 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <HeroPromptVisual />
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ── 2. Social proof marquee — TERRACOTTA background ── */}
            <section
              className="overflow-hidden py-4"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              <style>{`
                @keyframes marquee-run {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .marquee-run {
                  display: flex;
                  width: max-content;
                  animation: marquee-run 22s linear infinite;
                }
                .marquee-run:hover { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) {
                  .marquee-run { animation: none; }
                }
              `}</style>
              <div className="marquee-run">
                {[...SOCIAL_PROOF_ITEMS, ...SOCIAL_PROOF_ITEMS].map((item, i) => (
                  <span
                    key={i}
                    className="px-8 text-sm font-semibold text-white"
                  >
                    {item}
                    <span className="mx-8 text-white/30">·</span>
                  </span>
                ))}
              </div>
            </section>

            {/* ── 3. Featured Products ── */}
            <section className="py-16 sm:py-24">
              <div className={CONTAINER}>
                <div className="flex items-end justify-between">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      The Collection
                    </p>
                    <h2 className="mt-2 text-balance font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
                      Most Loved This Month
                    </h2>
                  </motion.div>
                  <Link
                    href="/shop"
                    className="hidden items-center gap-1.5 text-sm font-semibold text-charcoal/60 transition hover:text-charcoal sm:flex"
                  >
                    View all <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {FEATURED_PRODUCTS.map((product, i) => (
                    <FeaturedProductCard
                      key={product.name}
                      product={product}
                      index={i}
                      region={activeRegion}
                    />
                  ))}
                </div>

                <div className="mt-6 sm:hidden">
                  <Link
                    href="/shop"
                    className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-charcoal/60"
                  >
                    View all products <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </section>

            {/* ── 4. How It Works — editorial numbered list ── */}
            <section className="py-16 sm:py-24">
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: "var(--color-terracotta)" }}
                  >
                    The Process
                  </p>
                  <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
                    Three Simple Steps
                  </h2>
                </motion.div>

                <div className="mt-8 space-y-0 sm:mt-14">
                  {HOW_IT_WORKS_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
                        className="grid grid-cols-[auto_1fr] gap-5 border-b border-charcoal/10 py-6 last:border-0 sm:gap-8 sm:py-8 lg:grid-cols-[120px_1fr_auto] lg:items-center"
                      >
                        {/* Step number */}
                        <span
                          className="font-serif text-4xl font-bold leading-none sm:text-5xl"
                          style={{ color: "rgba(196,113,74,0.25)", minWidth: "2.5rem" }}
                        >
                          {step.step}
                        </span>

                        {/* Content */}
                        <div>
                          <h3 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">
                            {step.title}
                          </h3>
                          <p className="mt-2 max-w-md text-base leading-7 text-charcoal/60">
                            {step.body}
                          </p>
                        </div>

                        {/* Icon */}
                        <div
                          className="hidden h-14 w-14 items-center justify-center rounded-xl lg:flex"
                          style={{ backgroundColor: "rgba(196,113,74,0.10)" }}
                        >
                          <Icon size={24} style={{ color: "var(--color-terracotta)" }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 5. Reviews — lazy-loaded (Phase 3 fix 3.7) ── */}
            <ReviewsSection />

            {/* ── 6. Trust Grid — lazy-loaded (Phase 3 fix 3.7) ── */}
            <TrustSection />

            {/* ── 7. Email capture — forest green ── */}
            <section
              className="py-16 sm:py-24"
              style={{ backgroundColor: "var(--color-forest)" }}
            >
              <div className={CONTAINER}>
                <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">
                      Join the Keepsy Family
                    </p>
                    <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                      Get 10% Off<br />Your First Order
                    </h2>
                    <p className="mt-4 hidden max-w-sm text-base leading-7 text-white/65 sm:block">
                      Plus gifting ideas, new designs &amp; seasonal inspiration — delivered to your inbox.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                    className="w-full lg:w-[400px]"
                  >
                    <AnimatePresence mode="wait">
                      {emailSubmitted ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-xl border border-white/15 bg-white/10 px-8 py-6 text-center text-lg font-semibold text-white"
                        >
                          🎉 You&apos;re in! Check your inbox for your code.
                        </motion.div>
                      ) : (
                        <motion.form
                          key="form"
                          onSubmit={(e) => { void handleEmailSubmit(e); }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              type="email"
                              required
                              value={emailValue}
                              onChange={(e) => setEmailValue(e.target.value)}
                              placeholder="Your email address"
                              aria-label="Email address for 10% discount"
                              className="flex-1 rounded-xl border-0 bg-white/10 px-5 py-3.5 text-white placeholder-white/65 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                            <button
                              type="submit"
                              disabled={emailLoading}
                              className="min-h-[44px] whitespace-nowrap rounded-xl px-6 py-3.5 font-semibold text-charcoal shadow-[0_10px_24px_-12px_rgba(201,168,76,0.6)] transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                              style={{ backgroundColor: "var(--color-gold)" }}
                            >
                              {emailLoading ? "Sending…" : "Claim 10% Off"}
                            </button>
                          </div>
                          {emailError && (
                            <p className="rounded-lg border border-red-300/40 bg-red-900/20 px-4 py-2 text-sm text-red-200">
                              {emailError}
                            </p>
                          )}
                        </motion.form>
                      )}
                    </AnimatePresence>
                    <p className="mt-3 hidden text-xs text-white/40 sm:block">
                      Join the people who love thoughtful gifting · Unsubscribe anytime
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>
          </main>

          {/* ── Footer — hidden while gateway is shown so it doesn't bleed through on mobile ── */}
          {!showGateway && <footer className="py-10 sm:py-14" style={{ backgroundColor: "var(--color-charcoal)" }}>
            <div className={CONTAINER}>
              {/* Brand info — always visible */}
              <div className="mb-6 sm:mb-0">
                <p className="font-serif text-2xl font-bold text-white">Keepsy</p>
                <p className="mt-2 text-sm text-white/80">
                  Beautiful personalised gifts, made simple.
                </p>
                <p className="mt-3 text-xs text-white/65">
                  🇬🇧 UK &amp; 🇺🇸 US shipping · Made with care
                </p>
              </div>

              {/* Link columns — accordion on mobile, grid on sm+ */}
              <div className="mt-6 divide-y divide-white/8 sm:mt-8 sm:divide-y-0 sm:grid sm:grid-cols-3 sm:gap-8 lg:grid-cols-3">
                {/* Shop */}
                <div className="py-3 sm:py-0">
                  <button
                    type="button"
                    onClick={() => setFooterShopOpen(!footerShopOpen)}
                    className="flex w-full items-center justify-between sm:pointer-events-none"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#D4A853" }}>Shop</p>
                    <span className="sm:hidden" style={{ color: "rgba(255,255,255,0.65)" }}>{footerShopOpen ? "−" : "+"}</span>
                  </button>
                  <div className={`mt-3 flex-col gap-2.5 ${footerShopOpen ? "flex" : "hidden"} sm:flex`}>
                    {[
                      { href: "/shop", label: "All Products" },
                      { href: "/gift-ideas", label: "Gift Ideas" },
                      { href: "/create", label: "Design a Gift" },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-sm transition" style={{ color: "#F0EDE8" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Company */}
                <div className="py-3 sm:py-0">
                  <button
                    type="button"
                    onClick={() => setFooterCompanyOpen(!footerCompanyOpen)}
                    className="flex w-full items-center justify-between sm:pointer-events-none"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#D4A853" }}>Company</p>
                    <span className="sm:hidden" style={{ color: "rgba(255,255,255,0.65)" }}>{footerCompanyOpen ? "−" : "+"}</span>
                  </button>
                  <div className={`mt-3 flex-col gap-2.5 ${footerCompanyOpen ? "flex" : "hidden"} sm:flex`}>
                    {[
                      { href: "/community", label: "Customer Stories" },
                      { href: "/terms", label: "Terms" },
                      { href: "/privacy", label: "Privacy" },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-sm transition" style={{ color: "#F0EDE8" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Help */}
                <div className="py-3 sm:py-0">
                  <button
                    type="button"
                    onClick={() => setFooterHelpOpen(!footerHelpOpen)}
                    className="flex w-full items-center justify-between sm:pointer-events-none"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#D4A853" }}>Help</p>
                    <span className="sm:hidden" style={{ color: "rgba(255,255,255,0.65)" }}>{footerHelpOpen ? "−" : "+"}</span>
                  </button>
                  <div className={`mt-3 flex-col gap-2.5 ${footerHelpOpen ? "flex" : "hidden"} sm:flex`}>
                    {[
                      { href: "/shipping", label: "Shipping" },
                      { href: "/refunds", label: "Refunds" },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-sm transition" style={{ color: "#F0EDE8" }}>
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsRegionSelectorOpen(true)}
                      className="text-left text-sm transition" style={{ color: "#F0EDE8" }}
                    >
                      {activeRegion} shipping ↗
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs text-white/55">
                  © {new Date().getFullYear()} Keepsy Ltd. All rights reserved.
                </p>
                <p className="text-xs text-white/50">
                  Payments by Stripe · Printing by Printify
                </p>
              </div>
            </div>
          </footer>}

          {/* ── Region Selector ── */}
          <RegionSelector
            open={isRegionSelectorOpen}
            onSelect={(nextRegion) => {
              handleSelectRegion(nextRegion);
              setIsRegionSelectorOpen(false);
            }}
            onClose={region ? () => setIsRegionSelectorOpen(false) : undefined}
            currentRegion={activeRegion}
          />
        </>
      )}
    </div>
  );
}
