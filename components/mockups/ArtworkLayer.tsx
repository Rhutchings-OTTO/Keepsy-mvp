"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { PixelRect } from "@/lib/placement/fitArtworkToBoundary";
import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

type RectPlacement = {
  boundary: PixelRect;
  artworkRect: PixelRect;
  rotateDeg: number;
};

const DARK_GARMENT_COLORS: MockupColor[] = ["black", "blue"];

function isDarkGarment(productType: MockupProductType, color?: MockupColor): boolean {
  if (productType !== "tshirt" && productType !== "hoodie") return false;
  return !!color && DARK_GARMENT_COLORS.includes(color);
}

/**
 * White apparel: multiply lets fabric shadows/texture show through the design (great for white shirts).
 * Dark apparel: normal keeps design colours vibrant — multiply on black/blue tints the design dark.
 * Mug/Card: normal (no fabric to blend through).
 */
function getMixBlendMode(productType: MockupProductType, color?: MockupColor): CSSProperties["mixBlendMode"] {
  if (productType === "tshirt" || productType === "hoodie") {
    return isDarkGarment(productType, color) ? "normal" : "multiply";
  }
  return "normal";
}

/** Subtle perspective to match product angle. Mug gets rotateY for cylindrical curve. */
function getArtworkTransform(
  productType: MockupProductType,
  baseTransform: string,
  isQuad: boolean
): string {
  if (productType === "mug" && !isQuad) {
    // Gentle cylindrical curve only — no skewY which causes visible tilt at larger print sizes
    return `perspective(1200px) rotateY(-8deg) scaleX(0.96) ${baseTransform}`.trim();
  }
  return baseTransform;
}

type ArtworkLayerProps =
  | {
      kind: "rect";
      productType: MockupProductType;
      color?: MockupColor;
      generatedImage: string;
      rectPlacementPx: RectPlacement;
      onLoad: (width: number, height: number) => void;
      opacity?: number;
      dropShadow?: string;
    }
  | {
      kind: "quad";
      productType: MockupProductType;
      color?: MockupColor;
      generatedImage: string;
      quadMatrix: string;
      onLoad: (width: number, height: number) => void;
      opacity?: number;
      dropShadow?: string;
    };

function getArtworkFilter(productType: MockupProductType, color?: MockupColor, dropShadow?: string): string {
  const darkApparel = isDarkGarment(productType, color);
  const tonal =
    productType === "mug"
      ? "saturate(0.95) contrast(1.02) brightness(0.98)"
      : productType === "card"
        ? "saturate(0.94) contrast(1.01) brightness(0.99)"
        : darkApparel
          // Dark garment: full saturation + slight brightness boost so DTG design stays vivid
          ? "saturate(1.0) contrast(1.02) brightness(1.01)"
          // White garment: gentle desaturation mimics real DTG ink absorption into fabric
          : "saturate(0.9) contrast(1.06) brightness(0.96)";
  return dropShadow ? `${tonal} drop-shadow(${dropShadow})` : tonal;
}

function getTextureVeil(productType: MockupProductType): CSSProperties | null {
  if (productType === "tshirt" || productType === "hoodie") {
    return {
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px)",
      opacity: 0.22,
      mixBlendMode: "soft-light",
    };
  }
  if (productType === "card") {
    // Paper grain: denser diagonal pattern at slightly higher opacity for premium card stock feel
    return {
      backgroundImage:
        "repeating-linear-gradient(47deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 2px, rgba(0,0,0,0.045) 2px, rgba(0,0,0,0.045) 4px)",
      opacity: 0.28,
      mixBlendMode: "multiply",
    };
  }
  if (productType === "mug") {
    // Ceramic specular: strong diagonal highlight streak simulating glossy glaze sheen
    return {
      background:
        "linear-gradient(108deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.52) 24%, rgba(255,255,255,0.18) 38%, rgba(255,255,255,0.0) 52%, rgba(255,255,255,0.06) 80%, rgba(0,0,0,0.06) 100%)",
      opacity: 0.42,
      mixBlendMode: "screen",
    };
  }
  return null;
}

function getSurfaceShape(productType: MockupProductType): CSSProperties {
  if (productType === "mug") {
    return { borderRadius: "12% / 4%" };
  }
  if (productType === "card") {
    return { borderRadius: "1.2%" };
  }
  return { borderRadius: "1.5%" };
}

export function ArtworkLayer(props: ArtworkLayerProps) {
  const productType = props.productType;
  const color = props.color;
  const mixBlendMode = getMixBlendMode(productType, color);
  const textureVeil = getTextureVeil(productType);
  const surfaceShape = getSurfaceShape(productType);

  if (props.kind === "rect") {
    const { generatedImage, rectPlacementPx, onLoad, opacity, dropShadow } = props;
    const baseTransform = `rotate(${rectPlacementPx.rotateDeg}deg)`;
    const transform = getArtworkTransform(productType, baseTransform, false);
    return (
      <>
        <motion.img
          key={`art-rect-${generatedImage.slice(0, 50)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          src={generatedImage}
          alt="Applied design"
          className="absolute"
          onLoad={(e) => {
            const t = e.currentTarget;
            onLoad(t.naturalWidth || 1024, t.naturalHeight || 1024);
          }}
          style={{
            left: rectPlacementPx.artworkRect.x,
            top: rectPlacementPx.artworkRect.y,
            width: rectPlacementPx.artworkRect.w,
            height: rectPlacementPx.artworkRect.h,
            objectFit: "contain",
            transformOrigin: "center center",
            transform,
            opacity: opacity ?? 0.96,
            filter: getArtworkFilter(productType, color, dropShadow),
            mixBlendMode,
            ...surfaceShape,
          }}
        />
        {textureVeil && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: rectPlacementPx.artworkRect.x,
              top: rectPlacementPx.artworkRect.y,
              width: rectPlacementPx.artworkRect.w,
              height: rectPlacementPx.artworkRect.h,
              transformOrigin: "center center",
              transform,
              ...textureVeil,
              ...surfaceShape,
            }}
            aria-hidden
          />
        )}
      </>
    );
  }

  const { generatedImage, quadMatrix, onLoad, opacity, dropShadow } = props;
  const transform = getArtworkTransform(productType, quadMatrix, true);
  return (
    <>
      <motion.img
        key={`art-quad-${generatedImage.slice(0, 50)}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        src={generatedImage}
        alt="Applied design"
        className="absolute left-0 top-0"
        width={1000}
        height={1000}
        onLoad={(e) => {
          const t = e.currentTarget;
          onLoad(t.naturalWidth || 1024, t.naturalHeight || 1024);
        }}
        style={{
          width: 1000,
          height: 1000,
          objectFit: "contain",
          transformOrigin: "0 0",
          transform,
          opacity: opacity ?? 0.96,
          filter: getArtworkFilter(productType, color, dropShadow),
          mixBlendMode,
          ...surfaceShape,
        }}
      />
      {textureVeil && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: 1000,
            height: 1000,
            transformOrigin: "0 0",
            transform,
            ...textureVeil,
            ...surfaceShape,
          }}
          aria-hidden
        />
      )}
    </>
  );
}
