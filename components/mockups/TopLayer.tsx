"use client";

import Image from "next/image";
import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

function getRelightOpacity(productType: MockupProductType): number {
  if (productType === "hoodie") return 0.62;
  if (productType === "tshirt") return 0.48;
  if (productType === "card") return 0.42;
  return 0.36;
}

function getHighlightOpacity(productType: MockupProductType): number {
  if (productType === "hoodie") return 0.22;
  if (productType === "tshirt") return 0.18;
  if (productType === "card") return 0.16;
  return 0.2;
}

type TopLayerProps = {
  productType: MockupProductType;
  color: MockupColor;
  baseMockupSrc: string;
};

export function TopLayer({ productType, color, baseMockupSrc }: TopLayerProps) {
  return (
    <>
      <Image
        src={baseMockupSrc}
        alt=""
        fill
        className="pointer-events-none absolute inset-0 z-30 object-contain"
        aria-hidden
        sizes="(max-width: 1024px) 100vw, 700px"
        style={{
          opacity: color === "black" ? getRelightOpacity(productType) * 0.82 : getRelightOpacity(productType),
          mixBlendMode: productType === "card" ? "multiply" : "multiply",
        }}
      />
      <Image
        src={baseMockupSrc}
        alt=""
        fill
        className="pointer-events-none absolute inset-0 z-[31] object-contain"
        aria-hidden
        sizes="(max-width: 1024px) 100vw, 700px"
        style={{
          opacity: getHighlightOpacity(productType),
          mixBlendMode: "screen",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[32]"
        style={{
          background:
            productType === "mug"
              ? "linear-gradient(96deg, rgba(255,255,255,0.28) 12%, rgba(255,255,255,0) 36%, rgba(255,255,255,0.1) 78%, rgba(0,0,0,0.05) 100%)"
              : productType === "card"
                ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0.05) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.09) 100%)",
          opacity: color === "black" ? 0.76 : 1,
          mixBlendMode: "soft-light",
        }}
        aria-hidden
      />
    </>
  );
}
