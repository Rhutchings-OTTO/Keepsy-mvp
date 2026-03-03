"use client";

import { useEffect, useState } from "react";

export function useReducedMotionPref(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefersReduced(mq.matches);
    mq.addEventListener("change", handler);
    const t = setTimeout(() => setPrefersReduced(mq.matches), 0);
    return () => {
      mq.removeEventListener("change", handler);
      clearTimeout(t);
    };
  }, []);

  return prefersReduced;
}
