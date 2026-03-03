"use client";

import { useEffect, useRef, useState } from "react";

const PAD = 10;
const SAFE_MARGIN_DESKTOP = 28;
const SAFE_MARGIN_MOBILE = 36;
const FLOATER_GAP_DESKTOP = 14;
const FLOATER_GAP_MOBILE = 18;
const JITTER = 6;
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.05;
const CARD_ASPECT = 200 / 190;

const BASE_W_DESKTOP = 200;
const BASE_W_MOBILE = 160;
const MOBILE_BREAK = 640;
const DESKTOP_MIN_WIDTH = 1100;
const DESKTOP_MIN_HEIGHT = 650;
const TARGET_MIN_FLOATERS_DESKTOP = 8;

const FOLD_GUARD_VH = 0.92;

const SCALE_STEPS = [1.0, 0.95, 0.9, 0.85];

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

function clampNum(val: number, min: number, max: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function jitter(base: number, seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const t = s - Math.floor(s);
  return base + (t - 0.5) * 2 * JITTER;
}

const FALLBACK_RESULT: FloaterCapacityResult = {
  visibleFloaters: [],
  floaterSize: BASE_W_DESKTOP,
  margin: FLOATER_GAP_DESKTOP,
  placedCount: 0,
  droppedCount: 0,
  heroHeight: 0,
  compactMode: false,
};

function tryPlace(
  candidates: { x: number; y: number; lane: string; distFromCenter: number }[],
  safeZone: { left: number; top: number; w: number; h: number },
  placed: { left: number; top: number; w: number; h: number }[],
  floaterW: number,
  floaterH: number,
  margin: number,
  heroW: number,
  heroH: number,
  targetCount: number,
  scale: number
): FloaterSlot[] {
  const visible: FloaterSlot[] = [];
  const sorted = [...candidates].sort((a, b) => b.distFromCenter - a.distFromCenter);

  for (let i = 0; i < sorted.length && visible.length < targetCount; i++) {
    const cand = sorted[i];
    const rect = {
      left: clampNum(cand.x, PAD, heroW - floaterW - PAD),
      top: clampNum(cand.y, PAD, heroH - floaterH - PAD),
      w: floaterW,
      h: floaterH,
    };

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
      layer: visible.length % 3,
      animationScale: clampNum(animScale, 0.4, SCALE_MAX),
    });
  }
  return visible;
}

