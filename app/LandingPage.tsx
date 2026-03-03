"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import IridescenceBackground from "@/components/IridescenceBackground";
import RegionSelector from "@/components/RegionSelector";
import { HeroFloatingCards } from "@/components/HeroFloatingCards";
import { useFloaterCapacity } from "@/components/hero/useFloaterCapacity";
import { FLOATER_POOL_SIZE } from "@/components/hero/floaterPool";
import { Reveal } from "@/components/motion/Reveal";
import { FF } from "@/lib/featureFlags";
import { getRegion, setRegion, type Region } from "@/lib/region";

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const router = useRouter();
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
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
  const floaterLayout = useFloaterCapacity(mainRef, heroTextRef, FLOATER_POOL_SIZE);
  const pointerScale = useMemo(() => (isHovered ? 1 : 0.45), [isHovered]);
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const heroY = useTransform(scrollY, [0, 400], [0, -28]);
  const cardsY = useTransform(scrollY, [0, 400], [0, -42]);
  const logoTabletY = useTransform(scrollY, [0, 200], [0, -6]);
  const activeRegion = region ?? "UK";
  // Do not add region-specific sections here; region content is only rendered on the generation page.

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
    <div
      className="relative flex min-h-screen flex-col overflow-hidden text-[#23211F]"
      onMouseMove={(event) => {
        const { innerWidth, innerHeight } = window;
        const x = ((event.clientX / innerWidth) * 100 - 50) * pointerScale;
        const y = ((event.clientY / innerHeight) * 100 - 50) * pointerScale;
        setCursorOffset({ x, y });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IridescenceBackground />

      <header className="relative z-20 flex w-full items-center justify-between px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-24 shrink-0 sm:w-40" />
        <motion.div
          className="logo-glass-tablet relative z-20 flex min-w-0 max-w-fit shrink-0 items-center justify-center rounded-[24px] px-5 py-3 sm:px-6 sm:py-4"
          style={FF.cinematicUX && !reduceMotion ? { y: logoTabletY } : undefined}
          whileHover={!reduceMotion ? { scale: 1.02 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Image
            src="/keepsy-logo-transparent.png"
            alt="Keepsy"
            width={760}
            height={220}
            className="h-44 w-auto object-contain sm:h-48"
          />
        </motion.div>
        <button
          type="button"
          onClick={() => setIsRegionSelectorOpen(true)}
          className="shrink-0 rounded-full border border-black/15 bg-white/75 px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-white"
        >
          {activeRegion} · Change region
        </button>
      </header>

      <motion.main
        ref={mainRef}
        style={FF.cinematicUX ? { y: heroY } : undefined}
        className="relative z-10 mx-auto flex min-h-0 flex-1 w-full max-w-7xl flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8"
      >
        <Reveal variant="fadeUp" className="relative z-30 max-w-5xl text-center">
          <div ref={heroTextRef} className="hero-safe-zone">
          <p className="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-indigo-600 sm:mb-4">
            AI-powered creativity
          </p>
          <h1 className="text-[clamp(2rem,6vw,4.5rem)] font-black leading-[1.05] sm:text-[clamp(2.5rem,7vw,5rem)] md:text-[clamp(3rem,8vw,5.5rem)]">
            Imagine it. Generate it.
            <br />
            <motion.span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)",
                backgroundSize: "220% auto",
              }}
              animate={{
                backgroundSize: ["220% auto", "240% auto", "220% auto"],
                backgroundPosition: ["0% center", "100% center", "0% center"],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              Cherish it.
            </motion.span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-[clamp(0.95rem,2vw,1.25rem)] font-medium leading-relaxed text-black/60 sm:mt-5 md:mt-6">
            Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
          </p>
          <div className={`mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:mt-8 ${floaterLayout.compactMode ? "sm:mt-6" : "md:mt-10"}`}>
            <button
              onClick={(event) => navigateWithRipple(event, "/create")}
              className="rounded-2xl bg-black px-6 py-3 text-base font-black text-white shadow-lg transition hover:bg-black/90"
            >
              Start creating
            </button>
            <button
              onClick={() => router.push("/gift-ideas")}
              className="rounded-2xl border border-black/15 bg-white/80 px-6 py-3 text-base font-bold text-black transition hover:bg-white"
            >
              Browse gift ideas
            </button>
          </div>
          </div>
        </Reveal>

        <HeroFloatingCards
          layout={floaterLayout}
          cursorOffset={cursorOffset}
          cardsY={cardsY}
          reduceMotion={reduceMotion ?? false}
          heroRef={mainRef}
          safeZoneRef={heroTextRef}
        />
      </motion.main>

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
