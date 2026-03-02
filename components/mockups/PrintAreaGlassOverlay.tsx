"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PRINT_AREAS, type ProductType } from "@/lib/printAreas";

type Props = {
  productType: ProductType;
  isActive: boolean;
  hasArtwork: boolean;
  className?: string;
};

const COPY: Record<ProductType, string> = {
  card: "Your message / artwork here",
  hoodie: "Your design will appear here",
  tshirt: "Your design will appear here",
  mug: "Your design will appear here",
};

export function PrintAreaGlassOverlay({ productType, isActive, hasArtwork, className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const area = PRINT_AREAS[productType];
  const isVisible = isActive && !hasArtwork;

  return (
    <motion.div
      key={`${productType}-${isVisible ? "on" : "off"}`}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 ${className}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.99 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: "easeOut" }}
    >
      <div
        className="absolute rounded-2xl border border-white/30 bg-white/[0.12] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_24px_rgba(0,0,0,0.06)]"
        style={{
          left: `${area.x - area.w / 2}%`,
          top: `${area.y - area.h / 2}%`,
          width: `${area.w}%`,
          height: `${area.h}%`,
          transform: `rotate(${area.r ?? 0}deg)`,
          transformOrigin: "center",
        }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="text-xs font-semibold tracking-wide text-black/70">{COPY[productType]}</span>
          <span className="text-[10px] font-medium text-black/45">Generate or upload to preview</span>
        </div>
      </div>
    </motion.div>
  );
}
