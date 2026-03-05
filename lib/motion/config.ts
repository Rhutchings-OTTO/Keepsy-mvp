"use client";

import type { Transition, Variants } from "framer-motion";

export const easing = {
  standard: [0.22, 0.61, 0.36, 1] as const,
  smooth: [0.16, 1, 0.3, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
};

export const durations = {
  fast: 0.18,
  base: 0.32,
  slow: 0.55,
  hero: 0.75,
};

export function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function transition(speed: keyof typeof durations = "base", ease: keyof typeof easing = "standard"): Transition {
  return {
    duration: durations[speed],
    ease: easing[ease],
  };
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.base, ease: easing.standard },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.base, ease: easing.standard },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.base, ease: easing.standard },
  },
};

export const blurToSharp: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: durations.slow, ease: easing.smooth },
  },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.08) =>
  ({
    hidden: {},
    visible: {
      transition: {
        delayChildren,
        staggerChildren,
      },
    },
  }) as Variants;

/** Luxury watch date-flip: each letter flips up from 90° on X-axis */
export const flipLetter: Variants = {
  hidden: {
    opacity: 0,
    rotateX: 90,
    transformPerspective: 800,
  },
  visible: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: durations.base,
      ease: easing.smooth,
    },
  },
};
