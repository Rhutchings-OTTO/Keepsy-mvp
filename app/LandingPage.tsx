"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/AuroraBackground";
import { DynamicLogo } from "@/components/DynamicLogo";
import RegionSelector from "@/components/RegionSelector";
import { HeroFloatersSimple } from "@/components/hero/HeroFloatersSimple";
import { Reveal } from "@/components/motion/Reveal";
import { RevealSplitText } from "@/components/motion/RevealSplitText";
import { ParallaxManifesto } from "@/components/ParallaxManifesto";
import { MouseGlow } from "@/components/MouseGlow";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { FF } from "@/lib/featureFlags";
import { getRegion, setRegion, type Region } from "@/lib/region";

const PremiumGateway = dynamic(
  () => import("@/components/PremiumGateway").then((mod) => mod.PremiumGateway),
  { ssr: false }
);

const CONTAINER = "w-full max-w-[420px] sm:max-w-[720px] lg:max-w-[960px] mx-auto px-5";

const CREATOR_TESTIMONIALS = [
  { name: "Sarah J.", quote: "The AI generated exactly what I was looking for! The t-shirt quality is superb.", initials: "SJ" },
  { name: "Marcus L.", quote: "Uploaded a photo of my dog and the AI turned it into a masterpiece on a mug.", initials: "ML" },
  { name: "Elena R.", quote: "Fast shipping and beautiful packaging. Will definitely order again.", initials: "ER" },
];

const GHOST_PROMPTS = [
  "A golden retriever in a Van Gogh style...",
  "Cozy family portrait in soft watercolors...",
  "Minimal line-art anniversary keepsake...",
];

