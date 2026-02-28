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
  type PlacementMap,
} from "@/lib/mockups/placements";

type MockupRendererProps = {
  productType: MockupProductType;
  color: MockupColor;
  generatedImage: string | null;
  className?: string;
};

export function MockupRenderer({ productType, color, generatedImage, className }: MockupRendererProps) {
  const [runtimePlacements, setRuntimePlacements] = useState<PlacementMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  const quadMatrix = useMemo(() => {
    if (entry.placement.kind !== "quad") return null;
    if (containerSize.width <= 0 || containerSize.height <= 0) return null;
    const quad = entry.placement.quad;
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
  }, [entry, containerSize.width, containerSize.height]);

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
      {generatedImage && (
        <>
          {entry.placement.kind === "rect" && (
            <motion.img
              key={`${productType}-${color}-${generatedImage}`}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              src={generatedImage}
              alt="Applied design"
              className="absolute"
              style={{
                left: `${entry.placement.rect.xPct}%`,
                top: `${entry.placement.rect.yPct}%`,
                width: `${entry.placement.rect.wPct}%`,
                height: `${entry.placement.rect.hPct}%`,
                objectFit: "cover",
                opacity: entry.opacity ?? 0.96,
                borderRadius: `${entry.placement.rect.borderRadiusPct ?? 0}%`,
                transform: `translate(-50%,-50%) rotate(${entry.placement.rect.rotateDeg}deg)`,
                mixBlendMode: productType === "mug" ? "normal" : "multiply",
                transformOrigin: "center center",
              }}
            />
          )}
          {entry.placement.kind === "quad" && quadMatrix && (
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
                objectFit: "cover",
                transformOrigin: "0 0",
                transform: quadMatrix,
                opacity: entry.opacity ?? 0.96,
                filter: entry.dropShadow ?? "none",
              }}
            />
          )}
        </>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.08]" />
    </div>
  );
}
