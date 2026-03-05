"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";
import { useEasterEggMouse } from "@/context/EasterEggContext";

const MAGNETIC_RADIUS = 50;
const MAX_OFFSET = 12;
const SPRING = { stiffness: 150, damping: 15 };

type MagneticLinkProps = React.ComponentProps<typeof Link> & {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
};

export function MagneticLink({
  children,
  strength = MAX_OFFSET,
  radius = MAGNETIC_RADIUS,
  className = "",
  ...props
}: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotionPref();
  const easterEggMouse = useEasterEggMouse();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;

    if (easterEggMouse !== null) {
      const { x: mx, y: my } = easterEggMouse;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mx - cx;
      const dy = my - cy;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > radius) {
        x.set(0);
        y.set(0);
        return;
      }

      const pull = 1 - d / radius;
      const clamp = (v: number) => Math.max(-strength, Math.min(strength, v));
      x.set(clamp(dx * pull * 0.35));
      y.set(clamp(dy * pull * 0.35));
      return;
    }

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > radius) {
        x.set(0);
        y.set(0);
        return;
      }

      const pull = 1 - d / radius;
      const clamp = (v: number) => Math.max(-strength, Math.min(strength, v));
      x.set(clamp(dx * pull * 0.35));
      y.set(clamp(dy * pull * 0.35));
    };

    const handleLeave = () => {
      x.set(0);
      y.set(0);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [easterEggMouse?.x, easterEggMouse?.y, reduceMotion, radius, strength, x, y]);

  if (reduceMotion) {
    return (
      <Link ref={ref} className={className} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <Link ref={ref} className={`inline-block ${className}`} {...props}>
      <motion.span style={{ display: "inline-block", x: springX, y: springY }}>
        {children}
      </motion.span>
    </Link>
  );
}
