"use client";

import Image from "next/image";
import { memo, useId } from "react";
import {
  getPlacement,
  type MockupProductType,
  type MockupColor,
  type PlacementRect,
} from "@/lib/mockups/placements";

type ProductPreviewProps = {
  /** URL of the AI-generated design image */
  imageUrl: string;
  /** Product type: tshirt, hoodie, mug, or card */
  productType: MockupProductType;
  /** Product color for base mockup. Defaults to white. */
  color?: MockupColor;
  /** Optional CSS mask-image URL to clip artwork (overrides placement-based mask) */
  maskImageUrl?: string;
  className?: string;
};

function rectToRoundedClipPath(rect: PlacementRect): string {
  const radius = rect.borderRadiusPct ?? 2;
  return `inset(0 round ${radius}%)`;
}

function rectToSvgMaskRect(rect: PlacementRect): { x: number; y: number; w: number; h: number; rx: number } {
  return {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    rx: (rect.borderRadiusPct ?? 2) / 100,
  };
}

export const ProductPreview = memo(function ProductPreview({
  imageUrl,
  productType,
  color = "white",
  maskImageUrl,
  className = "",
}: ProductPreviewProps) {
  const maskId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const placement = getPlacement(productType, color);

  if (placement.placement.kind !== "rect") {
    return null;
  }

  const rect = placement.placement.rect;
  const clipPath = rectToRoundedClipPath(rect);
  const { rx } = rectToSvgMaskRect(rect);

  const leftPct = rect.xPct - rect.wPct / 2;
  const topPct = rect.yPct - rect.hPct / 2;

  const isApparel = productType === "tshirt" || productType === "hoodie";
  const isMug = productType === "mug";
  const isCard = productType === "card";

  const artworkMaskStyle = maskImageUrl
    ? {
        maskImage: `url(${maskImageUrl})`,
        WebkitMaskImage: `url(${maskImageUrl})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }
    : {
        maskImage: `url(#product-mask-${maskId})`,
        WebkitMaskImage: `url(#product-mask-${maskId})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      };

  return (
    <>
      {!maskImageUrl && (
        <svg aria-hidden style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <mask id={`product-mask-${maskId}`} maskUnits="objectBoundingBox">
              <rect x={0} y={0} width={1} height={1} rx={rx} ry={rx} fill="white" />
            </mask>
          </defs>
        </svg>
      )}
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)] ${className}`}
        style={{ aspectRatio: placement.aspectRatio, backgroundColor: "var(--color-cream)" }}
      >
        <div className="absolute inset-0">
          {/* Layer 1: Base product */}
          <div className="absolute inset-0 z-0">
            <Image
              src={placement.baseMockupSrc}
              alt={`${productType} base`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>

          {/* Layer 2: OpenAI image (clipped to printable area via mask-image) */}
          <div
            className="absolute z-10 flex items-center justify-center"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${rect.wPct}%`,
              height: `${rect.hPct}%`,
              clipPath: clipPath,
              ...(isMug && {
                perspective: "800px",
                transformStyle: "preserve-3d",
              }),
            }}
          >
            <div
              className="relative h-full w-full"
              style={{
                ...(isMug && {
                  transform: "rotateY(-12deg)",
                }),
              }}
            >
              <img
                src={imageUrl}
                alt="Your design"
                className="h-full w-full object-cover"
                style={{
                  opacity: placement.opacity ?? 0.96,
                  mixBlendMode: isApparel ? "multiply" : "normal",
                  ...artworkMaskStyle,
                }}
              />
            </div>
          </div>

          {/* Layer 3: Glaze (reflections/shadows) */}
          <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
            {isCard && (
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.03) 100%)",
                  mixBlendMode: "overlay",
                }}
              />
            )}
            {isMug && (
              <div className="mug-art-overlay absolute inset-0" aria-hidden />
            )}
            {isApparel && (
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.05) 100%)",
                  mixBlendMode: "overlay",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
});
