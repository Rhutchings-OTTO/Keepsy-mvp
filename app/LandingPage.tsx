"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import IridescenceBackground from "@/components/IridescenceBackground";
import RegionSelector from "@/components/RegionSelector";
import { HeroFloatersSimple } from "@/components/hero/HeroFloatersSimple";
import { Reveal } from "@/components/motion/Reveal";
import { FF } from "@/lib/featureFlags";
import { getRegion, setRegion, type Region } from "@/lib/region";

const CONTAINER = "w-full max-w-[420px] sm:max-w-[720px] lg:max-w-[960px] mx-auto px-5";

const CREATOR_TESTIMONIALS = [
  { name: "Sarah J.", quote: "The AI generated exactly what I was looking for! The t-shirt quality is superb.", initials: "SJ" },
  { name: "Marcus L.", quote: "Uploaded a photo of my dog and the AI turned it into a masterpiece on a mug.", initials: "ML" },
  { name: "Elena R.", quote: "Fast shipping and beautiful packaging. Will definitely order again.", initials: "ER" },
];

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const router = useRouter();
  const [region, setCurrentRegion] = useState<Region | null>(() => initialRegion ?? getRegion());
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState<boolean>(() => {
    const resolvedRegion = initialRegion ?? getRegion();
    return !resolvedRegion;
  });
  const [ripple, setRipple] = useState<{ active: boolean; x: number; y: number; to: string }>({
    active: false,
    x: 0,
    y: 0,
    to: "/create",
  });
  const heroTextRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const heroY = useTransform(scrollY, [0, 400], [0, -28]);
  const activeRegion = region ?? "UK";

  const navigateWithRipple = (event: React.MouseEvent<HTMLButtonElement>, to: string) => {
    const x = event.clientX;
    const y = event.clientY;
    setRipple({ active: true, x, y, to });
    window.setTimeout(() => {
      router.push(to);
    }, 420);
  };

  const handleSelectRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    setCurrentRegion(nextRegion);
    setIsRegionSelectorOpen(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-[#23211F]">
      <IridescenceBackground />

      {/* Region selector: pinned top-right, separate from logo */}
      <button
        type="button"
        onClick={() => setIsRegionSelectorOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/80 backdrop-blur-md text-xs font-semibold text-black/80 transition hover:bg-white sm:right-6 sm:top-6 sm:h-auto sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5"
        aria-label="Change region"
      >
        <span className="hidden sm:inline">{activeRegion} · Change</span>
        <span className="sm:hidden">{activeRegion}</span>
      </button>

      {/* Hero */}
      <motion.main
        ref={mainRef}
        style={FF.cinematicUX ? { y: heroY } : undefined}
        className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center py-12 sm:py-16"
      >
        <div className={`relative z-30 w-full ${CONTAINER}`}>
          <Reveal variant="fadeUp" className="text-center">
            <div ref={heroTextRef} id="hero-safezone" className="hero-safe-zone flex flex-col items-center gap-6 sm:gap-8">
              {/* Logo tablet: white logo in glass morphism container */}
              <div className="rounded-3xl border border-white/20 bg-white/15 px-8 py-6 shadow-lg shadow-black/10 backdrop-blur-md sm:px-12 sm:py-8">
                <Link href="/" className="block" aria-label="Keepsy homepage">
                  <Image
                    src="/keepsy-logo-transparent.png"
                    alt="Keepsy"
                    width={240}
                    height={80}
                    className="h-auto w-[170px] brightness-0 invert sm:w-[220px]"
                  />
                </Link>
              </div>
              <p className="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-indigo-600">
                AI-powered creativity
              </p>
              <h1 className="text-[clamp(1.75rem,5vw,3.5rem)] font-black leading-[1.08] sm:text-[clamp(2.25rem,6vw,4.5rem)]">
                Imagine it. Generate it.
                <br />
                <motion.span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)",
                    backgroundSize: "220% auto",
                  }}
                  animate={
                    !reduceMotion
                      ? {
                          backgroundSize: ["220% auto", "240% auto", "220% auto"],
                          backgroundPosition: ["0% center", "100% center", "0% center"],
                        }
                      : undefined
                  }
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  Cherish it.
                </motion.span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] font-medium leading-relaxed text-black/60 sm:mt-5 sm:text-base">
                Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
                <button
                  onClick={(event) => navigateWithRipple(event, "/create")}
                  className="h-12 w-full rounded-full bg-black px-6 text-base font-black text-white shadow-lg transition hover:bg-black/90 sm:w-auto"
                >
                  Start creating
                </button>
                <button
                  onClick={() => router.push("/gift-ideas")}
                  className="h-12 w-full rounded-full border border-black/15 bg-white/80 px-6 text-base font-bold text-black transition hover:bg-white sm:w-auto"
                >
                  Browse gift ideas
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        <HeroFloatersSimple heroRef={mainRef} safeZoneRef={heroTextRef} />
      </motion.main>

      {/* Testimonials: scroll-snap, no arrows on mobile */}
      <section id="reviews" className="border-t border-black/5 bg-white/30 py-12 sm:py-16">
        <div className={CONTAINER}>
          <h2 className="text-center text-xl font-black sm:text-2xl">What our creators say</h2>
          <div
            className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="region"
            aria-label="Customer testimonials"
          >
            {CREATOR_TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="min-w-[85%] flex-shrink-0 snap-center rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm sm:min-w-[45%] lg:min-w-[30%]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7DB9E8]/80 to-[#F8C8DC]/80 text-sm font-black text-white">
                    {t.initials}
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="font-bold text-black">{t.name}</p>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-black/70">&quot;{t.quote}&quot;</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer: 2-col grid */}
      <footer className="border-t border-black/10 bg-white/60 py-12 sm:py-16">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8">
            <div className="col-span-2 sm:col-span-1">
              <p className="font-bold text-black">Keepsy</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">Turn your favorite memories into meaningful gifts in minutes.</p>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-black">Company</p>
              <div className="flex flex-col gap-3">
                <Link href="/terms" className="text-sm text-neutral-500 hover:text-black">Terms</Link>
                <Link href="/privacy" className="text-sm text-neutral-500 hover:text-black">Privacy</Link>
                <Link href="/refunds" className="text-sm text-neutral-500 hover:text-black">Refunds</Link>
                <Link href="/shipping" className="text-sm text-neutral-500 hover:text-black">Shipping</Link>
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-black">Explore</p>
              <div className="flex flex-col gap-3">
                <Link href="/gift-ideas" className="text-sm text-neutral-500 hover:text-black">Gift ideas</Link>
                <Link href="/create" className="text-sm text-neutral-500 hover:text-black">Create a gift</Link>
                <Link href="/account" className="text-sm text-neutral-500 hover:text-black">Account</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 space-y-3 border-t border-black/5 pt-8">
            <p className="font-semibold text-black">Support</p>
            <a href="mailto:support@keepsy.store" className="block text-sm text-neutral-500 hover:text-black">support@keepsy.store</a>
            <p className="text-xs text-neutral-500">UK/US support available Monday–Sunday.</p>
          </div>
          <p className="mt-8 text-xs text-neutral-400">Powered by OpenAI & Stripe</p>
        </div>
      </footer>

      {ripple.active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] bg-[#F7F1EB]"
          initial={{ clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)` }}
          animate={{ clipPath: `circle(220vmax at ${ripple.x}px ${ripple.y}px)` }}
          transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
        />
      )}

      <RegionSelector
        open={isRegionSelectorOpen}
        onSelect={handleSelectRegion}
        onClose={region ? () => setIsRegionSelectorOpen(false) : undefined}
      />
    </div>
  );
}