function buildCandidates(
  heroW: number,
  heroH: number,
  safeLeft: number,
  safeTop: number,
  safeRight: number,
  safeBottom: number,
  floaterW: number,
  floaterH: number,
  safeMargin: number,
  gap: number,
  useBottomLane: boolean,
  slotSpacing: number,
  centerX: number,
  centerY: number
): { x: number; y: number; lane: string; distFromCenter: number }[] {
  const candidates: { x: number; y: number; lane: string; distFromCenter: number }[] = [];
  const safeZone = {
    left: safeLeft - safeMargin,
    top: safeTop - safeMargin,
    w: safeRight - safeLeft + safeMargin * 2,
    h: safeBottom - safeTop + safeMargin * 2,
  };
  const leftLaneXMin = PAD;
  const leftLaneXMax = safeZone.left - gap - floaterW;
  const rightLaneXMin = safeZone.left + safeZone.w + gap;
  const rightLaneXMax = heroW - PAD - floaterW;
  const leftLaneWidth = Math.max(0, leftLaneXMax - leftLaneXMin);
  const rightLaneWidth = Math.max(0, rightLaneXMax - rightLaneXMin);
  const bottomZoneYStart = safeZone.top + safeZone.h + gap;

  const leftCols = leftLaneWidth > floaterW * 2 + gap ? 3 : leftLaneWidth > floaterW * 1.2 + gap ? 2 : 1;
  const rightCols = rightLaneWidth > floaterW * 2 + gap ? 3 : rightLaneWidth > floaterW * 1.2 + gap ? 2 : 1;

  candidates.push(
    { x: PAD, y: PAD, lane: "corner-tl", distFromCenter: Math.hypot(PAD + floaterW / 2 - centerX, PAD + floaterH / 2 - centerY) },
    { x: heroW - PAD - floaterW, y: PAD, lane: "corner-tr", distFromCenter: Math.hypot(heroW - PAD - floaterW / 2 - centerX, PAD + floaterH / 2 - centerY) }
  );

  if (useBottomLane) {
    candidates.push(
      { x: PAD, y: heroH - PAD - floaterH, lane: "corner-bl", distFromCenter: Math.hypot(PAD + floaterW / 2 - centerX, heroH - PAD - floaterH / 2 - centerY) },
      { x: heroW - PAD - floaterW, y: heroH - PAD - floaterH, lane: "corner-br", distFromCenter: Math.hypot(heroW - PAD - floaterW / 2 - centerX, heroH - PAD - floaterH / 2 - centerY) }
    );
  }

  if (leftLaneWidth > floaterW * 0.1) {
    let seed = 0;
    for (let col = 0; col < leftCols; col++) {
      const leftX = leftCols > 1 ? leftLaneXMin + col * (floaterW + gap) : leftLaneXMin;
      let y = PAD;
      while (y + floaterH <= safeZone.top) {
        candidates.push({
          x: jitter(leftX, seed++),
          y: jitter(y, seed++),
          lane: "left-top",
          distFromCenter: Math.hypot(leftX + floaterW / 2 - centerX, y + floaterH / 2 - centerY),
        });
        y += slotSpacing;
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
          y += slotSpacing;
        }
      }
    }
  }

  if (rightLaneWidth > floaterW * 0.1) {
    let seed = 100;
    for (let col = 0; col < rightCols; col++) {
      const rightX = rightCols > 1 ? rightLaneXMax - col * (floaterW + gap) : rightLaneXMax;
      let y = PAD;
      while (y + floaterH <= safeZone.top) {
        candidates.push({
          x: jitter(rightX, seed++),
          y: jitter(y, seed++),
          lane: "right-top",
          distFromCenter: Math.hypot(rightX + floaterW / 2 - centerX, y + floaterH / 2 - centerY),
        });
        y += slotSpacing;
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
          y += slotSpacing;
        }
      }
    }
  }

  const midLeftX = leftLaneXMin;
  const midRightX = rightLaneXMax;
  if (leftLaneWidth > floaterW * 0.1 && safeZone.top > floaterH * 1.5) {
    candidates.push({
      x: jitter(midLeftX, 200),
      y: jitter(safeZone.top - floaterH - gap, 201),
      lane: "mid-left",
      distFromCenter: Math.hypot(midLeftX + floaterW / 2 - centerX, safeZone.top - centerY),
    });
  }
  if (rightLaneWidth > floaterW * 0.1 && safeZone.top > floaterH * 1.5) {
    candidates.push({
      x: jitter(midRightX, 202),
      y: jitter(safeZone.top - floaterH - gap, 203),
      lane: "mid-right",
      distFromCenter: Math.hypot(midRightX + floaterW / 2 - centerX, safeZone.top - centerY),
    });
  }

  if (useBottomLane && leftLaneWidth > floaterW * 0.1) {
    candidates.push({
      x: jitter(leftLaneXMin + (leftCols > 1 ? floaterW + gap : 0), 204),
      y: jitter(bottomZoneYStart + floaterH * 0.3, 205),
      lane: "left-mid-bottom",
      distFromCenter: Math.hypot(leftLaneXMin - centerX, bottomZoneYStart - centerY),
    });
  }
  if (useBottomLane && rightLaneWidth > floaterW * 0.1) {
    candidates.push({
      x: jitter(rightLaneXMax - (rightCols > 1 ? floaterW + gap : 0), 206),
      y: jitter(bottomZoneYStart + floaterH * 0.3, 207),
      lane: "right-mid-bottom",
      distFromCenter: Math.hypot(rightLaneXMax - centerX, bottomZoneYStart - centerY),
    });
  }

  return candidates;
}

