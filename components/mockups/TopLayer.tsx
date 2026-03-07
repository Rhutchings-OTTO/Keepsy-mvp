"use client";

import Image from "next/image";
import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

const DARK_GARMENT_COLORS: MockupColor[] = ["black", "blue"];

function isDarkGarment(productType: MockupProductType, color: MockupColor): boolean {
  if (productType !== "tshirt" && productType !== "hoodie") return false;
  return DARK_GARMENT_COLORS.includes(color);
}

/**
 * How much of the base mockup image to multiply on top of the artwork.
 * On dark garments: the base image is mostly dark pixels — multiply at high opacity
 * would crush the design to near-black. Drop to near zero and rely on screen instead.
 * On white garments: multiply at normal strength shows fabric folds/shadows nicely.
 */
function getRelightOpacity(productType: MockupProductType, color: MockupColor): number {
  const dark = isDarkGarment(productType, color);
  if (productType === "hoodie") return dark ? 0.13 : 0.62;
  if (productType === "tshirt") return dark ? 0.10 : 0.48;
  if (productType === "card") return 0.42;
  return 0.36; // mug
}

/**
 * How much of the base mockup image to screen on top (brightens highlights).
 * On dark garments: screen is the primary way to show drawstrings and fold edges —
 * light pixels in the base image punch through at higher opacity.
 * On white garments: lower opacity; fabric detail is already visible via multiply.
 */
function getHighlightOpacity(productType: MockupProductType, color: MockupColor): number {
  const dark = isDarkGarment(productType, color);
  if (productType === "hoodie") return dark ? 0.58 : 0.32;
  if (productType === "tshirt") return dark ? 0.36 : 0.18;
  if (productType === "card") return 0.16;
  return 0.2; // mug
}

/**
 * For hoodies: a thin "normal" blend pass renders the full garment image at low opacity
 * directly over the design. This ensures structural elements — drawstrings, pockets, seams —
 * are visible regardless of their colour (screen can't recover dark drawstrings on dark fabric,
 * but normal blend at low opacity shows them as the subtle structure they are in reality).
 */
function getHoodieStructureOpacity(color: MockupColor): number {
  // White hoodie: structural overlay washes out the design slightly — keep low
  // Dark hoodies: same opacity; at 0.16-0.18 it darkens the design minimally but shows structure
  return color === "white" ? 0.14 : 0.18;
}

type TopLayerProps = {
  productType: MockupProductType;
  color: MockupColor;
  baseMockupSrc: string;
};

export function TopLayer({ productType, color, baseMockupSrc }: TopLayerProps) {
  return (
    <>
      {/* Shadow / fabric fold mapping — multiply pass */}
      <Image
        src={baseMockupSrc}
        alt=""
        fill
        className="pointer-events-none absolute inset-0 z-30 object-contain"
        aria-hidden
        sizes="(max-width: 1024px) 100vw, 700px"
        style={{
          opacity: getRelightOpacity(productType, color),
          mixBlendMode: "multiply",
        }}
      />
      {/* Highlight / drawstring recovery — screen pass */}
      <Image
        src={baseMockupSrc}
        alt=""
        fill
        className="pointer-events-none absolute inset-0 z-[31] object-contain"
        aria-hidden
        sizes="(max-width: 1024px) 100vw, 700px"
        style={{
          opacity: getHighlightOpacity(productType, color),
          mixBlendMode: "screen",
        }}
      />
      {/* Final ambient lighting gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-[32]"
        style={{
          background:
            productType === "mug"
              ? "linear-gradient(96deg, rgba(255,255,255,0.28) 12%, rgba(255,255,255,0) 36%, rgba(255,255,255,0.1) 78%, rgba(0,0,0,0.05) 100%)"
              : productType === "card"
                ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0.05) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.09) 100%)",
          mixBlendMode: "soft-light",
        }}
        aria-hidden
      />
      {/* Hoodie-only: garment structure layer — normal blend at low opacity makes drawstrings,
          pocket seams, and cord hardware visible over the design on all hoodie colours.
          Screen/multiply alone can't recover dark-coloured drawstrings on dark fabric.
          At 0.14-0.18 opacity, the design colours remain vibrant but the garment wins
          wherever structural elements are prominent (cord holes, hem seam, drawstrings). */}
      {productType === "hoodie" && (
        <Image
          src={baseMockupSrc}
          alt=""
          fill
          className="pointer-events-none absolute inset-0 z-[33] object-contain"
          aria-hidden
          sizes="(max-width: 1024px) 100vw, 700px"
          style={{
            opacity: getHoodieStructureOpacity(color),
            mixBlendMode: "normal",
          }}
        />
      )}
    </>
  );
}