function CommunityBentoGrid({
  testimonials,
}: {
  testimonials: Array<{ name: string; quote: string; initials: string }>;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const reduceMotion = useReducedMotion();
  const v1 = useTransform(scrollYProgress, [0, 0.3, 0.6], [0, -24, 0]);
  const v2 = useTransform(scrollYProgress, [0.1, 0.4, 0.7], [0, 18, 0]);
  const v3 = useTransform(scrollYProgress, [0.05, 0.35, 0.65], [0, -12, 0]);

  return (
    <section
      id="reviews"
      ref={ref}
      className="border-t border-[#1A1A1A]/5 bg-white/30 py-12 sm:py-16"
    >
      <div className="mx-auto w-full max-w-5xl px-5">
        <RevealSplitText
          text="What our creators say"
          as="h2"
          className="font-serif text-center text-xl font-bold tracking-tight sm:text-2xl"
        />
        <div
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
          role="region"
          aria-label="Customer testimonials"
        >
          <motion.article
            style={reduceMotion ? undefined : { y: v1 }}
            className="frosted-glass rounded-2xl p-5 lg:col-span-2 lg:row-span-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7DB9E8]/80 to-[#F8C8DC]/80 text-sm font-black text-white">
                {testimonials[0].initials}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="font-bold text-[#1A1A1A]">{testimonials[0].name}</p>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-[#1A1A1A]/70">&quot;{testimonials[0].quote}&quot;</p>
          </motion.article>
          <motion.article
            style={reduceMotion ? undefined : { y: v2 }}
            className="frosted-glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7DB9E8]/80 to-[#F8C8DC]/80 text-sm font-black text-white">
                {testimonials[1].initials}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="font-bold text-[#1A1A1A]">{testimonials[1].name}</p>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-[#1A1A1A]/70">&quot;{testimonials[1].quote}&quot;</p>
          </motion.article>
          <motion.article
            style={reduceMotion ? undefined : { y: v3 }}
            className="frosted-glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7DB9E8]/80 to-[#F8C8DC]/80 text-sm font-black text-white">
                {testimonials[2].initials}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="font-bold text-[#1A1A1A]">{testimonials[2].name}</p>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-[#1A1A1A]/70">&quot;{testimonials[2].quote}&quot;</p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function GhostPrompt({ prompts }: { prompts: string[] }) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"typing" | "idle" | "deleting">("typing");

  useEffect(() => {
    const text = prompts[index];
    if (phase === "typing") {
      if (display.length < text.length) {
        const t = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), 50);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("idle"), 800);
      return () => clearTimeout(t);
    }
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("deleting"), 2500);
      return () => clearTimeout(t);
    }
    if (phase === "deleting" && display.length > 0) {
      const t = setTimeout(() => setDisplay(display.slice(0, -1)), 30);
      return () => clearTimeout(t);
    }
    if (phase === "deleting" && display.length === 0) {
      const t = setTimeout(() => {
        setPhase("typing");
        setIndex((i) => (i + 1) % prompts.length);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [index, display, phase, prompts]);

  return <span className="animate-pulse">{display}</span>;
}

function HeroProductMockup({
  onMouseMove,
}: {
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]));
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]));

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
      onMouseMove?.(e);
    },
    [mouseX, mouseY, onMouseMove]
  );

  return (
    <div
      className="absolute inset-0 hidden lg:block"
      onMouseMove={handleMove}
      aria-hidden
    >
      <motion.div
        className="pointer-events-none absolute right-[-6%] top-1/2 -translate-y-1/2 xl:right-[-4%]"
        style={{
          rotateX,
          rotateY,
          transformPerspective: 800,
        }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-36 w-28 rounded-xl border border-[#1A1A1A]/10 bg-white/90 shadow-xl backdrop-blur-sm xl:h-44 xl:w-32">
          <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-[#7DB9E8]/25 to-[#F8C8DC]/25" />
        </div>
      </motion.div>
    </div>
  );
}

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const router = useRouter();
  const [region, setCurrentRegion] = useState<Region | null>(() => initialRegion ?? getRegion());
  const [showGateway, setShowGateway] = useState<boolean>(() => {
    const resolvedRegion = initialRegion ?? getRegion();
    return !resolvedRegion;
  });
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
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
    }, 800);
  };

  const handleSelectRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  const handleGatewayComplete = (nextRegion: Region) => {
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

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

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-hidden bg-ivory text-obsidian ${showGateway ? "h-screen fixed inset-0" : ""}`}
    >
      {showGateway ? (
        <PremiumGateway onComplete={handleGatewayComplete} />
      ) : (
        <>
          <div className="fixed inset-0 z-0">
            <AuroraBackground />
          </div>

          <button
            type="button"
            onClick={() => setIsRegionSelectorOpen(true)}
            className="fixed right-4 top-4 z-40 flex h-10 w-10 shrink-0 items-center justify-center rounded-full frosted-glass text-xs font-semibold text-[#1A1A1A]/80 transition hover:bg-white/50 sm:right-6 sm:top-6 sm:h-auto sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5"
            aria-label="Change region"
          >
            <span className="hidden sm:inline">{activeRegion} · Change</span>
            <span className="sm:hidden">{activeRegion}</span>
          </button>

          <motion.main
            ref={mainRef}
            style={FF.cinematicUX ? { y: heroY } : undefined}
            className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center py-12 sm:py-16"
          >
            <div className="absolute inset-0 z-0 mesh-gradient-bg" aria-hidden />
            <MouseGlow className="z-[1]" />
            <ParallaxManifesto
              text="MANIFESTO"
              speed={0.35}
              scrollTargetRef={mainRef}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]"
            />
            <div className={`relative z-30 w-full ${CONTAINER}`}>
              <Reveal variant="fadeUp" className="text-center">
                <div ref={heroTextRef} id="hero-safezone" className="hero-safe-zone flex flex-col items-center gap-6 sm:gap-8">
                  <div className="rounded-3xl frosted-glass px-8 py-6 sm:px-12 sm:py-8">
                    <DynamicLogo
                      href="/"
                      width={180}
                      className="block w-[170px] brightness-0 invert sm:w-[220px]"
                    />
                  </div>
                  <p className="mb-3 inline-block rounded-full bg-[#1A1A1A]/5 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-[#1A1A1A]/70">
                    AI-powered creativity
                  </p>
                  <h1 className="font-serif text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-tight sm:text-[clamp(2.25rem,6vw,4.5rem)]">
                    <RevealSplitText text="Imagine it. Generate it." as="span" className="block" />
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
                  <p className="mx-auto mt-4 max-w-md text-[15px] font-medium leading-relaxed text-[#1A1A1A]/65 sm:mt-5 sm:text-base">
                    Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
                  </p>

                  <div className="frosted-glass relative mt-6 w-full max-w-lg rounded-2xl px-4 py-3 sm:mt-8 sm:px-5 sm:py-4">
                    <span className="inline-block truncate text-left text-[15px] font-medium text-[#1A1A1A]/35 sm:text-base">
                      <GhostPrompt prompts={GHOST_PROMPTS} />
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
                    <MagneticButton
                      onClick={(event) => navigateWithRipple(event as React.MouseEvent<HTMLButtonElement>, "/create")}
                      className="h-12 w-full rounded-full bg-[#1A1A1A] px-6 text-base font-black text-white shadow-lg transition hover:bg-[#1A1A1A]/90 sm:w-auto"
                    >
                      Start creating
                    </MagneticButton>
                    <MagneticButton
                      onClick={(e) => navigateWithRipple(e as React.MouseEvent<HTMLButtonElement>, "/gift-ideas")}
                      className="h-12 w-full rounded-full border border-[#1A1A1A]/15 frosted-glass px-6 text-base font-bold text-[#1A1A1A] transition hover:bg-white/50 sm:w-auto"
                    >
                      Browse gift ideas
                    </MagneticButton>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="absolute inset-0 z-20">
              <HeroProductMockup onMouseMove={() => {}} />
            </div>

            <HeroFloatersSimple heroRef={mainRef} safeZoneRef={heroTextRef} />
          </motion.main>

          <CommunityBentoGrid testimonials={CREATOR_TESTIMONIALS} />

          <footer className="border-t border-[#1A1A1A]/10 bg-white/60 py-12 sm:py-16">
            <div className={CONTAINER}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8">
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-bold text-[#1A1A1A]">Keepsy</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#1A1A1A]/55">Turn your favorite memories into meaningful gifts in minutes.</p>
                </div>
                <div className="space-y-3">
                  <p className="font-semibold text-[#1A1A1A]">Company</p>
                  <div className="flex flex-col gap-3">
                    <Link href="/terms" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Terms of Artistry</Link>
                    <Link href="/privacy" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Privacy</Link>
                    <Link href="/refunds" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Refunds</Link>
                    <Link href="/shipping" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Shipping</Link>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="font-semibold text-[#1A1A1A]">Explore</p>
                  <div className="flex flex-col gap-3">
                    <Link href="/gift-ideas" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Gift ideas</Link>
                    <Link href="/create" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Create a gift</Link>
                    <Link href="/account" className="text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">Account</Link>
                  </div>
                </div>
              </div>
              <div className="mt-10 space-y-3 border-t border-[#1A1A1A]/5 pt-8">
                <p className="font-semibold text-[#1A1A1A]">Support</p>
                <a href="mailto:support@keepsy.store" className="block text-sm text-[#1A1A1A]/55 hover:text-[#1A1A1A]">support@keepsy.store</a>
                <p className="text-xs text-[#1A1A1A]/45">UK/US support available Monday–Sunday.</p>
              </div>
              <p className="mt-8 text-xs text-[#1A1A1A]/40">Powered by OpenAI & Stripe</p>
            </div>
          </footer>

          {ripple.active && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-[90] bg-[#F9F8F6]"
              initial={{ clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)` }}
              animate={{ clipPath: `circle(220vmax at ${ripple.x}px ${ripple.y}px)` }}
              transition={{ duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }}
            />
          )}

          <RegionSelector
            open={isRegionSelectorOpen}
            onSelect={(r) => {
              handleSelectRegion(r);
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
