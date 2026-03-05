"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { GenerativeLoader } from "@/components/GenerativeLoader";

type ProductType = "tshirt" | "hoodie" | "card" | "mug" | string;

type GenerationLoadingOverlayProps = {
  isOpen: boolean;
  startedAt?: number | null;
  productType?: ProductType;
  hasSourceImage?: boolean;
  showSavingHint?: boolean;
  region?: string | null;
};

export function GenerationLoadingOverlay({
  isOpen,
  startedAt = null,
  showSavingHint = false,
  region,
}: GenerationLoadingOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  useLockBodyScroll(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="generation-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.3 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#F9F8F6]/94 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Synthesizing your design"
        >
          {!prefersReducedMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.22, 0.32, 0.22] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute left-[-20%] top-[-20%] h-[52vh] w-[52vh] rounded-full bg-[#F6DCC6]/30 blur-3xl"
                animate={{ x: [0, 90, 0], y: [0, 40, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-[-25%] right-[-20%] h-[55vh] w-[55vh] rounded-full bg-[#DDECF5]/30 blur-3xl"
                animate={{ x: [0, -70, 0], y: [0, -30, 0] }}
                transition={{ duration: 12.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}

          <div className="frosted-glass relative w-full max-w-md rounded-3xl p-8 text-center">
            <GenerativeLoader useInternalMessages={true} region={region} startedAt={startedAt} />

            <p className="mt-4 text-sm font-medium text-[#1A1A1A]/60">Calibrating pigments — this usually takes a moment.</p>
            {showSavingHint ? (
              <p className="mt-1 text-xs font-semibold text-[#1A1A1A]/45">Don&apos;t refresh — we&apos;re saving your progress.</p>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
