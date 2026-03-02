"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Region } from "@/lib/region";

type RegionSelectorProps = {
  open: boolean;
  onSelect: (region: Region) => void;
  onClose?: () => void;
};

const OPTIONS: Array<{ region: Region; title: string }> = [
  { region: "US", title: "United States" },
  { region: "UK", title: "United Kingdom" },
];

export default function RegionSelector({ open, onSelect, onClose }: RegionSelectorProps) {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    firstButtonRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close region selector"
            className="fixed inset-0 z-[80] bg-black/35"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Choose your region"
            className="fixed left-1/2 top-1/2 z-[81] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#E5DBD1] bg-[#FCFAF7] p-6 shadow-2xl"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-[#8A7562]">Choose region</p>
            <h2 className="mt-1 text-2xl font-black text-[#2D241E]">View your local Keepsy experience</h2>
            <p className="mt-2 text-sm text-[#5D4B3E]">See local gift ideas and holiday inspiration.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {OPTIONS.map((option, index) => (
                <button
                  key={option.region}
                  type="button"
                  ref={index === 0 ? firstButtonRef : null}
                  onClick={() => onSelect(option.region)}
                  className="rounded-2xl border border-[#DDCFC2] bg-white px-4 py-4 text-left transition hover:border-[#C9B49F] hover:bg-[#FFFCF8] focus:outline-none focus:ring-2 focus:ring-[#C9B49F]"
                >
                  <p className="text-lg font-bold text-[#3A2E25]">{option.title}</p>
                  <p className="mt-1 text-xs text-[#7A6552]">See local gift ideas & holidays</p>
                </button>
              ))}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}

