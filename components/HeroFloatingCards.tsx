"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, type MotionValue } from "framer-motion";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { FF } from "@/lib/featureFlags";

const SAFE_MARGIN = 32;
const MOVEMENT_BUFFER = 24;
const MAX_FLOATERS_MOBILE = 5;
const MAX_FLOATERS_DESKTOP = 9;
const MOBILE_BREAKPOINT = 1024;

type CardDef = {
  id: string;
  label: string;
  product: string;
  image: string;
  topPct?: number;
  bottomPct?: number;
  leftPct?: number;
  rightPct?: number;
  wPx: number;
  order: number;
};

const CARD_DEFS: CardDef[] = [
  { id: "tee-white", label: "Premium Tee Mockup", product: "T-Shirt", image: "/product-tiles/tee-white.png", topPct: 10, leftPct: 2, wPx: 144, order: 1 },
  { id: "plain-mug", label: "Plain Mug Mockup", product: "Mug", image: "/product-tiles/plain-mug-front.png", topPct: 12, rightPct: 2, wPx: 160, order: 2 },
  { id: "plain-hoodie", label: "Plain Hoodie Mockup", product: "Hoodie", image: "/product-tiles/hoodie-white.png", bottomPct: 14, leftPct: 3, wPx: 176, order: 3 },
  { id: "plain-card", label: "Plain Card Mockup", product: "Card", image: "/product-tiles/plain-card.png", bottomPct: 14, rightPct: 3, wPx: 144, order: 4 },
  { id: "christmas-scene", label: "Christmas Scene", product: "Design", image: "/occasion-tiles/christmas-scene.png", topPct: 6, rightPct: 20, wPx: 144, order: 5 },
  { id: "thanksgiving-scene", label: "Thanksgiving Cartoon", product: "Design", image: "/occasion-tiles/thanksgiving-cartoon.png", topPct: 38, leftPct: 0.5, wPx: 128, order: 6 },
  { id: "fourth-july-scene", label: "Fourth of July Photo", product: "Design", image: "/occasion-tiles/fourth-july-photo.png", bottomPct: 4, leftPct: 20, wPx: 176, order: 7 },
  { id: "anniversary-scene", label: "Anniversary Watercolor", product: "Design", image: "/occasion-tiles/anniversary-watercolor.png", topPct: 44, rightPct: 15, wPx: 144, order: 8 },
  { id: "birthday-scene", label: "Birthday Scene", product: "Design", image: "/occasion-tiles/birthday-confetti.png", bottomPct: 32, rightPct: 0.5, wPx: 112, order: 9 },
  { id: "pet-scene", label: "Pet Portrait Scene", product: "Design", image: "/occasion-tiles/pet-gifts-portrait.png", topPct: 26, leftPct: 16, wPx: 208, order: 10 },
];

const CARD_HEIGHT = 170;

function resolvePosition(
  mainW: number,
  mainH: number,
  def: CardDef,
  w: number,
  h: number
): { top: number; left: number } {
  let left: number;
  let top: number;
  if (def.rightPct != null) {
    left = mainW - w - (def.rightPct / 100) * mainW;
  } else {
    left = ((def.leftPct ?? 0) / 100) * mainW;
  }
  if (def.bottomPct != null) {
    top = mainH - h - (def.bottomPct / 100) * mainH;
  } else {
    top = ((def.topPct ?? 0) / 100) * mainH;
  }
  return { top, left };
}

function clampPosition(
  mainW: number,
  mainH: number,
  def: CardDef,
  w: number,
  h: number,
  safeLeft: number,
  safeTop: number,
  safeRight: number,
  safeBottom: number
): { top: number; left: number; animationScale: number } {
  const margin = SAFE_MARGIN + MOVEMENT_BUFFER;
  const safeL = safeLeft - margin;
  const safeT = safeTop - margin;
  const safeR = safeRight + margin;
  const safeB = safeBottom + margin;

  const { top: initialTop, left: initialLeft } = resolvePosition(mainW, mainH, def, w, h);
  let left = initialLeft;
  let top = initialTop;

  const right = left + w;
  const bottom = top + h;
  const centerX = (safeLeft + safeRight) / 2;
  const centerY = (safeTop + safeBottom) / 2;
  const cardCenterX = left + w / 2;
  const cardCenterY = top + h / 2;

  let overlaps = false;
  if (right > safeL && left < safeR && bottom > safeT && top < safeB) overlaps = true;

  if (overlaps) {
    const dx = cardCenterX - centerX;
    const dy = cardCenterY - centerY;
    if (Math.abs(dx) > Math.abs(dy)) {
      left = dx > 0 ? safeR : safeL - w;
    } else {
      top = dy > 0 ? safeB : safeT - h;
    }
  }

  const distFromCenter = Math.hypot(cardCenterX - centerX, cardCenterY - centerY);
  const minDist = 200;
  const animationScale = distFromCenter < minDist ? Math.max(0.3, distFromCenter / minDist) : 1;

  return {
    top: Math.max(0, Math.min(mainH - h, top)),
    left: Math.max(0, Math.min(mainW - w, left)),
    animationScale,
  };
}

