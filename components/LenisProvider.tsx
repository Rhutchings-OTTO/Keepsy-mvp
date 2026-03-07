"use client";

import React, { type PropsWithChildren } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

/** Ease-out-back: overshoots past 1 then settles – gives bounce when scroll stops */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Respect prefers-reduced-motion: disable smooth scroll for users who request it */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LenisProvider({ children }: PropsWithChildren) {
  const reduced = prefersReducedMotion();

  // When reduced motion is preferred, disable Lenis smooth scroll entirely
  // by setting smoothWheel: false and a near-instant duration.
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        duration: reduced ? 0 : 1.2,
        easing: easeOutBack,
        lerp: undefined,
        wheelMultiplier: 1,
        touchMultiplier: reduced ? 0 : 1.2,
        smoothWheel: !reduced,
      }}
    >
      {children}
    </ReactLenis>
  );
}
