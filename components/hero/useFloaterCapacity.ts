"use client";

import { useEffect, useRef, useState } from "react";

const PAD = 20;
const SAFE_MARGIN = 40;
const FLOATER_GAP = 18;
const JITTER = 14;
const SCALE_MIN = 0.75;
const CARD_ASPECT = 170 / 144;

/** Base sizes: desktop 180–220px, mobile 120–160px */
const BASE_W_DESKTOP = 200;
const BASE_W_MOBILE = 140;
const MOBILE_BREAK = 640;

const FOLD_GUARD_VH = 0.92;

export type FloaterSlot = {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  layer: number;
  animationScale: number;
};

export type FloaterCapacityResult = {
  visibleFloaters: FloaterSlot[];
  floaterSize: number;
  margin: number;
  placedCount: number;
  droppedCount: number;
  heroHeight: number;
  compactMode: boolean;
};

function rectsOverlap(
  a: { left: number; top: number; w: number; h: number },
  b: { left: number; top: number; w: number; h: number },
  gap: number
): boolean {
  const g = gap / 2;
  return !(
    a.left + a.w + g <= b.left - g ||
    b.left + b.w + g <= a.left - g ||
    a.top + a.h + g <= b.top - g ||
    b.top + b.h + g <= a.top - g
  );
}

function rectOverlapsSafe(
  rect: { left: number; top: number; w: number; h: number },
  safe: { left: number; top: number; w: number; h: number },
  margin: number
): boolean {
  return !(
    rect.left + rect.w <= safe.left - margin ||
    rect.left >= safe.left + safe.w + margin ||
    rect.top + rect.h <= safe.top - margin ||
    rect.top >= safe.top + safe.h + margin
  );
}

/** Seeded jitter for deterministic layout (avoid layout thrash) */
function jitter(base: number, seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const t = s - Math.floor(s);
  return base + (t - 0.5) * 2 * JITTER;
}

