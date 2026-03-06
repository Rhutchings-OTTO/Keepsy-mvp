"use client";

import React from "react";
import { motion } from "framer-motion";
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
  const reduceMotion = useReducedMotionPref();
  void maxTilt;

  return (
    <motion.div
      className={className}
      whileHover={reduceMotion ? undefined : { y: -3, scale: hoverScale, boxShadow: "0 20px 40px -24px rgba(0,0,0,0.22)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
