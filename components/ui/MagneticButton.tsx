"use client";

import React from "react";
import { motion } from "framer-motion";

type MagneticButtonProps = React.ComponentProps<typeof motion.button> & {
  children: React.ReactNode;
};

/**
 * Historical name kept for existing call sites. This is now a plain button:
 * no magnetic pull, no hover scale. Any `whileHover` / `whileTap` a caller
 * passes is dropped so motion stays restrained everywhere.
 */
export function MagneticButton({
  children,
  className = "",
  whileHover: _whileHover,
  whileTap: _whileTap,
  ...props
}: MagneticButtonProps) {
  void _whileHover;
  void _whileTap;
  return (
    <motion.button className={className} {...props}>
      {children}
    </motion.button>
  );
}
