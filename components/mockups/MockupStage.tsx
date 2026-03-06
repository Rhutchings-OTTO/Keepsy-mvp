"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PerspT from "perspective-transform";
import { fitArtworkToBoundary, type PixelRect } from "@/lib/placement/fitArtworkToBoundary";
import {
  getPlacement,
  placements as staticPlacements,
  type MockupColor,
  type MockupProductType,
  type PlacementMap,
  type PlacementQuad,
  type PlacementRect,
} from "@/lib/mockups/placements";
import { BaseMockupLayer } from "./BaseMockupLayer";
import { ArtworkLayer } from "./ArtworkLayer";
import { PrintAreaGlassOverlay } from "./PrintAreaGlassOverlay";
import { TopLayer } from "./TopLayer";

const DEBUG_PLACEMENT = process.env.NODE_ENV === "development";

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
  const rotate = (x: number, y: number) => ({
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

export type MockupStageProps = {
  productType: MockupProductType;
  color: MockupColor;
  generatedImage: string | null;
  hasArtwork?: boolean;
  className?: string;
};

function insetRect(rect: PixelRect, insetX: number, insetY: number): PixelRect {
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    w: Math.max(0, rect.w - insetX * 2),
    h: Math.max(0, rect.h - insetY * 2),
  };
}

export function MockupStage({
  productType,
  color,
  generatedImage,
  hasArtwork,
  className = "",
}: MockupStageProps) {
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
        // fallback to static
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      setContainerSize({ width: e.contentRect.width, height: e.contentRect.height });
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const activeMap = runtimePlacements ?? staticPlacements;
  const byProduct = activeMap[productType];
  const entry = byProduct?.[color] || byProduct?.white || getPlacement(productType, color);
  const artworkPresent = hasArtwork ?? Boolean(generatedImage);
  const activeQuad =
    entry.placement.kind === "quad" ? entry.placement.quad : rectToQuad(entry.placement.rect);

  useEffect(() => {
    if (!DEBUG_PLACEMENT) {
      prevColorRef.current = color;
      prevImageRef.current = generatedImage;
      return;
    }
    if (prevColorRef.current !== color && prevImageRef.current !== generatedImage && prevImageRef.current && generatedImage) {
      console.error("[MockupStage] Artwork source changed when color switched. Expected same image src.");
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
    const matteRect =
      productType === "card"
        ? insetRect(boundary, boundary.w * 0.055, boundary.h * 0.07)
        : null;
    const artworkBoundary =
      productType === "card" && matteRect
        ? insetRect(matteRect, matteRect.w * 0.055, matteRect.h * 0.07)
        : boundary;
    const artworkRect = fitArtworkToBoundary({
      boundary: artworkBoundary,
      imageWidth: artNaturalSize.width,
      imageHeight: artNaturalSize.height,
      mode: "contain",
    });
    return { boundary, matteRect, artworkRect, rotateDeg: rect.rotateDeg };
  }, [artNaturalSize, containerSize, entry.placement, productType]);

  useEffect(() => {
    if (!DEBUG_PLACEMENT || !rectPlacementPx) return;
    const bcx = rectPlacementPx.boundary.x + rectPlacementPx.boundary.w / 2;
    const bcy = rectPlacementPx.boundary.y + rectPlacementPx.boundary.h / 2;
    const acx = rectPlacementPx.artworkRect.x + rectPlacementPx.artworkRect.w / 2;
    const acy = rectPlacementPx.artworkRect.y + rectPlacementPx.artworkRect.h / 2;
    if (Math.abs(bcx - acx) > 1 || Math.abs(bcy - acy) > 1) {
      console.error("[MockupStage] Artwork center mismatch >1px");
    }
  }, [rectPlacementPx]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-[#FAF9F7] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_0_0_rgba(255,255,255,0.8)_inset] ${className}`}
      style={{ aspectRatio: `${entry.aspectRatio}` }}
    >
      <div className="absolute inset-[1px] overflow-hidden rounded-[22px] bg-[#F5F4F2]">
        {/* LAYER 1 (Bottom): Static product base - fabric/ceramic texture */}
        <BaseMockupLayer
          baseMockupSrc={entry.baseMockupSrc}
          productType={productType}
          aspectRatio={entry.aspectRatio}
        />

        {/* LAYER 2 (Middle): AI artwork - ONLY this re-renders when prompt changes */}
        {generatedImage && (
          <div className="absolute inset-0 z-10">
            {entry.placement.kind === "rect" && rectPlacementPx && (
              <ArtworkLayer
                kind="rect"
                productType={productType}
                generatedImage={generatedImage}
                rectPlacementPx={rectPlacementPx}
                onLoad={(w, h) => setArtNaturalSize({ width: w, height: h })}
                opacity={entry.opacity}
                dropShadow={entry.dropShadow}
              />
            )}
            {entry.placement.kind === "quad" && quadMatrix && (
              <ArtworkLayer
                kind="quad"
                productType={productType}
                generatedImage={generatedImage}
                quadMatrix={quadMatrix}
                onLoad={(w, h) => setArtNaturalSize({ width: w, height: h })}
                opacity={entry.opacity}
                dropShadow={entry.dropShadow}
              />
            )}
            {DEBUG_PLACEMENT && rectPlacementPx && (
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
              </div>
            )}
          </div>
        )}

        {/* Glass overlay when no artwork */}
        <PrintAreaGlassOverlay
          productType={productType}
          isActive={true}
          hasArtwork={artworkPresent}
        />

        {/* LAYER 3 (Top): Drawstrings, mug reflections, shadows - FIXED, never re-renders on prompt change */}
        <TopLayer productType={productType} color={color} baseMockupSrc={entry.baseMockupSrc} />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.06]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              productType === "mug"
                ? "radial-gradient(80% 100% at 30% 40%, rgba(255,255,255,0.14) 0%, transparent 60%)"
                : "radial-gradient(70% 85% at 50% 28%, rgba(255,255,255,0.1) 0%, transparent 65%)",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
