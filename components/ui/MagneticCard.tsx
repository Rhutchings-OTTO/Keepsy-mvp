"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type MagneticCardProps = React.ComponentProps<typeof motion.div> & {
  children: React.ReactNode;
  /** Max tilt in degrees. Default 8 */
  maxTilt?: number;
  /** Optional scale on hover. Default 1.02 */
  hoverScale?: number;
};

export function MagneticCard({
  children,
  maxTilt = 8,
  hoverScale = 1.02,
  className = "",
  ...props
}: MagneticCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPref();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 25 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 25 });
  const springScale = useSpring(scale, { stiffness: 400, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    rotateY.set(dx * maxTilt);
    rotateX.set(-dy * maxTilt);
    scale.set(hoverScale);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  if (reduceMotion) {
    return (
      <motion.div
        ref={ref}
        className={className}
        whileHover={{ scale: 1.01 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        scale: springScale,
        transformPerspective: 800,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
