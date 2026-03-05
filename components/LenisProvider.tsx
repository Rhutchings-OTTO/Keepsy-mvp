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

export function LenisProvider({ children }: PropsWithChildren) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        duration: 1.2,
        easing: easeOutBack,
        lerp: undefined,
        wheelMultiplier: 1,
        touchMultiplier: 1.2,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
