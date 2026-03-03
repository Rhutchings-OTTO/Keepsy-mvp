"use client";

import { useEffect, useRef, useState } from "react";

const PAD = 10;
const SAFE_MARGIN = 16;
const FLOATER_GAP = 8;
const JITTER = 8;
const SCALE_MIN = 0.4;
const SCALE_MAX = 1.1;
const CARD_ASPECT = 170 / 144;

/** Base sizes: smaller to fit many more floaters; desktop targets 12–18 */
const BASE_W_DESKTOP = 130;
const BASE_W_MOBILE = 100;
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

function clampScale(s: number): number {
  if (typeof s !== "number" || !Number.isFinite(s)) return 1;
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, s));
}

function clampNum(val: number, min: number, max: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/** Seeded jitter for deterministic layout (avoid layout thrash) */
function jitter(base: number, seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const t = s - Math.floor(s);
  return base + (t - 0.5) * 2 * JITTER;
}

const FALLBACK_RESULT: FloaterCapacityResult = {
  visibleFloaters: [],
  floaterSize: BASE_W_DESKTOP,
  margin: FLOATER_GAP,
  placedCount: 0,
  droppedCount: 0,
  heroHeight: 0,
  compactMode: false,
};

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

        if (!Number.isFinite(heroW) || !Number.isFinite(heroH) || heroW <= 0 || heroH <= 0) {
          return;
        }

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
          scale = Math.max(SCALE_MIN, 0.82);
        }
        if (whitespaceRatio < 0.5 && !ctaBelowFold) {
          scale = Math.max(SCALE_MIN, 0.88);
        }
        if (isMobile) {
          scale = Math.max(SCALE_MIN, scale * 0.9);
        }
        const margin = FLOATER_GAP;
        const safeZone = {
          left: safeLeft - SAFE_MARGIN,
          top: safeTop - SAFE_MARGIN,
          w: safeRight - safeLeft + SAFE_MARGIN * 2,
          h: safeBottom - safeTop + SAFE_MARGIN * 2,
        };

        const rawLeftLaneWidth = Math.max(0, safeZone.left - PAD - margin);
        const rawRightLaneWidth = Math.max(0, heroW - (safeZone.left + safeZone.w) - margin - PAD);
        const maxLaneWidth = Math.max(rawLeftLaneWidth, rawRightLaneWidth);
        if (maxLaneWidth > 0 && maxLaneWidth < baseW) {
          scale = Math.min(scale, Math.max(SCALE_MIN, (maxLaneWidth - margin * 0.5) / baseW));
        }
        scale = clampScale(scale);

        let floaterW = baseW * scale;
        let floaterH = floaterW / CARD_ASPECT;

        let leftLaneXMax = safeZone.left - margin - floaterW;
        const rightLaneXMin = safeZone.left + safeZone.w + margin;
        const leftLaneXMin = PAD;
        let rightLaneXMax = heroW - PAD - floaterW;

        let leftLaneWidth = Math.max(0, leftLaneXMax - leftLaneXMin);
        let rightLaneWidth = Math.max(0, rightLaneXMax - rightLaneXMin);

        if (leftLaneWidth > 0 && leftLaneWidth < floaterW) {
          const neededScale = (leftLaneWidth - margin) / baseW;
          scale = Math.min(scale, Math.max(SCALE_MIN, neededScale));
          scale = clampScale(scale);
          floaterW = baseW * scale;
          floaterH = floaterW / CARD_ASPECT;
          leftLaneXMax = safeZone.left - margin - floaterW;
          rightLaneXMax = heroW - PAD - floaterW;
          leftLaneWidth = Math.max(0, leftLaneXMax - leftLaneXMin);
          rightLaneWidth = Math.max(0, rightLaneXMax - rightLaneXMin);
        }
        if (rightLaneWidth > 0 && rightLaneWidth < floaterW) {
          const neededScale = (rightLaneWidth - margin) / baseW;
          scale = Math.min(scale, Math.max(SCALE_MIN, neededScale));
          scale = clampScale(scale);
          floaterW = baseW * scale;
          floaterH = floaterW / CARD_ASPECT;
          leftLaneXMax = safeZone.left - margin - floaterW;
          rightLaneXMax = heroW - PAD - floaterW;
          leftLaneWidth = Math.max(0, leftLaneXMax - leftLaneXMin);
          rightLaneWidth = Math.max(0, rightLaneXMax - rightLaneXMin);
        }

        const bottomZoneYStart = safeZone.top + safeZone.h + margin;
        const bottomZoneH = Math.max(0, heroH - PAD - bottomZoneYStart);

        const useBottomLane = !ctaBelowFold && bottomZoneH > floaterH * 1.2;

        const candidates: { x: number; y: number; lane: string; distFromCenter: number }[] = [];
        const centerX = (safeLeft + safeRight) / 2;
        const centerY = (safeTop + safeBottom) / 2;

        const topLeft = { x: PAD, y: PAD, lane: "corner-tl", distFromCenter: Math.hypot(PAD + floaterW / 2 - centerX, PAD + floaterH / 2 - centerY) };
        const topRight = { x: heroW - PAD - floaterW, y: PAD, lane: "corner-tr", distFromCenter: Math.hypot(heroW - PAD - floaterW / 2 - centerX, PAD + floaterH / 2 - centerY) };
        candidates.push(topLeft, topRight);
        if (useBottomLane) {
          candidates.push(
            { x: PAD, y: heroH - PAD - floaterH, lane: "corner-bl", distFromCenter: Math.hypot(PAD + floaterW / 2 - centerX, heroH - PAD - floaterH / 2 - centerY) },
            { x: heroW - PAD - floaterW, y: heroH - PAD - floaterH, lane: "corner-br", distFromCenter: Math.hypot(heroW - PAD - floaterW / 2 - centerX, heroH - PAD - floaterH / 2 - centerY) }
          );
        }

        const slotH = floaterH + margin * 0.5;
        const leftCols = leftLaneWidth > floaterW * 2.2 + margin * 2 ? 3 : leftLaneWidth > floaterW * 1.3 + margin ? 2 : 1;
        const rightCols = rightLaneWidth > floaterW * 2.2 + margin * 2 ? 3 : rightLaneWidth > floaterW * 1.3 + margin ? 2 : 1;

        if (leftLaneWidth > floaterW * 0.15) {
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

        if (rightLaneWidth > floaterW * 0.15) {
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

        const midLeftX = leftLaneXMin;
        const midRightX = rightLaneXMax;
        if (leftLaneWidth > floaterW * 0.15 && safeZone.top > floaterH * 2) {
          candidates.push({
            x: jitter(midLeftX, 200),
            y: jitter(safeZone.top - floaterH - margin, 201),
            lane: "mid-left",
            distFromCenter: Math.hypot(midLeftX + floaterW / 2 - centerX, safeZone.top - centerY),
          });
        }
        if (rightLaneWidth > floaterW * 0.15 && safeZone.top > floaterH * 2) {
          candidates.push({
            x: jitter(midRightX, 202),
            y: jitter(safeZone.top - floaterH - margin, 203),
            lane: "mid-right",
            distFromCenter: Math.hypot(midRightX + floaterW / 2 - centerX, safeZone.top - centerY),
          });
        }
        if (useBottomLane && leftLaneWidth > floaterW * 0.15) {
          candidates.push({
            x: jitter(leftLaneXMin + (leftCols > 1 ? floaterW + margin : 0), 204),
            y: jitter(bottomZoneYStart + floaterH * 0.5, 205),
            lane: "left-mid-bottom",
            distFromCenter: Math.hypot(leftLaneXMin - centerX, bottomZoneYStart - centerY),
          });
        }
        if (useBottomLane && rightLaneWidth > floaterW * 0.15) {
          candidates.push({
            x: jitter(rightLaneXMax - (rightCols > 1 ? floaterW + margin : 0), 206),
            y: jitter(bottomZoneYStart + floaterH * 0.5, 207),
            lane: "right-mid-bottom",
            distFromCenter: Math.hypot(rightLaneXMax - centerX, bottomZoneYStart - centerY),
          });
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

          rect.left = clampNum(rect.left, PAD, heroW - floaterW - PAD);
          rect.top = clampNum(rect.top, PAD, heroH - floaterH - PAD);

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
            animationScale: clampNum(animScale, 0.4, SCALE_MAX),
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
    if (typeof window !== "undefined") {
      window.addEventListener("resize", schedule);
    }

    schedule();

    return () => {
      ro.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", schedule);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heroRef, safeZoneRef, poolSize]);

  return result;
}
