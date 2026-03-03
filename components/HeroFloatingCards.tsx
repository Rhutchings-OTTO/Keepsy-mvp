"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, type MotionValue } from "framer-motion";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { FF } from "@/lib/featureFlags";
import { FLOATER_POOL } from "@/components/hero/floaterPool";
import type { FloaterCapacityResult, FloaterSlot } from "@/components/hero/useFloaterCapacity";

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
    if (typeof window === "undefined" || process.env.NODE_ENV === "production") return;
    const heroEl = heroRef.current;
    const safeEl = safeZoneRef.current;
    if (!heroEl || !safeEl) return;
    const heroRect = heroEl.getBoundingClientRect();
    const safeRect = safeEl.getBoundingClientRect();
    setRects({
      safeLeft: safeRect.left - heroRect.left,
      safeTop: safeRect.top - heroRect.top,
      safeW: safeRect.width,
      safeH: safeRect.height,
    });
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
        Placed {layout.placedCount}/{FLOATER_POOL.length}
      </div>
    </div>
  );
}

export function HeroFloatingCards({ layout, cursorOffset, cardsY, reduceMotion, heroRef, safeZoneRef }: HeroFloatingCardsProps) {
  const searchParams = useSearchParams();
  const debugFloaters = searchParams?.get("debugFloaters") === "1";

  const { visibleFloaters } = layout;
  if (visibleFloaters.length === 0) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const motionMax = isMobile ? MOTION_MAX_MOBILE : MOTION_MAX_DESKTOP;

  const cards = FLOATER_POOL.slice(0, visibleFloaters.length);

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
          const cursorMul = Math.min(0.35, 0.2 + i * 0.012);
          const clampedX = cursorOffset.x * cursorMul;
          const clampedY = cursorOffset.y * cursorMul;
          const animY = reduceMotion ? 0 : (i % 2 === 0 ? -1 : 1) * slot.animationScale * motionMax;
          const animRot = reduceMotion ? 0 : (i % 2 === 0 ? 1.2 : -1.2) * slot.animationScale;

          return (
            <motion.div
              key={def.id}
              className="absolute"
              style={{
                left: slot.x,
                top: slot.y,
                width: slot.w,
                height: slot.h,
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
              <InteractiveCard
                image={
                  <Image
                    src={def.image}
                    alt={def.label}
                    width={240}
                    height={160}
                    className="h-full w-full rounded-xl object-cover"
                  />
                }
                title={def.label}
                subtitle={`${def.product} preview`}
                className="border-black/10 bg-white/80"
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
