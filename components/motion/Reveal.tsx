"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, scaleIn, blurToSharp } from "@/lib/motion/config";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

const variantMap = { fadeUp, fadeIn, scaleIn, blurToSharp };
type VariantKey = keyof typeof variantMap;

type RevealProps = {
  children: React.ReactNode;
  variant?: VariantKey;
  delay?: number;
  once?: boolean;
  className?: string;
};

export function Reveal(props: RevealProps) {
  const { children, variant = "fadeUp", delay = 0, once = true, className = "" } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduceMotion = useReducedMotionPref();
  const v = variantMap[variant];

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
          if (once && el) observer.unobserve(el);
        }
      },
      { rootMargin: "50px 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reduceMotion]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const transition = delay ? { delay, duration: 0.32, ease: [0.22, 0.61, 0.36, 1] as const } : undefined;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={v}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
