"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PRINT_AREAS, type ProductType } from "@/lib/printAreas";

type Props = {
  productType: ProductType;
  isActive: boolean;
  hasArtwork: boolean;
  className?: string;
};

export function PrintAreaGlassOverlay({
  productType,
  isActive,
  hasArtwork,
  className = "",
}: Props) {
  const reduceMotion = useReducedMotion();
  const area = PRINT_AREAS[productType];
  const isVisible = isActive && !hasArtwork;

  return (
    <motion.div
      key={`${productType}-${isVisible ? "on" : "off"}`}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0.1 : 0.25, ease: "easeOut" }}
    >
      <div
        className="absolute rounded-xl border border-white/40 bg-white/[0.14] backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]"
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
          <span
            className={`${productType === "tshirt" ? "text-[10px]" : "text-xs"} font-medium leading-tight text-(--color-charcoal)/70`}
          >
            Your design appears here
          </span>
        </div>
      </div>
    </motion.div>
  );
}