export function useFloaterCapacity(
  heroRef: React.RefObject<HTMLElement | null>,
  safeZoneRef: React.RefObject<HTMLElement | null>,
  poolSize: number
): FloaterCapacityResult {
  const [result, setResult] = useState<FloaterCapacityResult>(FALLBACK_RESULT);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const heroEl = heroRef?.current;
    const safeEl = safeZoneRef?.current;
    if (!heroEl || !safeEl) return;
    if (typeof ResizeObserver === "undefined") return;

    const compute = () => {
      try {
        if (!heroEl || !safeEl) return;
        const heroRect = heroEl.getBoundingClientRect();
        const safeRect = safeEl.getBoundingClientRect();
        const heroW = heroRect.width;
        const heroH = heroRect.height;

        if (!Number.isFinite(heroW) || !Number.isFinite(heroH) || heroW <= 0 || heroH <= 0) return;

        const vh = typeof window !== "undefined" ? window.innerHeight : heroH;
        const vw = typeof window !== "undefined" ? window.innerWidth : heroW;

        const safeLeft = safeRect.left - heroRect.left;
        const safeTop = safeRect.top - heroRect.top;
        const safeRight = safeRect.right - heroRect.left;
        const safeBottom = safeRect.bottom - heroRect.left;

        const ctaBelowFold = safeRect.bottom > vh * FOLD_GUARD_VH;
        const isMobile = heroW < MOBILE_BREAK;
        const isDesktopTarget = vw >= DESKTOP_MIN_WIDTH && vh >= DESKTOP_MIN_HEIGHT;

        const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;
        const margin = isMobile ? FLOATER_GAP_MOBILE : FLOATER_GAP_DESKTOP;
        const safeMargin = isMobile ? SAFE_MARGIN_MOBILE : SAFE_MARGIN_DESKTOP;
        const targetCount = Math.min(poolSize, isDesktopTarget ? Math.max(TARGET_MIN_FLOATERS_DESKTOP, poolSize) : poolSize);

        const safeZoneBottom = safeBottom + safeMargin;
        const bottomZoneYStart = safeZoneBottom + margin;
        const bottomZoneH = Math.max(0, heroH - PAD - bottomZoneYStart);
        const useBottomLane = !ctaBelowFold && bottomZoneH > 0;

        let bestVisible: FloaterSlot[] = [];
        let bestFloaterW = baseW * SCALE_MIN;

        const centerX = (safeLeft + safeRight) / 2;
        const centerY = (safeTop + safeBottom) / 2;

        for (const scaleStep of SCALE_STEPS) {
          let scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scaleStep));
          let floaterW = baseW * scale;
          let floaterH = floaterW / CARD_ASPECT;

          const rawLeft = Math.max(0, safeLeft - safeMargin - PAD - margin);
          const rawRight = Math.max(0, heroW - (safeRight + safeMargin) - margin - PAD);
          if (rawLeft > 0 && rawLeft < floaterW) {
            const s = Math.max(SCALE_MIN, (rawLeft - margin * 0.5) / baseW);
            scale = Math.min(scale, s);
            floaterW = baseW * scale;
            floaterH = floaterW / CARD_ASPECT;
          }
          if (rawRight > 0 && rawRight < floaterW) {
            const s = Math.max(SCALE_MIN, (rawRight - margin * 0.5) / baseW);
            scale = Math.min(scale, s);
            floaterW = baseW * scale;
            floaterH = floaterW / CARD_ASPECT;
          }

          const slotSpacing = floaterH + margin * 0.4;
          const candidates = buildCandidates(
            heroW,
            heroH,
            safeLeft,
            safeTop,
            safeRight,
            safeBottom,
            floaterW,
            floaterH,
            safeMargin,
            margin,
            useBottomLane,
            slotSpacing,
            centerX,
            centerY
          );

          const placed: { left: number; top: number; w: number; h: number }[] = [];
          const visible = tryPlace(
            candidates,
            {
              left: safeLeft - safeMargin,
              top: safeTop - safeMargin,
              w: safeRight - safeLeft + safeMargin * 2,
              h: safeBottom - safeTop + safeMargin * 2,
            },
            placed,
            floaterW,
            floaterH,
            margin,
            heroW,
            heroH,
            targetCount,
            scale
          );

          if (visible.length > bestVisible.length) {
            bestVisible = visible;
            bestFloaterW = floaterW;
          }
          if (visible.length >= targetCount) break;
        }

        if (isDesktopTarget && bestVisible.length < TARGET_MIN_FLOATERS_DESKTOP && process.env.NODE_ENV !== "production") {
          console.warn(
            `[useFloaterCapacity] Desktop target ${TARGET_MIN_FLOATERS_DESKTOP} not reached: placed ${bestVisible.length}. ` +
              `Viewport ${vw}x${vh}, safe zone may be too large or lanes too narrow.`
          );
        }

        setResult({
          visibleFloaters: bestVisible,
          floaterSize: bestFloaterW,
          margin,
          placedCount: bestVisible.length,
          droppedCount: Math.max(0, poolSize - bestVisible.length),
          heroHeight: heroH,
          compactMode: ctaBelowFold,
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[useFloaterCapacity] compute error:", err);
        }
        setResult(FALLBACK_RESULT);
      }
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
    if (typeof window !== "undefined") window.addEventListener("resize", schedule);
    schedule();

    return () => {
      ro.disconnect();
      if (typeof window !== "undefined") window.removeEventListener("resize", schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heroRef, safeZoneRef, poolSize]);

  return result;
}
