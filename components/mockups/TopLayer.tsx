"use client";

import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

/** Transparent PNG overlays: drawstrings, mug reflections, card shadows. Fixed - never re-renders on prompt change. */
const TOP_LAYER_SOURCES: Record<MockupProductType, string> = {
  hoodie: "/mockups/hoodie-top-layer.png",
  tshirt: "/mockups/tee-top-layer.png",
  mug: "/mockups/mug-top-layer.png",
  card: "/mockups/card-top-layer.png",
};

function getTopLayerSrc(productType: MockupProductType, _color: MockupColor): string | null {
  return TOP_LAYER_SOURCES[productType] ?? null;
}

type TopLayerProps = {
  productType: MockupProductType;
  color: MockupColor;
};

export function TopLayer({ productType, color }: TopLayerProps) {
  const src = getTopLayerSrc(productType, color);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className="pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
      aria-hidden
    />
  );
}
