"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { PixelRect } from "@/lib/placement/fitArtworkToBoundary";
import type { MockupProductType } from "@/lib/mockups/placements";

type RectPlacement = {
  boundary: PixelRect;
  artworkRect: PixelRect;
  rotateDeg: number;
};

/** multiply for hoodie/tee (fabric texture shows through), normal for mug/card */
function getMixBlendMode(productType: MockupProductType): "multiply" | "normal" {
  return productType === "tshirt" || productType === "hoodie" ? "multiply" : "normal";
}

/** Subtle perspective to match product angle. Mug gets rotateY for cylindrical curve. */
function getArtworkTransform(
  productType: MockupProductType,
  baseTransform: string,
  isQuad: boolean
): string {
  if (productType === "mug" && !isQuad) {
    return `perspective(900px) rotateY(-14deg) scaleX(0.92) skewY(-1deg) ${baseTransform}`.trim();
  }
  return baseTransform;
}

type ArtworkLayerProps =
  | {
      kind: "rect";
      productType: MockupProductType;
      generatedImage: string;
      rectPlacementPx: RectPlacement;
      onLoad: (width: number, height: number) => void;
      opacity?: number;
      dropShadow?: string;
    }
  | {
      kind: "quad";
      productType: MockupProductType;
      generatedImage: string;
      quadMatrix: string;
      onLoad: (width: number, height: number) => void;
      opacity?: number;
      dropShadow?: string;
    };

function getArtworkFilter(productType: MockupProductType, dropShadow?: string): string {
  const tonal =
    productType === "mug"
      ? "saturate(0.95) contrast(1.02) brightness(0.98)"
      : productType === "card"
        ? "saturate(0.94) contrast(1.01) brightness(0.99)"
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
    return {
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
      opacity: 0.16,
      mixBlendMode: "multiply",
    };
  }
  if (productType === "mug") {
    return {
      background:
        "linear-gradient(96deg, rgba(255,255,255,0.22) 8%, rgba(255,255,255,0) 28%, rgba(255,255,255,0.12) 76%, rgba(0,0,0,0.04) 100%)",
      opacity: 0.24,
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
  const mixBlendMode = getMixBlendMode(productType);
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
            filter: getArtworkFilter(productType, dropShadow),
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
          filter: getArtworkFilter(productType, dropShadow),
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
