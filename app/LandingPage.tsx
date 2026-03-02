"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import IridescenceBackground from "@/components/IridescenceBackground";
import RegionSelector from "@/components/RegionSelector";
import { HeroFloatingCards } from "@/components/HeroFloatingCards";
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
      className="relative min-h-screen overflow-hidden text-[#23211F]"
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

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:px-6">
        <div className="w-24 sm:w-40" />
        <motion.div
          className="logo-glass-tablet relative z-30 flex min-w-0 max-w-[min(90vw,520px)] shrink-0 items-center justify-center rounded-[26px] px-6 py-4 sm:px-10 sm:py-6"
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
          className="rounded-full border border-black/15 bg-white/75 px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-white"
        >
          {activeRegion} · Change region
        </button>
      </header>

      <motion.main
        ref={mainRef}
        style={FF.cinematicUX ? { y: heroY } : undefined}
        className="relative z-10 mx-auto flex min-h-[82vh] max-w-7xl items-center justify-center px-6 pb-14"
      >
        <Reveal variant="fadeUp" className="relative z-20 max-w-5xl text-center">
          <div ref={heroTextRef}>
          <p className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-indigo-600">
            AI-powered creativity
          </p>
          <h1 className="text-5xl font-black leading-[1.05] md:text-7xl">
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
          <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-black/60">
            Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
          textRef={heroTextRef}
          containerRef={mainRef}
          cursorOffset={cursorOffset}
          cardsY={cardsY}
          reduceMotion={reduceMotion ?? false}
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
