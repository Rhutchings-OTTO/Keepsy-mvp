"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type FrameProps = {
  enabled: boolean;
  className?: string;
  children: ReactNode;
};

export function MagicpathFrame({ enabled, className = "", children }: FrameProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-[2rem] border border-white/55 bg-white/42 shadow-[0_18px_48px_rgba(0,0,0,0.08)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

