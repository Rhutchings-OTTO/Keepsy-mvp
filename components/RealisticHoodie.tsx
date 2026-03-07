"use client";

import { useId } from "react";

type RealisticHoodieProps = {
  /** URL of the AI-generated design image */
  aiGeneratedImage: string;
  /** Base product image (fabric, folds, body). Defaults to /mockups/hoodie-base.png */
  baseSrc?: string;
  /** Top layer (drawstrings, highlights). Transparent PNG. Defaults to /mockups/hoodie-top-layer.png */
  topLayerSrc?: string;
  /** Displacement map for fabric wrinkle effect. Defaults to /mockups/hoodie-displacement-map.jpg */
  displacementMapSrc?: string;
  /** Displacement intensity (scale). Default 20 */
  displacementScale?: number;
  /** Show the "Inspect Texture" button. Default true */
  showInspectButton?: boolean;
  className?: string;
};

export function RealisticHoodie({
  aiGeneratedImage,
  baseSrc = "/mockups/hoodie-base.png",
  topLayerSrc = "/mockups/hoodie-top-layer.png",
  displacementMapSrc = "/mockups/hoodie-displacement-map.jpg",
  displacementScale = 20,
  showInspectButton = true,
  className = "",
}: RealisticHoodieProps) {
  const filterId = `hoodie-disp-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <>
      <svg aria-hidden style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id={filterId}>
            <feImage href={displacementMapSrc} result="map" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div
        className={`group relative aspect-square w-full max-w-2xl overflow-hidden rounded-3xl bg-ivory/50 ${className}`}
      >
        {/* LAYER 1: The Base (Fabric, Folds, and Body) */}
        <img
          src={baseSrc}
          alt="Hoodie base"
          className="absolute inset-0 z-10 h-full w-full object-contain"
        />

        {/* LAYER 2: The AI Design (The "Sandwich Filling") */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="relative mt-[-20px] aspect-square w-[35%]">
            <img
              src={aiGeneratedImage}
              alt="Your design"
              className="h-full w-full object-cover opacity-90 mix-blend-multiply"
              style={{
                filter: `url(#${filterId}) contrast(1.1) brightness(1.1)`,
              }}
            />
          </div>
        </div>

        {/* LAYER 3: The "Top Plate" (Drawstrings & Global Highlights) */}
        {/* Transparent PNG containing ONLY drawstrings and high-point reflections */}
        <img
          src={topLayerSrc}
          alt=""
          className="pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
        />

        {showInspectButton && (
          <div className="absolute bottom-6 right-6 z-40">
            <button
              type="button"
              className="rounded-full bg-white/80 px-4 py-2 font-sans text-xs uppercase tracking-widest text-charcoal shadow-lg"
            >
              Inspect Texture
            </button>
          </div>
        )}
      </div>
    </>
  );
}
