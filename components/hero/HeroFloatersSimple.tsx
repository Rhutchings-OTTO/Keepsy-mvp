"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FloaterCard } from "@/components/hero/FloaterCard";
import { FLOATER_POOL_SIMPLE } from "@/components/hero/floaterPoolSimple";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type SizeClass = "large" | "medium" | "small";

const SIZE_WIDTH: Record<SizeClass, number> = {
  large: 220,
  medium: 190,
  small: 160,
};

const PARALLAX_STRENGTH: Record<SizeClass, number> = {
  large: 14,
  medium: 10,
  small: 6,
};

const CARD_ASPECT = 200 / 190;

function getTargetCount(width: number): number {
  if (width >= 1200) return 13;
  if (width >= 900) return 10;
  if (width >= 600) return 7;
  return 3;
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  gap: number
): boolean {
  const g = gap / 2;
  return !(
    a.x + a.w + g <= b.x - g ||
    b.x + b.w + g <= a.x - g ||
    a.y + a.h + g <= b.y - g ||
    b.y + b.h + g <= a.y - g
  );
}

type PlacedFloater = {
  item: (typeof FLOATER_POOL_SIMPLE)[number];
  x: number;
  y: number;
  w: number;
  h: number;
  sizeClass: SizeClass;
  parallaxStrength: number;
};

type HeroFloatersSimpleProps = {
  heroRef: React.RefObject<HTMLElement | null>;
  safeZoneRef: React.RefObject<HTMLElement | null>;
};

export function HeroFloatersSimple({ heroRef, safeZoneRef }: HeroFloatersSimpleProps) {
  const searchParams = useSearchParams();
  const debugFloaters = searchParams?.get("debugFloaters") === "1";
  const reduceMotion = useReducedMotionPref();

  const [placed, setPlaced] = useState<PlacedFloater[]>([]);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [heroCenter, setHeroCenter] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const heroEl = heroRef?.current;
    const safeEl = safeZoneRef?.current;
    if (!heroEl || !safeEl) return;

    const run = () => {
      const heroRect = heroEl.getBoundingClientRect();
      const safeRect = safeEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const isMobile = vw < 640;
      const margin = isMobile ? 40 : 28;

      const safeExpanded = {
        left: safeRect.left - heroRect.left - margin,
        top: safeRect.top - heroRect.top - margin,
        right: safeRect.right - heroRect.left + margin,
        bottom: safeRect.bottom - heroRect.top + margin,
      };

      const heroW = heroRect.width;
      const heroH = heroRect.height;
      const headerBand = 80;
      const pad = 12;
      const gap = 14;

      const targetCount = getTargetCount(vw);
      const pool = [...FLOATER_POOL_SIMPLE];
      const rng = seededRandom(42);

      const sizeClasses: SizeClass[] = ["large", "large", "medium", "medium", "medium", "medium", "medium", "small", "small", "small", "small", "small"];
      const placedRects: { x: number; y: number; w: number; h: number }[] = [];
      const result: PlacedFloater[] = [];

      for (let i = 0; i < targetCount && i < pool.length; i++) {
        const item = pool[i];
        const sizeClass = sizeClasses[i % sizeClasses.length] ?? "medium";
        const w = SIZE_WIDTH[sizeClass];
        const h = w / CARD_ASPECT;

        let found = false;
        for (let attempt = 0; attempt < 80 && !found; attempt++) {
          const x = pad + rng() * (heroW - w - pad * 2);
          const y = headerBand + pad + rng() * (heroH - h - headerBand - pad * 2);

          if (y + h > heroH - pad || x + w > heroW - pad) continue;

          const rect = { x, y, w, h };

          if (x + w > safeExpanded.left && x < safeExpanded.right && y + h > safeExpanded.top && y < safeExpanded.bottom) continue;

          if (placedRects.some((p) => rectsOverlap(rect, p, gap))) continue;

          placedRects.push(rect);
          result.push({
            item,
            x,
            y,
            w,
            h,
            sizeClass,
            parallaxStrength: PARALLAX_STRENGTH[sizeClass],
          });
          found = true;
        }
      }

      setPlaced(result);
      setHeroCenter({ x: heroRect.left + heroRect.width / 2, y: heroRect.top + heroRect.height / 2 });
    };

    const schedule = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        run();
        rafRef.current = null;
      });
    };

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    if (ro) {
      ro.observe(heroEl);
      ro.observe(safeEl);
    }
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heroRef, safeZoneRef]);

  useEffect(() => {
    const heroEl = heroRef?.current;
    if (!heroEl) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (reduceMotion) return;
      const rect = heroEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = ((e.clientX - cx) / rect.width) * 100;
      const ny = ((e.clientY - cy) / rect.height) * 100;
      setMouseOffset({ x: nx, y: ny });
    };

    const handlePointerLeave = () => setMouseOffset({ x: 0, y: 0 });

    heroEl.addEventListener("pointermove", handlePointerMove);
    heroEl.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      heroEl.removeEventListener("pointermove", handlePointerMove);
      heroEl.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [heroRef, reduceMotion]);

  if (placed.length === 0) return null;

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {placed.map((p, i) => (
          <div
            key={p.item.id}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              width: p.w,
              height: p.h,
              transform: reduceMotion ? undefined : `translate3d(${mouseOffset.x * (p.parallaxStrength / 50)}px, ${mouseOffset.y * (p.parallaxStrength / 50)}px, 0)`,
            }}
          >
            <motion.div
              className="h-full w-full"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, i % 2 === 0 ? -4 : 4, 0],
                      transition: { duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" },
                    }
              }
            >
              <FloaterCard
                image={p.item.imageSrc}
                alt={p.item.title}
                title={p.item.title}
                subtitle={p.item.subtitle}
                className="h-full w-full min-w-0 border-black/10 bg-white/80"
              />
            </motion.div>
          </div>
        ))}
      </div>

      {debugFloaters && (
        <DebugOverlay heroRef={heroRef} safeZoneRef={safeZoneRef} placedCount={placed.length} />
      )}
    </>
  );
}

function DebugOverlay({
  heroRef,
  safeZoneRef,
  placedCount,
}: {
  heroRef: React.RefObject<HTMLElement | null>;
  safeZoneRef: React.RefObject<HTMLElement | null>;
  placedCount: number;
}) {
  const [rects, setRects] = useState<{ safeLeft: number; safeTop: number; safeW: number; safeH: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const heroEl = heroRef?.current;
    const safeEl = safeZoneRef?.current;
    if (!heroEl || !safeEl) return;
    const heroRect = heroEl.getBoundingClientRect();
    const safeRect = safeEl.getBoundingClientRect();
    setRects({
      safeLeft: safeRect.left - heroRect.left - 28,
      safeTop: safeRect.top - heroRect.top - 28,
      safeW: safeRect.width + 56,
      safeH: safeRect.height + 56,
    });
  }, [heroRef, safeZoneRef, placedCount]);

  if (!rects) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50" aria-hidden>
      <div
        className="absolute border-2 border-dashed border-amber-500/80 bg-amber-500/5"
        style={{ left: rects.safeLeft, top: rects.safeTop, width: rects.safeW, height: rects.safeH }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 font-mono text-sm text-white">
        Placed {placedCount}/{FLOATER_POOL_SIMPLE.length}
      </div>
    </div>
  );
}
