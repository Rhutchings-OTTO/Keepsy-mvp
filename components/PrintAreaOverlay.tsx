"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PRINT_AREAS, type ProductType } from "@/lib/printAreas";

type PrintAreaOverlayProps = {
  productType: ProductType;
  isActive: boolean;
  hasArtwork: boolean;
  className?: string;
};

const COPY: Record<ProductType, string> = {
  card: "Your message / artwork here",
  hoodie: "Your artwork here",
  tshirt: "Your artwork here",
  mug: "Your artwork here",
};

export default function PrintAreaOverlay({
  productType,
  isActive,
  hasArtwork,
  className,
}: PrintAreaOverlayProps) {
  const reduceMotion = useReducedMotion();
  const area = PRINT_AREAS[productType];
  const isVisible = isActive && !hasArtwork;

  return (
    <motion.div
      key={`${productType}-${isVisible ? "on" : "off"}`}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 ${className ?? ""}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.99 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: "easeOut" }}
    >
      <div
        className="absolute rounded-[18px] border border-dashed border-white/75 bg-white/[0.10] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_0_28px_rgba(255,255,255,0.16)_inset]"
        style={{
          left: `${area.x - area.w / 2}%`,
          top: `${area.y - area.h / 2}%`,
          width: `${area.w}%`,
          height: `${area.h}%`,
          transform: `rotate(${area.r ?? 0}deg)`,
          transformOrigin: "center",
        }}
      >
        <div className="flex h-full items-center justify-center">
          <span className="rounded-full bg-black/28 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur-[1px]">
            {COPY[productType]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

