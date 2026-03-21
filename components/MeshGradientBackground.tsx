"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const DEFAULT_COLORS = [
  "#f7f2eb",
  "#e8e0d5",
  "#ffd1bd",
  "#ffebe0",
  "#b5d9d9",
  "#e2e8ff",
];

type MeshGradientBackgroundProps = {
  colors?: string[];
  distortion?: number;
  swirl?: number;
  speed?: number;
  offsetX?: number;
  offsetY?: number;
  veilOpacity?: string;
  className?: string;
};

export function MeshGradientBackground({
  colors = DEFAULT_COLORS,
  distortion = 0.8,
  swirl = 0.6,
  speed = 0.42,
  offsetX = 0.08,
  offsetY = 0,
  veilOpacity = "bg-white/25",
  className = "",
}: MeshGradientBackgroundProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // On mobile: skip the WebGL shader entirely — use a static cream background
  // to avoid GPU overhead during image generation and mockup rendering.
  if (isMobile) {
    return (
      <div
        className={`fixed inset-0 w-full h-full ${className}`}
        style={{ backgroundColor: "#F9F8F6" }}
        aria-hidden
      />
    );
  }

  return (
    <div className={`fixed inset-0 w-full h-full ${className}`}>
      {mounted && (
        <>
          <MeshGradient
            width={dimensions.width}
            height={dimensions.height}
            colors={colors}
            distortion={distortion}
            swirl={swirl}
            grainMixer={0}
            grainOverlay={0}
            speed={speed}
            offsetX={offsetX}
            offsetY={offsetY}
          />
          <div
            className={`absolute inset-0 pointer-events-none ${veilOpacity}`}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
