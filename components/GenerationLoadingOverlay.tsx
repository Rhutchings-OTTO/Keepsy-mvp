"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FF } from "@/lib/featureFlags";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

type ProductType = "tshirt" | "hoodie" | "card" | "mug" | string;

type GenerationLoadingOverlayProps = {
  isOpen: boolean;
  productType?: ProductType;
  hasSourceImage?: boolean;
  showSavingHint?: boolean;
};

const STAGE_MESSAGES = [
  "Understanding your idea...",
  "Designing your scene...",
  "Adding personality...",
  "Perfecting the details...",
  "Making it gift-ready...",
  "Preparing your preview...",
] as const;

const UPLOAD_TRANSFORMATION_MESSAGES = [
  "Analysing your photo...",
  "Designing your gift...",
  "Preparing preview...",
] as const;

const MESSAGE_INTERVAL_MS = 1800;
const PROGRESS_LOOP_MS = 9600;
const PROGRESS_TICK_MS = 90;

function getContextMessage(productType?: ProductType) {
  if (productType === "hoodie") return "Preparing your design on premium fabric...";
  if (productType === "tshirt") return "Laying out your print placement...";
  if (productType === "card") return "Creating a keepsake they'll treasure...";
  if (productType === "mug") return "Getting this ready for morning smiles...";
  return null;
}

export function GenerationLoadingOverlay({
  isOpen,
  productType,
  hasSourceImage = false,
  showSavingHint = false,
}: GenerationLoadingOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const messageTimer = window.setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGE_MESSAGES.length);
      setTickCount((prev) => prev + 1);
    }, MESSAGE_INTERVAL_MS);

    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const loopProgress = (elapsed % PROGRESS_LOOP_MS) / PROGRESS_LOOP_MS;
      setProgress(loopProgress * 100);
    }, PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, [isOpen]);

  const message = useMemo(() => {
    if (hasSourceImage && FF.uploadTransformation) {
      return UPLOAD_TRANSFORMATION_MESSAGES[tickCount % UPLOAD_TRANSFORMATION_MESSAGES.length];
    }
    const contextual = getContextMessage(productType);
    if (contextual && tickCount % 3 === 2) return contextual;
    return STAGE_MESSAGES[stageIndex];
  }, [hasSourceImage, productType, stageIndex, tickCount]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="generation-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.3 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#F7F1EB]/92 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Generating your image"
        >
          {!prefersReducedMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.22, 0.32, 0.22] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute left-[-20%] top-[-20%] h-[52vh] w-[52vh] rounded-full bg-[#F6DCC6]/35 blur-3xl"
                animate={{ x: [0, 90, 0], y: [0, 40, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-[-25%] right-[-20%] h-[55vh] w-[55vh] rounded-full bg-[#DDECF5]/35 blur-3xl"
                animate={{ x: [0, -70, 0], y: [0, -30, 0] }}
                transition={{ duration: 12.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}

          <div className="relative w-full max-w-md rounded-3xl border border-black/10 bg-white/85 p-6 text-center shadow-xl">
            <motion.div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4E8DA] text-[#6D4C41]"
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: [1, 1.05, 1], opacity: [0.86, 1, 0.86] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={22} />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.3 }}
                className="text-lg font-bold text-[#2B2A29]"
              >
                {message}
              </motion.p>
            </AnimatePresence>

            <p className="mt-2 text-sm font-medium text-black/55">This usually takes a few seconds.</p>
            {showSavingHint ? (
              <p className="mt-1 text-xs font-semibold text-black/45">Don&apos;t refresh — we&apos;re saving your progress.</p>
            ) : null}

            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#EEE7E0]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#DFAF88] to-[#BDA9D8]"
                animate={{ width: `${Math.max(5, progress)}%` }}
                transition={{ duration: prefersReducedMotion ? 0.1 : 0.2, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
