"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

const SKETCH_MICRO_COPY_TEMPLATES = [
  "Analyzing the brushstroke density...",
  "Mixing digital pigments...",
  "Preparing the canvas for {region} standards...",
  "Finalizing the 1-of-1 artifact...",
];

function getSketchMessages(region?: string | null): string[] {
  const r = region ?? "UK";
  return SKETCH_MICRO_COPY_TEMPLATES.map((t) => t.replace("{region}", r));
}

type GenerativeLoaderProps = {
  message?: string;
  useInternalMessages?: boolean;
  region?: string | null;
};

export function GenerativeLoader({
  message,
  useInternalMessages = true,
  region,
}: GenerativeLoaderProps) {
  const messages = useMemo(() => getSketchMessages(region), [region]);
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * messages.length)
  );

  const displayMessage = useMemo(() => {
    if (!useInternalMessages && message) return message;
    return messages[index];
  }, [useInternalMessages, message, index, messages]);

  useEffect(() => {
    if (!useInternalMessages) return;
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(t);
  }, [useInternalMessages, messages.length]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative h-24 w-24 text-[#1A1A1A]/25">
        <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
          <defs>
            <linearGradient id="sketchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <motion.path
            d="M20 50 Q35 20, 50 35 T80 50 Q65 80, 50 65 T20 50"
            fill="none"
            stroke="url(#sketchGrad)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="120"
            strokeDashoffset="120"
            initial={{ strokeDashoffset: 120 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              repeatDelay: 0.4,
              repeatType: "reverse",
            }}
          />
          <motion.path
            d="M30 45 Q42 28, 50 38 T70 50 Q58 72, 50 62 T30 45"
            fill="none"
            stroke="rgba(26,26,26,0.06)"
            strokeWidth="0.35"
            strokeLinecap="round"
            strokeDasharray="80"
            strokeDashoffset="80"
            initial={{ strokeDashoffset: 80 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              repeatDelay: 0.6,
              repeatType: "reverse",
            }}
          />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={displayMessage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-center text-base font-semibold text-[#1A1A1A]/80"
        >
          {displayMessage}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
