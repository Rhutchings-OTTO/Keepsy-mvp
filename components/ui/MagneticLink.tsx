"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type MagneticLinkProps = React.ComponentProps<typeof Link> & {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
};

export function MagneticLink({
  children,
  className = "",
  ...props
}: MagneticLinkProps) {
  const reduceMotion = useReducedMotionPref();

  if (reduceMotion) {
    return (
      <Link className={className} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <Link className={`inline-block ${className}`} {...props}>
      <motion.span
        style={{ display: "inline-block" }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.span>
    </Link>
  );
}
