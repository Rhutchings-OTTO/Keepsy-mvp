"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { flipLetter } from "@/lib/motion/config";
import { stagger } from "@/lib/motion/config";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type RevealSplitTextProps = {
  /** Text to animate letter-by-letter */
  text: string;
  /** Wrapper element (h1, h2, h3, span, etc.) */
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  /** Stagger delay between letters (seconds) */
  staggerDelay?: number;
  /** Additional class names */
  className?: string;
};

export function RevealSplitText({
  text,
  as: Component = "h2",
  staggerDelay = 0.03,
  className = "",
}: RevealSplitTextProps) {
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
      { rootMargin: "50px 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const letters = text.split("");
  const staggered = stagger(0, staggerDelay);

  if (reduceMotion) {
    return <Component className={className}>{text}</Component>;
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
            perspective: "800px",
            perspectiveOrigin: "center bottom",
            overflow: "visible",
          }}
        >
          {letters.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              variants={flipLetter}
              style={{
                display: "inline-block",
                transformOrigin: "bottom center",
                backfaceVisibility: "hidden",
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
