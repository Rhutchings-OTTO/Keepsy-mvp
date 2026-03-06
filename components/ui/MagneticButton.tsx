"use client";

import React from "react";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type MagneticButtonProps = React.ComponentProps<typeof motion.button> & {
  children: React.ReactNode;
};

export function MagneticButton({
  children,
  className = "",
  ...props
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotionPref();

  return (
    <motion.button
      className={className}
      whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