export function useFloaterCapacity(
  heroRef: React.RefObject<HTMLElement | null>,
  safeZoneRef: React.RefObject<HTMLElement | null>,
  poolSize: number
): FloaterCapacityResult {
  const [result, setResult] = useState<FloaterCapacityResult>({
    visibleFloaters: [],
    floaterSize: BASE_W_DESKTOP,
    margin: FLOATER_GAP,
    placedCount: 0,
    droppedCount: 0,
    heroHeight: 0,
    compactMode: false,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    const safeEl = safeZoneRef.current;
    if (!heroEl || !safeEl) return;

    const compute = () => {
      if (!heroEl || !safeEl) return;
      const heroRect = heroEl.getBoundingClientRect();
      const safeRect = safeEl.getBoundingClientRect();
      const heroW = heroRect.width;
      const heroH = heroRect.height;
      const vh = typeof window !== "undefined" ? window.innerHeight : heroH;

      const safeLeft = safeRect.left - heroRect.left;
      const safeTop = safeRect.top - heroRect.top;
      const safeRight = safeRect.right - heroRect.left;
      const safeBottom = safeRect.bottom - heroRect.left;

      const ctaBelowFold = safeRect.bottom > vh * FOLD_GUARD_VH;
      const isMobile = heroW < MOBILE_BREAK;

      const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;
      let scale = 1;

      const whitespaceArea = heroW * heroH - (safeRight - safeLeft) * (safeBottom - safeTop);
      const whitespaceRatio = Math.max(0, whitespaceArea / (heroW * heroH));

      if (ctaBelowFold) {
        scale = Math.max(SCALE_MIN, 0.85);
      }
      if (whitespaceRatio < 0.5 && !ctaBelowFold) {
        scale = Math.max(SCALE_MIN, 0.9);
      }
      if (isMobile) {
        scale = Math.max(SCALE_MIN, scale * 0.92);
      }

      const floaterW = baseW * scale;
      const floaterH = floaterW / CARD_ASPECT;
      const margin = FLOATER_GAP;
      const safeZone = {
        left: safeLeft - SAFE_MARGIN,
        top: safeTop - SAFE_MARGIN,
        w: safeRight - safeLeft + SAFE_MARGIN * 2,
        h: safeBottom - safeTop + SAFE_MARGIN * 2,
      };

      const leftLaneXMin = PAD;
      const leftLaneXMax = safeZone.left - margin - floaterW;
      const rightLaneXMin = safeZone.left + safeZone.w + margin;
      const rightLaneXMax = heroW - PAD - floaterW;

      const bottomZoneYStart = safeZone.top + safeZone.h + margin;
      const bottomZoneH = Math.max(0, heroH - PAD - bottomZoneYStart);

      const useBottomLane = !ctaBelowFold && bottomZoneH > floaterH * 1.2;

      const candidates: { x: number; y: number; lane: string; distFromCenter: number }[] = [];
      const centerX = (safeLeft + safeRight) / 2;
      const centerY = (safeTop + safeBottom) / 2;

      const leftLaneWidth = leftLaneXMax - leftLaneXMin;
      const rightLaneWidth = rightLaneXMax - rightLaneXMin;
      const slotH = floaterH + margin * 0.85;
      const leftCols = leftLaneWidth > floaterW * 2 + margin ? 2 : 1;
      const rightCols = rightLaneWidth > floaterW * 2 + margin ? 2 : 1;

      if (leftLaneWidth > floaterW * 0.3) {
        let seed = 0;
        for (let col = 0; col < leftCols; col++) {
          const leftX = leftCols > 1 ? leftLaneXMin + col * (floaterW + margin) : leftLaneXMin;
          let y = PAD;
          while (y + floaterH <= safeZone.top) {
            candidates.push({
              x: jitter(leftX, seed++),
              y: jitter(y, seed++),
              lane: "left-top",
              distFromCenter: Math.hypot(leftX + floaterW / 2 - centerX, y + floaterH / 2 - centerY),
            });
            y += slotH;
          }
          if (useBottomLane) {
            y = bottomZoneYStart;
            while (y + floaterH <= heroH - PAD) {
              candidates.push({
                x: jitter(leftX, seed++),
                y: jitter(y, seed++),
                lane: "left-bottom",
                distFromCenter: Math.hypot(leftX + floaterW / 2 - centerX, y + floaterH / 2 - centerY),
              });
              y += slotH;
            }
          }
        }
      }

      if (rightLaneWidth > floaterW * 0.3) {
        let seed = 100;
        for (let col = 0; col < rightCols; col++) {
          const rightX =
            rightCols > 1 ? rightLaneXMax - col * (floaterW + margin) : rightLaneXMax;
          let y = PAD;
          while (y + floaterH <= safeZone.top) {
            candidates.push({
              x: jitter(rightX, seed++),
              y: jitter(y, seed++),
              lane: "right-top",
              distFromCenter: Math.hypot(rightX + floaterW / 2 - centerX, y + floaterH / 2 - centerY),
            });
            y += slotH;
          }
          if (useBottomLane) {
            y = bottomZoneYStart;
            while (y + floaterH <= heroH - PAD) {
              candidates.push({
                x: jitter(rightX, seed++),
                y: jitter(y, seed++),
                lane: "right-bottom",
                distFromCenter: Math.hypot(rightX + floaterW / 2 - centerX, y + floaterH / 2 - centerY),
              });
              y += slotH;
            }
          }
        }
      }

      candidates.sort((a, b) => b.distFromCenter - a.distFromCenter);

      const placed: { left: number; top: number; w: number; h: number }[] = [];
      const visible: FloaterSlot[] = [];
      let dropped = 0;

      for (let i = 0; i < candidates.length && visible.length < poolSize; i++) {
        const cand = candidates[i];
        const rect = {
          left: cand.x,
          top: cand.y,
          w: floaterW,
          h: floaterH,
        };

        rect.left = Math.max(PAD, Math.min(heroW - floaterW - PAD, rect.left));
        rect.top = Math.max(PAD, Math.min(heroH - floaterH - PAD, rect.top));

        if (rectOverlapsSafe(rect, safeZone, 0)) continue;
        if (placed.some((p) => rectsOverlap(rect, p, margin))) continue;

        placed.push(rect);
        const animScale = cand.distFromCenter < 200 ? Math.max(0.4, cand.distFromCenter / 200) : 1;
        visible.push({
          x: rect.left,
          y: rect.top,
          w: floaterW,
          h: floaterH,
          scale,
          layer: i % 3,
          animationScale: animScale,
        });
      }

      dropped = Math.max(0, poolSize - visible.length);

      setResult({
        visibleFloaters: visible,
        floaterSize: floaterW,
        margin,
        placedCount: visible.length,
        droppedCount: dropped,
        heroHeight: heroH,
        compactMode: ctaBelowFold,
      });
    };

    const schedule = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        compute();
        rafRef.current = null;
      });
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(heroEl);
    ro.observe(safeEl);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", schedule);
    }
    compute();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heroRef, safeZoneRef, poolSize]);

  return result;
}
