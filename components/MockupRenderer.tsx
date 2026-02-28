"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import PerspT from "perspective-transform";
import {
  getPlacement,
  placements as staticPlacements,
  type MockupColor,
  type MockupProductType,
  type Placement,
  type PlacementQuad,
  type PlacementQuadPoint,
  type PlacementRect,
  type PlacementMap,
} from "@/lib/mockups/placements";

type MockupRendererProps = {
  productType: MockupProductType;
  color: MockupColor;
  generatedImage: string | null;
  className?: string;
  placementOverride?: Placement | null;
  editable?: boolean;
  onPlacementChange?: (placement: Placement) => void;
};

type DragPoint = keyof PlacementQuad;

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function rectToQuad(rect: PlacementRect): PlacementQuad {
  const hw = rect.wPct / 2;
  const hh = rect.hPct / 2;
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

function normalizeToQuad(placement: Placement): PlacementQuad {
  if (placement.kind === "quad") return placement.quad;
  return rectToQuad(placement.rect);
}

export function MockupRenderer({
  productType,
  color,
  generatedImage,
  className,
  placementOverride,
  editable = false,
  onPlacementChange,
}: MockupRendererProps) {
  const [runtimePlacements, setRuntimePlacements] = useState<PlacementMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);

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
  const activePlacement = placementOverride ?? entry.placement;
  const activeQuad = normalizeToQuad(activePlacement);

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

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragPoint || !editable || !onPlacementChange) return;
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const xPct = clampPct(((event.clientX - box.left) / box.width) * 100);
    const yPct = clampPct(((event.clientY - box.top) / box.height) * 100);
    onPlacementChange({
      kind: "quad",
      quad: {
        ...activeQuad,
        [dragPoint]: { xPct, yPct },
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl border border-black/10 bg-[#F5F5F6] shadow-2xl ${className ?? ""}`}
      style={{ aspectRatio: `${entry.aspectRatio}` }}
      onPointerMove={handleMove}
      onPointerUp={() => setDragPoint(null)}
      onPointerLeave={() => setDragPoint(null)}
    >
      <Image
        src={entry.baseMockupSrc}
        alt={`${productType} mockup`}
        fill
        className="object-cover"
        quality={100}
        sizes="(max-width: 1024px) 100vw, 700px"
      />
      {generatedImage && (
        <>
          {quadMatrix && (
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
              style={{
                width: 1000,
                height: 1000,
                objectFit: "contain",
                transformOrigin: "0 0",
                transform: quadMatrix,
                opacity: entry.opacity ?? 0.96,
                filter: entry.dropShadow ?? "none",
                mixBlendMode: productType === "mug" ? "normal" : "multiply",
              }}
            />
          )}
        </>
      )}
      {editable &&
        generatedImage &&
        (["tl", "tr", "br", "bl"] as DragPoint[]).map((point) => (
          <button
            key={point}
            type="button"
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-black/90"
            style={{
              left: `${activeQuad[point].xPct}%`,
              top: `${activeQuad[point].yPct}%`,
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              setDragPoint(point);
            }}
            aria-label={`Move ${point} corner`}
          />
        ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.08]" />
    </div>
  );
}
