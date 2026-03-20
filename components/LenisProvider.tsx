"use client";

import React, { type PropsWithChildren } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

/**
 * Ease-out-quart: smooth deceleration that stays strictly within [0, 1].
 * Replaced easeOutBack (which overshoots past 1) because the overshoot was
 * causing Lenis to briefly scroll to a negative position on iOS Safari,
 * which manifested as the page loading scrolled to the bottom.
 */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
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
        easing: easeOutQuart,
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
