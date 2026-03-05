"use client";

import { motion } from "framer-motion";
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
    return `perspective(600px) rotateY(-8deg) ${baseTransform}`.trim();
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
    }
  | {
      kind: "quad";
      productType: MockupProductType;
      generatedImage: string;
      quadMatrix: string;
      onLoad: (width: number, height: number) => void;
    };

export function ArtworkLayer(props: ArtworkLayerProps) {
  const productType = props.productType;
  const mixBlendMode = getMixBlendMode(productType);

  if (props.kind === "rect") {
    const { generatedImage, rectPlacementPx, onLoad } = props;
    const baseTransform = `rotate(${rectPlacementPx.rotateDeg}deg)`;
    const transform = getArtworkTransform(productType, baseTransform, false);
    return (
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
          opacity: 1,
          filter: "none",
          mixBlendMode,
        }}
      />
    );
  }

  const { generatedImage, quadMatrix, onLoad } = props;
  const transform = getArtworkTransform(productType, quadMatrix, true);
  return (
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
        opacity: 1,
        filter: "none",
        mixBlendMode,
      }}
    />
  );
}
