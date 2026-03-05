"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type ParallaxManifestoProps = {
  /** Text to display (e.g. "MANIFESTO") */
  text?: string;
  /** Parallax factor: 0 = fixed, 0.5 = half scroll speed */
  speed?: number;
  /** Ref to the scroll container (e.g. main element) for parallax calculation */
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
  /** Additional class names for the text */
  className?: string;
};

export function ParallaxManifesto({
  text = "MANIFESTO",
  speed = 0.35,
  scrollTargetRef,
  className = "",
}: ParallaxManifestoProps) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const targetRef = scrollTargetRef ?? fallbackRef;
  const reduceMotion = useReducedMotionPref();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 40}%`]);

  if (reduceMotion) {
    return (
      <div
        ref={fallbackRef}
        className={`pointer-events-none select-none text-[clamp(6rem,18vw,14rem)] font-black leading-none tracking-tighter text-[#1A1A1A]/[0.04] ${className}`}
        aria-hidden
      >
        {text}
      </div>
    );
  }

  return (
    <div ref={fallbackRef} className="absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        style={{ y }}
        className={`pointer-events-none select-none text-[clamp(6rem,18vw,14rem)] font-black leading-none tracking-tighter text-[#1A1A1A]/[0.04] whitespace-nowrap ${className}`}
      >
        {text}
      </motion.div>
    </div>
  );
}