type HeroFloatingCardsProps = {
  textRef: React.RefObject<HTMLElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  cursorOffset: { x: number; y: number };
  cardsY: MotionValue<number>;
  reduceMotion: boolean | null;
};

export function HeroFloatingCards({ textRef, containerRef, cursorOffset, cardsY, reduceMotion }: HeroFloatingCardsProps) {
  const [positions, setPositions] = useState<Array<{ top: number; left: number; w: number; animationScale: number }>>([]);
  const [visibleCount, setVisibleCount] = useState(MAX_FLOATERS_DESKTOP);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const textEl = textRef.current;
    const containerEl = containerRef.current;
    if (!textEl || !containerEl) return;

    const update = () => {
      if (!textEl || !containerEl) return;
      const mainRect = containerEl.getBoundingClientRect();
      const textRect = textEl.getBoundingClientRect();
      const isMobile = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
      const count = Math.min(isMobile ? MAX_FLOATERS_MOBILE : MAX_FLOATERS_DESKTOP, CARD_DEFS.length);
      setVisibleCount(count);

      const safeLeft = textRect.left - mainRect.left - SAFE_MARGIN;
      const safeTop = textRect.top - mainRect.top - SAFE_MARGIN;
      const safeRight = textRect.right - mainRect.left + SAFE_MARGIN;
      const safeBottom = textRect.bottom - mainRect.top + SAFE_MARGIN;

      const mobileMargin = isMobile ? 40 : 0;
      const safeL = safeLeft - mobileMargin;
      const safeT = safeTop - mobileMargin;
      const safeR = safeRight + mobileMargin;
      const safeB = safeBottom + mobileMargin;

      const next = CARD_DEFS.slice(0, count)
        .sort((a, b) => a.order - b.order)
        .map((def) => {
          const res = clampPosition(
            mainRect.width,
            mainRect.height,
            def,
            def.wPx,
            CARD_HEIGHT,
            safeL,
            safeT,
            safeR,
            safeB
          );
          return { top: res.top, left: res.left, w: def.wPx, animationScale: res.animationScale };
        });
      setPositions(next);
    };

    const scheduleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };
    const resizeObs = new ResizeObserver(scheduleUpdate);
    resizeObs.observe(containerEl);
    resizeObs.observe(textEl);
    window.addEventListener("resize", scheduleUpdate);
    update();

    return () => {
      resizeObs.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [textRef, containerRef]);

  if (positions.length === 0) return null;

  return (
    <motion.div
      aria-hidden
      style={FF.cinematicUX ? { y: cardsY } : undefined}
      className="pointer-events-none absolute inset-0 z-10"
    >
      {CARD_DEFS.slice(0, visibleCount).map((def, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const cursorMul = 0.24 + i * 0.015;
        const animY = reduceMotion ? 0 : (i % 2 === 0 ? -12 : 12) * pos.animationScale;
        const animRot = reduceMotion ? 0 : (i % 2 === 0 ? 1.4 : -1.4) * pos.animationScale;

        return (
          <motion.div
            key={def.id}
            className="absolute"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.w,
              x: cursorOffset.x * cursorMul,
              y: cursorOffset.y * cursorMul,
            }}
            animate={
              reduceMotion
                ? undefined
                : { y: [0, animY, 0], rotate: [0, animRot, 0] }
            }
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <InteractiveCard
              image={
                <Image
                  src={def.image}
                  alt={def.label}
                  width={240}
                  height={160}
                  className="h-28 w-full rounded-xl object-cover"
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
  );
}
