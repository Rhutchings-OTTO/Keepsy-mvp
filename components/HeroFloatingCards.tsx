"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, type MotionValue } from "framer-motion";
import { FF } from "@/lib/featureFlags";
import { FloaterCard } from "@/components/hero/FloaterCard";
import { FLOATER_POOL_SIZE, selectBalancedFloaters } from "@/components/hero/floaterPool";
import type { FloaterCapacityResult, FloaterSlot } from "@/components/hero/useFloaterCapacity";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const MOTION_MAX_DESKTOP = 12;
const MOTION_MAX_MOBILE = 6;

type HeroFloatingCardsProps = {
  layout: FloaterCapacityResult;
  cursorOffset: { x: number; y: number };
  cardsY: MotionValue<number>;
  reduceMotion: boolean;
  heroRef?: React.RefObject<HTMLElement | null>;
  safeZoneRef?: React.RefObject<HTMLElement | null>;
};

function DebugOverlay({
  layout,
  heroRef,
  safeZoneRef,
}: {
  layout: FloaterCapacityResult;
  heroRef: React.RefObject<HTMLElement | null>;
  safeZoneRef: React.RefObject<HTMLElement | null>;
}) {
  const [rects, setRects] = useState<{ safeLeft: number; safeTop: number; safeW: number; safeH: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const heroEl = heroRef?.current;
    const safeEl = safeZoneRef?.current;
    if (!heroEl || !safeEl) return;
    const update = () => {
      const heroRect = heroEl.getBoundingClientRect();
      const safeRect = safeEl.getBoundingClientRect();
      setRects({
        safeLeft: safeRect.left - heroRect.left,
        safeTop: safeRect.top - heroRect.top,
        safeW: safeRect.width,
        safeH: safeRect.height,
      });
    };
    const t = setTimeout(update, 0);
    return () => clearTimeout(t);
  }, [layout, heroRef, safeZoneRef]);

  if (!rects) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50" aria-hidden>
      <div
        className="absolute border-2 border-dashed border-amber-500/80 bg-amber-500/5"
        style={{
          left: rects.safeLeft,
          top: rects.safeTop,
          width: rects.safeW,
          height: rects.safeH,
        }}
      />
      {layout.visibleFloaters.map((slot, i) => (
        <div
          key={i}
          className="absolute border border-blue-500/60 bg-blue-500/10"
          style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
        />
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 font-mono text-sm text-white">
        Placed {layout.placedCount}/{FLOATER_POOL_SIZE}
      </div>
    </div>
  );
}

function safeNum(val: number, fallback: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return fallback;
  return val;
}

function HeroFloatingCardsInner({
  layout,
  cursorOffset,
  cardsY,
  reduceMotion,
  heroRef,
  safeZoneRef,
}: HeroFloatingCardsProps) {
  const searchParams = useSearchParams();
  const debugFloaters = searchParams?.get("debugFloaters") === "1";

  const [viewportWidth, setViewportWidth] = useState(1024);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const setWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", setWidth);
    const t = setTimeout(setWidth, 0);
    return () => {
      window.removeEventListener("resize", setWidth);
      clearTimeout(t);
    };
  }, []);

  const { visibleFloaters } = layout;

  const cards = useMemo(
    () => selectBalancedFloaters(visibleFloaters.length, viewportWidth),
    [visibleFloaters.length, viewportWidth]
  );

  if (visibleFloaters.length === 0 || cards.length === 0) return null;

  const isMobile = viewportWidth < 640;
  const motionMax = isMobile ? MOTION_MAX_MOBILE : MOTION_MAX_DESKTOP;

  return (
    <>
      <motion.div
        aria-hidden
        style={FF.cinematicUX ? { y: cardsY } : undefined}
        className="pointer-events-none absolute inset-0 z-10"
      >
        {cards.map((def, i) => {
          const slot = visibleFloaters[i] as FloaterSlot | undefined;
          if (!slot) return null;

          const x = safeNum(slot.x, 0);
          const y = safeNum(slot.y, 0);
          const w = safeNum(slot.w, 170);
          const h = safeNum(slot.h, 150);
          const animScale = typeof slot.animationScale === "number" && Number.isFinite(slot.animationScale)
            ? Math.max(0.4, Math.min(1.1, slot.animationScale))
            : 1;

          const cursorMul = Math.min(0.35, 0.2 + i * 0.012);
          const clampedX = cursorOffset.x * cursorMul;
          const clampedY = cursorOffset.y * cursorMul;
          const animY = reduceMotion ? 0 : (i % 2 === 0 ? -1 : 1) * animScale * motionMax;
          const animRot = reduceMotion ? 0 : (i % 2 === 0 ? 1.2 : -1.2) * animScale;

          return (
            <motion.div
              key={def.id}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                x: clampedX,
                y: clampedY,
              }}
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, animY, 0], rotate: [0, animRot, 0] }
              }
              transition={{ duration: 6 + (i % 4), repeat: Infinity, ease: "easeInOut" }}
            >
              <FloaterCard
                image={def.image}
                alt={def.title}
                title={def.title}
                subtitle={def.subtitle}
                className="h-full w-full min-w-0 border-black/10 bg-white/80"
              />
            </motion.div>
          );
        })}
      </motion.div>
      {debugFloaters && heroRef && safeZoneRef && (
        <DebugOverlay layout={layout} heroRef={heroRef} safeZoneRef={safeZoneRef} />
      )}
    </>
  );
}

export function HeroFloatingCards(props: HeroFloatingCardsProps) {
  return (
    <ErrorBoundary>
      <HeroFloatingCardsInner {...props} />
    </ErrorBoundary>
  );
}
