"use client";

import { useRef } from "react";
import { useEasterEggMouse } from "@/context/EasterEggContext";

const SPOTLIGHT_RADIUS = 280;

/**
 * Grain overlay that reacts to mouse position (from EasterEggProvider when available).
 * Creates a "spotlight" effect: grain fades out where the cursor is.
 */
export function GrainSpotlight({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useEasterEggMouse();

  const w = typeof window !== "undefined" ? window.innerWidth : 1;
  const h = typeof window !== "undefined" ? window.innerHeight : 1;
  const pos = mouse
    ? {
        x: Math.max(0, Math.min(1, mouse.x / w)),
        y: Math.max(0, Math.min(1, mouse.y / h)),
      }
    : { x: 0.5, y: 0.5 };

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 grain-spotlight ${className}`}
      aria-hidden
      style={{
        ["--spot-x" as string]: `${pos.x * 100}%`,
        ["--spot-y" as string]: `${pos.y * 100}%`,
        ["--spot-radius" as string]: `${SPOTLIGHT_RADIUS}px`,
      }}
    />
  );
}
