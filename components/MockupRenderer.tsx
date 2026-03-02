"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import PerspT from "perspective-transform";
import PrintAreaOverlay from "@/components/PrintAreaOverlay";
import { fitArtworkToBoundary, type PixelRect } from "@/lib/placement/fitArtworkToBoundary";
import {
  getPlacement,
  placements as staticPlacements,
  type MockupColor,
  type MockupProductType,
  type PlacementQuad,
  type PlacementQuadPoint,
  type PlacementRect,
  type PlacementMap,
} from "@/lib/mockups/placements";

const DEBUG_PLACEMENT = process.env.NODE_ENV === "development";

type MockupRendererProps = {
  productType: MockupProductType;
  color: MockupColor;
  generatedImage: string | null;
  hasArtwork?: boolean;
  className?: string;
};

function rectToQuad(rect: PlacementRect): PlacementQuad {
  const boundary = rect.boundary;
  const derivedHalfW = boundary
    ? Math.max(0, Math.min(rect.xPct - boundary.leftPct, boundary.rightPct - rect.xPct))
    : rect.wPct / 2;
  const derivedHalfH = boundary
    ? Math.max(0, Math.min(rect.yPct - boundary.topPct, boundary.bottomPct - rect.yPct))
    : rect.hPct / 2;

  const hw = derivedHalfW;
  const hh = derivedHalfH;
  const angle = (rect.rotateDeg * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const center = { x: rect.xPct, y: rect.yPct };
  const rotate = (x: number, y: number): PlacementQuadPoint => ({
    xPct: center.x + x * cos - y * sin,
    yPct: center.y + x * sin + y * cos,
  });
  return {
    tl: rotate(-hw, -hh),
    tr: rotate(hw, -hh),
    br: rotate(hw, hh),
    bl: rotate(-hw, hh),
  };
}

export function MockupRenderer({
  productType,
  color,
  generatedImage,
  hasArtwork,
  className,
}: MockupRendererProps) {
  const [runtimePlacements, setRuntimePlacements] = useState<PlacementMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [artNaturalSize, setArtNaturalSize] = useState({ width: 1024, height: 1024 });
  const prevColorRef = useRef<MockupColor>(color);
  const prevImageRef = useRef<string | null>(generatedImage);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/mockup-placements", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { placements?: PlacementMap };
        if (active && json.placements) setRuntimePlacements(json.placements);
      } catch {
        // fallback to static placements
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const activeMap = runtimePlacements ?? staticPlacements;
  const byProduct = activeMap[productType];
  const entry = (byProduct?.[color] || byProduct?.white || getPlacement(productType, color));
  const artworkPresent = hasArtwork ?? Boolean(generatedImage);
  const activeQuad =
    entry.placement.kind === "quad" ? entry.placement.quad : rectToQuad(entry.placement.rect);

  useEffect(() => {
    if (!DEBUG_PLACEMENT) {
      prevColorRef.current = color;
      prevImageRef.current = generatedImage;
      return;
    }
    const colorChanged = prevColorRef.current !== color;
    const imageChanged = prevImageRef.current !== generatedImage;
    if (colorChanged && imageChanged && prevImageRef.current && generatedImage) {
      console.error("[MockupRenderer] Artwork source changed when color switched. Expected same image src.");
    }
    prevColorRef.current = color;
    prevImageRef.current = generatedImage;
  }, [color, generatedImage]);

  const quadMatrix = useMemo(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) return null;
    const quad = activeQuad;
    const srcW = 1000;
    const srcH = 1000;
    const srcPts = [0, 0, srcW, 0, srcW, srcH, 0, srcH];
    const dstPts = [
      (quad.tl.xPct / 100) * containerSize.width,
      (quad.tl.yPct / 100) * containerSize.height,
      (quad.tr.xPct / 100) * containerSize.width,
      (quad.tr.yPct / 100) * containerSize.height,
      (quad.br.xPct / 100) * containerSize.width,
      (quad.br.yPct / 100) * containerSize.height,
      (quad.bl.xPct / 100) * containerSize.width,
      (quad.bl.yPct / 100) * containerSize.height,
    ];
    const transform = PerspT(srcPts, dstPts);
    const c = transform.coeffs;
    if (!Array.isArray(c) || c.length < 9) return null;

    // map projective coefficients to CSS matrix3d
    return `matrix3d(${c[0]},${c[3]},0,${c[6]},${c[1]},${c[4]},0,${c[7]},0,0,1,0,${c[2]},${c[5]},0,1)`;
  }, [activeQuad, containerSize.width, containerSize.height]);

  const rectPlacementPx = useMemo(() => {
    if (entry.placement.kind !== "rect") return null;
    if (containerSize.width <= 0 || containerSize.height <= 0) return null;
    const rect = entry.placement.rect;
    const boundary: PixelRect = {
      x: (rect.xPct / 100) * containerSize.width - (rect.wPct / 100) * containerSize.width / 2,
      y: (rect.yPct / 100) * containerSize.height - (rect.hPct / 100) * containerSize.height / 2,
      w: (rect.wPct / 100) * containerSize.width,
      h: (rect.hPct / 100) * containerSize.height,
    };
    const artworkRect = fitArtworkToBoundary({
      boundary,
      imageWidth: artNaturalSize.width,
      imageHeight: artNaturalSize.height,
      mode: "contain",
    });
    return { boundary, artworkRect, rotateDeg: rect.rotateDeg };
  }, [artNaturalSize.height, artNaturalSize.width, containerSize.height, containerSize.width, entry.placement]);

  useEffect(() => {
    if (!DEBUG_PLACEMENT || !rectPlacementPx) return;
    const boundaryCenterX = rectPlacementPx.boundary.x + rectPlacementPx.boundary.w / 2;
    const boundaryCenterY = rectPlacementPx.boundary.y + rectPlacementPx.boundary.h / 2;
    const artworkCenterX = rectPlacementPx.artworkRect.x + rectPlacementPx.artworkRect.w / 2;
    const artworkCenterY = rectPlacementPx.artworkRect.y + rectPlacementPx.artworkRect.h / 2;
    const deltaX = Math.abs(boundaryCenterX - artworkCenterX);
    const deltaY = Math.abs(boundaryCenterY - artworkCenterY);
    if (deltaX > 1 || deltaY > 1) {
      console.error("[MockupRenderer] Artwork center mismatch >1px", { deltaX, deltaY });
    }
  }, [rectPlacementPx]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl border border-black/10 bg-[#F5F5F6] shadow-2xl ${className ?? ""}`}
      style={{ aspectRatio: `${entry.aspectRatio}` }}
    >
      <Image
        src={entry.baseMockupSrc}
        alt={`${productType} mockup`}
        fill
        className="object-cover"
        quality={100}
        sizes="(max-width: 1024px) 100vw, 700px"
      />
      <PrintAreaOverlay
        productType={productType}
        isActive={true}
        hasArtwork={artworkPresent}
      />
      {generatedImage && (
        <>
          {entry.placement.kind === "rect" && rectPlacementPx ? (
            <motion.img
              key={`${productType}-${color}-${generatedImage}-rect`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              src={generatedImage}
              alt="Applied design"
              className="absolute"
              onLoad={(event) => {
                const target = event.currentTarget;
                const width = target.naturalWidth || 1024;
                const height = target.naturalHeight || 1024;
                setArtNaturalSize({ width, height });
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
          ) : null}
          {entry.placement.kind === "quad" && quadMatrix ? (
            <motion.img
              key={`${productType}-${color}-${generatedImage}-quad`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              src={generatedImage}
              alt="Applied design"
              className="absolute left-0 top-0"
              width={1000}
              height={1000}
              onLoad={(event) => {
                const target = event.currentTarget;
                const width = target.naturalWidth || 1024;
                const height = target.naturalHeight || 1024;
                setArtNaturalSize({ width, height });
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
          ) : null}
          {DEBUG_PLACEMENT && rectPlacementPx ? (
            <div className="pointer-events-none absolute inset-0 z-30">
              <div
                className="absolute border border-emerald-400/90"
                style={{
                  left: rectPlacementPx.boundary.x,
                  top: rectPlacementPx.boundary.y,
                  width: rectPlacementPx.boundary.w,
                  height: rectPlacementPx.boundary.h,
                }}
              />
              <div
                className="absolute border border-fuchsia-500/90"
                style={{
                  left: rectPlacementPx.artworkRect.x,
                  top: rectPlacementPx.artworkRect.y,
                  width: rectPlacementPx.artworkRect.w,
                  height: rectPlacementPx.artworkRect.h,
                }}
              />
              <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400 bg-white/80"
                style={{
                  left: rectPlacementPx.boundary.x + rectPlacementPx.boundary.w / 2,
                  top: rectPlacementPx.boundary.y + rectPlacementPx.boundary.h / 2,
                }}
              />
              <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-500 bg-white/80"
                style={{
                  left: rectPlacementPx.artworkRect.x + rectPlacementPx.artworkRect.w / 2,
                  top: rectPlacementPx.artworkRect.y + rectPlacementPx.artworkRect.h / 2,
                }}
              />
            </div>
          ) : null}
        </>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.08]" />
    </div>
  );
}
