"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const SecretBanana = dynamic(
  () => import("@/components/SecretBanana").then((mod) => mod.SecretBanana),
  { ssr: false }
);

const SKETCH_MICRO_COPY_TEMPLATES = [
  "Analyzing the brushstroke density...",
  "Mixing digital pigments...",
  "Preparing the canvas for {region} standards...",
  "Finalizing the 1-of-1 artifact...",
];

const BANANA_MICRO_COPY = [
  "Unlocking the Nano-Banana Sequence...",
  "Going bananas for your design...",
  "Peeling back the pixels...",
  "Ripening the creative fruit...",
  "🍌 You found the secret!",
];

function getSketchMessages(region?: string | null, hasBanana?: boolean): string[] {
  if (hasBanana) return BANANA_MICRO_COPY;
  const r = region ?? "UK";
  return SKETCH_MICRO_COPY_TEMPLATES.map((t) => t.replace("{region}", r));
}

const PROGRESS_DURATION_MS = 20_000;
/** Ease-out cubic: fast start, slows toward 95% so we never quite finish until API returns */
function progressFromElapsed(elapsedMs: number): number {
  const t = Math.min(1, elapsedMs / PROGRESS_DURATION_MS);
  return Math.min(0.95, 1 - Math.pow(1 - t, 3));
}

function hasBananaEasterEgg(prompt?: string | null): boolean {
  if (!prompt || typeof prompt !== "string") return false;
  return /\bbanana\b/i.test(prompt.trim());
}

function BananaSvg() {
  return (
    <svg viewBox="0 0 80 120" className="h-16 w-16 drop-shadow-sm" fill="none">
      <defs>
        <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD54F" stopOpacity="1" />
          <stop offset="30%" stopColor="#FFC107" stopOpacity="1" />
          <stop offset="60%" stopColor="#FFB300" stopOpacity="1" />
          <stop offset="100%" stopColor="#FF8F00" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="bananaHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#FFFDE7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M25 100 C20 75, 15 45, 25 20 C30 8, 45 5, 55 15 C65 28, 68 50, 65 75 C62 95, 50 105, 35 100 C28 98, 25 100, 25 100 Z"
        fill="url(#bananaGrad)"
        stroke="#E65100"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
      <path
        d="M30 95 Q35 60, 38 25 Q40 12, 48 12 Q52 15, 52 45 Q52 75, 48 92"
        fill="none"
        stroke="url(#bananaHighlight)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="18" rx="4" ry="3" fill="#8D6E63" opacity="0.7" />
    </svg>
  );
}

type GenerativeLoaderProps = {
  message?: string;
  useInternalMessages?: boolean;
  region?: string | null;
  startedAt?: number | null;
  prompt?: string | null;
};

export function GenerativeLoader({
  message,
  useInternalMessages = true,
  region,
  startedAt = null,
  prompt,
}: GenerativeLoaderProps) {
  const showBanana = hasBananaEasterEgg(prompt);
  const prefersReducedMotion = useReducedMotion();
  const messages = useMemo(() => getSketchMessages(region, showBanana), [region, showBanana]);
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * messages.length)
  );
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (startedAt == null) {
      setProgress(0);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setProgress(progressFromElapsed(elapsed));
    };
    tick();
    const id = setInterval(tick, 120);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div
        className={`relative text-[#1A1A1A]/25 ${
          showBanana && !prefersReducedMotion ? "h-96 w-96" : "h-24 w-24"
        }`}
      >
        {showBanana ? (
          prefersReducedMotion ? (
            <div className="flex h-full w-full items-center justify-center [perspective:120px]">
              <motion.div
                className="origin-center"
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <BananaSvg />
              </motion.div>
            </div>
          ) : (
            <div className="w-96 h-96 flex-shrink-0">
              <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ width: "100%", height: "100%" }}
              >
                <SecretBanana />
              </Canvas>
            </div>
          )
        ) : (
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
        )}
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

      {startedAt != null && (
        <div className="w-full max-w-[240px]">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-[#1A1A1A]/10"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-[#1A1A1A]/35"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
