"use client";

import React from "react";
import { motion } from "framer-motion";

type NanoPlaneProps = {
  onComplete?: () => void;
};

/**
 * Tiny 3D paper plane that flies across the screen for the Transatlantic Flight easter egg.
 */
export function NanoPlane({ onComplete }: NanoPlaneProps) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ x: "-50%", y: "-50%", rotate: -45 }}
        animate={{
          x: ["-50%", "150vw"],
          y: ["-50%", "-30vh"],
          rotate: [0, 15, 25],
        }}
        transition={{
          duration: 3,
          ease: [0.25, 0.46, 0.45, 0.94],
          onComplete: onComplete,
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-lg"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
        >
          <path
            d="M2 12l10-10 10 10-4 8-6-2-6 2-4-8z"
            fill="#F5F5F4"
            stroke="#D6D3D1"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
