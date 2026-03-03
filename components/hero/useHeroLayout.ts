"use client";

import { useEffect, useRef, useState } from "react";

const PAD = 16;
const GAP = 48;
const CARD_MIN_W = 96;
const CARD_MAX_W = 200;
type FloaterPosition = { top: number; left: number; w: number; h: number; animationScale: number };

export type HeroLayoutResult = {
  maxFloaters: number;
  positions: FloaterPosition[];
  scale: number;
  heroHeight: number;
  compactMode: boolean;
};

function rectsOverlap(
  a: { left: number; top: number; w: number; h: number },
  b: { left: number; top: number; w: number; h: number }
): boolean {
  return !(a.left + a.w <= b.left || b.left + b.w <= a.left || a.top + a.h <= b.top || b.top + b.h <= a.top);
}

function getMaxFloatersByBreakpoint(width: number): number {
  if (width < 640) return 3;
  if (width < 1024) return 6;
  if (width < 1440) return 8;
  return 10;
}

export function useHeroLayout(
  heroRef: React.RefObject<HTMLElement | null>,
  safeZoneRef: React.RefObject<HTMLElement | null>
): HeroLayoutResult {
  const [result, setResult] = useState<HeroLayoutResult>({
    maxFloaters: 0,
    positions: [],
    scale: 1,
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
      const safeBottom = safeRect.bottom - heroRect.top;
      const safeW = safeRect.width;
      const safeH = safeRect.height;

      let maxFloaters = getMaxFloatersByBreakpoint(heroW);
      const heroArea = heroW * heroH;
      const safeArea = safeW * safeH;
      const whitespaceRatio = Math.max(0, (heroArea - safeArea) / heroArea);
      if (whitespaceRatio < 0.4) maxFloaters = Math.max(0, Math.floor(maxFloaters * 0.6));
      else if (whitespaceRatio < 0.6) maxFloaters = Math.max(0, Math.floor(maxFloaters * 0.85));

      const ctaBelowFold = safeRect.bottom > vh * 0.92;
      if (ctaBelowFold) {
        maxFloaters = Math.max(0, Math.floor(maxFloaters * 0.5));
      }

      const baseScale = ctaBelowFold ? 0.7 : 1;
      const mobileScale = heroW < 640 ? 0.85 : 1;
      const scale = baseScale * mobileScale;

      const cardW = Math.min(CARD_MAX_W, Math.max(CARD_MIN_W, heroW * 0.12)) * scale;
      const cardH = cardW / (144 / 170);

      const safeL = safeLeft - GAP;
      const safeR = safeRight + GAP;
      const safeT = safeTop - GAP;
      const safeB = safeBottom + GAP;

      const leftLaneX = PAD;
      const rightLaneX = heroW - cardW - PAD;
      const leftLaneW = Math.max(0, safeL - leftLaneX - PAD);
      const rightLaneW = Math.max(0, rightLaneX - (safeR - cardW) - PAD);

      const hasLeft = leftLaneW > cardW * 0.5;
      const hasRight = rightLaneW > cardW * 0.5;

      const topZoneH = Math.max(0, safeT - PAD);
      const bottomZoneH = Math.max(0, heroH - safeB - PAD);
      const isNarrow = heroW < 640;

      const positions: FloaterPosition[] = [];
      const placed: { left: number; top: number; w: number; h: number }[] = [];
      const safeZoneRect = { left: safeL, top: safeT, w: safeR - safeL, h: safeB - safeT };

      const candidates: { x: number; y: number; lane: string }[] = [];

      if (hasLeft) {
        for (let row = 0; row < 6; row++) {
          const t = PAD + (topZoneH / 5) * row;
          if (t + cardH <= safeT) candidates.push({ x: leftLaneX, y: t, lane: "left-top" });
        }
        for (let row = 0; row < 6; row++) {
          const t = safeB + (bottomZoneH / 5) * row;
          if (t + cardH <= heroH - PAD) candidates.push({ x: leftLaneX, y: t, lane: "left-bottom" });
        }
      }
      if (hasRight) {
        for (let row = 0; row < 6; row++) {
          const t = PAD + (topZoneH / 5) * row;
          if (t + cardH <= safeT) candidates.push({ x: rightLaneX, y: t, lane: "right-top" });
        }
        for (let row = 0; row < 6; row++) {
          const t = safeB + (bottomZoneH / 5) * row;
          if (t + cardH <= heroH - PAD) candidates.push({ x: rightLaneX, y: t, lane: "right-bottom" });
        }
      }
      if (isNarrow && candidates.length < 3 && topZoneH > cardH) {
        const edgePad = heroW * 0.02;
        candidates.push({ x: edgePad, y: PAD, lane: "top-left" });
        candidates.push({ x: heroW - cardW - edgePad, y: PAD, lane: "top-right" });
      }

      const sorted = [...candidates].sort((a, b) => (a.lane === b.lane ? a.y - b.y : a.lane.localeCompare(b.lane)));
      for (const cand of sorted) {
        if (positions.length >= maxFloaters) break;
        const rect = { left: cand.x, top: cand.y, w: cardW, h: cardH };
        const overlapsSafe =
          rect.left + rect.w > safeZoneRect.left &&
          rect.left < safeZoneRect.left + safeZoneRect.w &&
          rect.top + rect.h > safeZoneRect.top &&
          rect.top < safeZoneRect.top + safeZoneRect.h;
        if (overlapsSafe) continue;
        const overlapsAny = placed.some((p) => rectsOverlap(rect, p));
        if (overlapsAny) continue;
        placed.push(rect);
        const distFromCenter = Math.hypot(
          rect.left + rect.w / 2 - (safeLeft + safeRight) / 2,
          rect.top + rect.h / 2 - (safeTop + safeBottom) / 2
        );
        const animationScale = distFromCenter < 180 ? Math.max(0.35, distFromCenter / 180) : 1;
        positions.push({
          top: cand.y,
          left: cand.x,
          w: cardW,
          h: cardH,
          animationScale,
        });
      }

      setResult({
        maxFloaters: positions.length,
        positions,
        scale,
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
  }, [heroRef, safeZoneRef]);

  return result;
}
