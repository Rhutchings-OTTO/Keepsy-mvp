"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import PrintAreaOverlay from "@/components/PrintAreaOverlay";
import {
  getPlacement,
  placements as staticPlacements,
  type MockupColor,
  type MockupProductType,
  type PlacementRect,
  type PlacementEntry,
  type PlacementMap,
} from "@/lib/mockups/placements";
import { fitArtworkToBoundary, type PixelRect } from "@/lib/placement/fitArtworkToBoundary";

type MockupRendererProps = {
  productType: MockupProductType;
  color: MockupColor;
  generatedImage: string | null;
  hasArtwork?: boolean;
  className?: string;
};

const DEBUG_PLACEMENT = process.env.NODE_ENV === "development";

function resolvePlacementEntry(
  activeMap: PlacementMap,
  productType: MockupProductType,
  color: MockupColor,
): PlacementEntry {
  const byProduct = activeMap[productType];
  if (!byProduct) return getPlacement(productType, color);

  const colorEntry = byProduct[color] || byProduct.white;
  if (!colorEntry) return getPlacement(productType, color);

  // Keep apparel print geometry uniform across colors while allowing color-specific mockup assets.
  if (productType === "tshirt" || productType === "hoodie") {
    const uniformEntry = byProduct.white || colorEntry;
    return {
      ...colorEntry,
      placement: uniformEntry.placement,
    };
  }

  return colorEntry;
}

function rectPercentToPixels(rect: PlacementRect, width: number, height: number): PixelRect {
  return {
    x: ((rect.xPct - rect.wPct / 2) / 100) * width,
    y: ((rect.yPct - rect.hPct / 2) / 100) * height,
    w: (rect.wPct / 100) * width,
    h: (rect.hPct / 100) * height,
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
  const [sourceSize, setSourceSize] = useState({ width: 1024, height: 1024 });
  const previousColorRef = useRef<MockupColor | null>(null);
  const previousArtworkSrcRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!generatedImage) return;
    let active = true;
    const probe = new window.Image();
    probe.onload = () => {
      if (!active) return;
      setSourceSize({
        width: Math.max(1, probe.naturalWidth || 1024),
        height: Math.max(1, probe.naturalHeight || 1024),
      });
    };
    probe.src = generatedImage;
    return () => {
      active = false;
    };
  }, [generatedImage]);

  useEffect(() => {
    if (!DEBUG_PLACEMENT) {
      previousColorRef.current = color;
      previousArtworkSrcRef.current = generatedImage;
      return;
    }
    const previousColor = previousColorRef.current;
    const previousArtwork = previousArtworkSrcRef.current;
    if (
      previousColor &&
      previousColor !== color &&
      previousArtwork &&
      generatedImage &&
      previousArtwork !== generatedImage
    ) {
      console.error("[MockupRenderer] Artwork source changed when switching color.", {
        productType,
        fromColor: previousColor,
        toColor: color,
      });
    }
    previousColorRef.current = color;
    previousArtworkSrcRef.current = generatedImage;
  }, [color, generatedImage, productType]);

  const activeMap = runtimePlacements ?? staticPlacements;
  const entry = resolvePlacementEntry(activeMap, productType, color);
  const artworkPresent = hasArtwork ?? Boolean(generatedImage);
  const rectPlacement = entry.placement.kind === "rect" ? entry.placement.rect : null;

  const boundaryRectPx = useMemo(() => {
    if (!rectPlacement) return null;
    if (containerSize.width <= 0 || containerSize.height <= 0) return null;
    return rectPercentToPixels(rectPlacement, containerSize.width, containerSize.height);
  }, [containerSize.height, containerSize.width, rectPlacement]);

  const artworkRectPx = useMemo(() => {
    if (!boundaryRectPx) return null;
    return fitArtworkToBoundary({
      boundary: boundaryRectPx,
      imageWidth: sourceSize.width,
      imageHeight: sourceSize.height,
      mode: "contain",
    });
  }, [boundaryRectPx, sourceSize.height, sourceSize.width]);

  useEffect(() => {
    if (!DEBUG_PLACEMENT || !boundaryRectPx || !artworkRectPx) return;
    const boundaryCx = boundaryRectPx.x + boundaryRectPx.w / 2;
    const boundaryCy = boundaryRectPx.y + boundaryRectPx.h / 2;
    const artworkCx = artworkRectPx.x + artworkRectPx.w / 2;
    const artworkCy = artworkRectPx.y + artworkRectPx.h / 2;
    const deltaX = Math.abs(boundaryCx - artworkCx);
    const deltaY = Math.abs(boundaryCy - artworkCy);
    const withinTolerance = deltaX <= 1 && deltaY <= 1;
    if (!withinTolerance) {
      console.error("[MockupRenderer] Artwork is not centered inside boundary.", {
        productType,
        color,
        deltaX,
        deltaY,
      });
    }
  }, [artworkRectPx, boundaryRectPx, color, productType]);

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
      {generatedImage && rectPlacement && boundaryRectPx && artworkRectPx ? (
        <>
          <div
            className="pointer-events-none absolute"
            style={{
              left: boundaryRectPx.x,
              top: boundaryRectPx.y,
              width: boundaryRectPx.w,
              height: boundaryRectPx.h,
              transform: `rotate(${rectPlacement.rotateDeg}deg)`,
              transformOrigin: "center center",
              overflow: "hidden",
              borderRadius: `${rectPlacement.borderRadiusPct ?? 0}%`,
            }}
          >
            <motion.img
              key={`${productType}-${color}-${generatedImage}-rect`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              src={generatedImage}
              alt="Applied design"
              className="absolute"
              style={{
                left: artworkRectPx.x - boundaryRectPx.x,
                top: artworkRectPx.y - boundaryRectPx.y,
                width: artworkRectPx.w,
                height: artworkRectPx.h,
                objectFit: "contain",
                objectPosition: "center center",
                transformOrigin: "center center",
                opacity: 1,
                filter: "none",
                mixBlendMode: "normal",
              }}
            />
          </div>
          {DEBUG_PLACEMENT && (
            <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
              <div
                className="absolute border border-emerald-500"
                style={{
                  left: boundaryRectPx.x,
                  top: boundaryRectPx.y,
                  width: boundaryRectPx.w,
                  height: boundaryRectPx.h,
                }}
              />
              <div
                className="absolute border border-fuchsia-500"
                style={{
                  left: artworkRectPx.x,
                  top: artworkRectPx.y,
                  width: artworkRectPx.w,
                  height: artworkRectPx.h,
                }}
              />
              <div
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500"
                style={{
                  left: boundaryRectPx.x + boundaryRectPx.w / 2,
                  top: boundaryRectPx.y + boundaryRectPx.h / 2,
                }}
              />
              <div
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500"
                style={{
                  left: artworkRectPx.x + artworkRectPx.w / 2,
                  top: artworkRectPx.y + artworkRectPx.h / 2,
                }}
              />
            </div>
          )}
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.08]" />
    </div>
  );
}
