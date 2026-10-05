"use client";

import React from "react";
import { motion } from "framer-motion";

type MagneticCardProps = React.ComponentProps<typeof motion.div> & {
  children: React.ReactNode;
  /** Kept for API compatibility; tilt is no longer applied. */
  maxTilt?: number;
  /** Kept for API compatibility; hover scale is no longer applied. */
  hoverScale?: number;
};

/** Plain card container (historical name). No tilt, no hover scale. */
export function MagneticCard({
  children,
  maxTilt,
  hoverScale,
  className = "",
  whileHover: _whileHover,
  whileTap: _whileTap,
  ...props
}: MagneticCardProps) {
  void maxTilt;
  void hoverScale;
  void _whileHover;
  void _whileTap;
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}
