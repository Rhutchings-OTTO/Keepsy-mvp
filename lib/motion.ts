"use client";

import type { Transition, Variants } from "framer-motion";

export const MOTION_EASE = {
  standard: [0.22, 0.61, 0.36, 1] as const,
  smooth: [0.16, 1, 0.3, 1] as const,
};

export const MOTION_DURATION = {
  fast: 0.18,
  base: 0.32,
  slow: 0.55,
  hero: 0.75,
};

export function motionTransition(speed: keyof typeof MOTION_DURATION = "base"): Transition {
  return {
    duration: MOTION_DURATION[speed],
    ease: MOTION_EASE.standard,
  };
}

export const revealUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: motionTransition("base"),
  },
};

export const softScaleIn: Variants = {
  initial: { opacity: 0, scale: 0.98, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: motionTransition("slow"),
  },
};

export const hoverLift = {
  whileHover: { y: -2, scale: 1.01, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)" },
  whileTap: { scale: 0.99 },
};

