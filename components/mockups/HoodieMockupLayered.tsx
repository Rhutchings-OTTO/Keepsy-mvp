"use client";

import Image from "next/image";
import { useId } from "react";

type HoodieMockupLayeredProps = {
  /** URL of the AI-generated artwork to place on the hoodie */
  designUrl: string;
  /** Base product image (hoodie with shadows/folds). Defaults to /mockups/hoodie-base.png */
  baseSrc?: string;
  /** Mask image to clip artwork to fabric. Defaults to /mockups/hoodie-mask.png */
  maskSrc?: string;
  /** Highlights overlay for reflections. Defaults to /mockups/hoodie-highlights.png */
  highlightsSrc?: string;
  /** Displacement map for fabric wrinkle effect. Defaults to /mockups/hoodie-displacement-map.jpg */
  displacementMapSrc?: string;
  /** Displacement intensity (scale). Default 20 */
  displacementScale?: number;
  className?: string;
};

export function HoodieMockupLayered({
  designUrl,
  baseSrc = "/mockups/hoodie-base.png",
  maskSrc = "/mockups/hoodie-mask.png",
  highlightsSrc = "/mockups/hoodie-highlights.png",
  displacementMapSrc = "/mockups/hoodie-displacement-map.jpg",
  displacementScale = 20,
  className = "",
}: HoodieMockupLayeredProps) {
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
      <div className={`relative aspect-square w-full max-w-md ${className}`}>
      {/* 1. The Base Product (The Hoodie with shadows and folds) */}
      <Image src={baseSrc} alt="" fill className="object-contain z-10" sizes="(max-width: 768px) 100vw, 448px" />

      {/* 2. The AI Image (The Artwork) */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative w-[40%] aspect-square">
          <Image
            src={designUrl}
            alt="Your design"
            fill
            className="object-contain opacity-90 mix-blend-multiply contrast-125 brightness-110"
            style={{
              filter: `url(#${filterId})`,
              transform: "perspective(1000px) rotateY(-10deg) rotateX(5deg)",
              maskImage: `url(${maskSrc})`,
              WebkitMaskImage: `url(${maskSrc})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
            unoptimized={designUrl.startsWith("data:")}
            sizes="180px"
          />
        </div>
      </div>

      {/* 3. The Highlight Layer (Adds reflections on top of the art) */}
      <Image src={highlightsSrc} alt="" fill className="pointer-events-none object-contain z-30 opacity-30 mix-blend-screen" sizes="(max-width: 768px) 100vw, 448px" />
    </div>
    </>
  );
}
