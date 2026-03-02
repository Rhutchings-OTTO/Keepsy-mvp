"use client";

import { motion } from "framer-motion";
import type { PixelRect } from "@/lib/placement/fitArtworkToBoundary";

type RectPlacement = {
  boundary: PixelRect;
  artworkRect: PixelRect;
  rotateDeg: number;
};

type ArtworkLayerProps =
  | {
      kind: "rect";
      generatedImage: string;
      rectPlacementPx: RectPlacement;
      onLoad: (width: number, height: number) => void;
    }
  | {
      kind: "quad";
      generatedImage: string;
      quadMatrix: string;
      onLoad: (width: number, height: number) => void;
    };

export function ArtworkLayer(props: ArtworkLayerProps) {
  if (props.kind === "rect") {
    const { generatedImage, rectPlacementPx, onLoad } = props;
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
          transform: `rotate(${rectPlacementPx.rotateDeg}deg)`,
          opacity: 1,
          filter: "none",
          mixBlendMode: "normal",
        }}
      />
    );
  }

  const { generatedImage, quadMatrix, onLoad } = props;
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
        transform: quadMatrix,
        opacity: 1,
        filter: "none",
        mixBlendMode: "normal",
      }}
    />
  );
}
