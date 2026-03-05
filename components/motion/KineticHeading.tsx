"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";
import { stagger } from "@/lib/motion/config";

/** Kinetic letter animation: slides up + scale with stagger */
const kineticLetterVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.92,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.22, 0.61, 0.36, 1] as const,
    },
  },
};

type KineticHeadingProps = {
  children: string;
  as?: "h1" | "h2";
  className?: string;
  staggerDelay?: number;
};

export function KineticHeading({
  children,
  as: Component = "h1",
  className = "",
  staggerDelay = 0.035,
}: KineticHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduceMotion = useReducedMotionPref();

  useEffect(() => {
    if (typeof window === "undefined" || reduceMotion) {
      const t = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) {
      const t = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(t);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "80px 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const letters = children.split("");
  const staggered = stagger(0, staggerDelay);

  if (reduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <div ref={ref} className="inline-block">
      <Component className={className}>
        <motion.span
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggered}
          style={{
            display: "inline-flex",
            overflow: "visible",
          }}
        >
          {letters.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              variants={kineticLetterVariants}
              style={{
                display: "inline-block",
                transformOrigin: "bottom center",
                whiteSpace: char === " " ? "pre" : "normal",
              }}
              className={char === " " ? "w-[0.25em]" : undefined}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </Component>
    </div>
  );
}
