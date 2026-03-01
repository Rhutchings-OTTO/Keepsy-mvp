"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Region } from "@/lib/region";

type RegionSelectorProps = {
  open: boolean;
  onSelect: (region: Region) => void;
  onClose?: () => void;
};

const OPTIONS: Array<{ id: Region; title: string; subtitle: string }> = [
  {
    id: "US",
    title: "United States",
    subtitle: "See local gift ideas & holidays",
  },
  {
    id: "UK",
    title: "United Kingdom",
    subtitle: "See local gift ideas & holidays",
  },
];

export default function RegionSelector({ open, onSelect, onClose }: RegionSelectorProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    firstButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) onClose();
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose your region"
            className="fixed inset-0 z-[91] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="w-full max-w-xl rounded-3xl border border-[#E5D8CC] bg-[#FBF8F5] p-5 sm:p-7 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E7A67]">Welcome to Keepsy</p>
              <h2 className="mt-2 text-2xl font-black text-[#2A241E]">Choose your region</h2>
              <p className="mt-2 text-sm text-[#6E5E50]">We tailor gift ideas, occasions, and suggestions to your location.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {OPTIONS.map((option, index) => (
                  <button
                    key={option.id}
                    ref={index === 0 ? firstButtonRef : undefined}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    className="rounded-2xl border border-[#E0D2C4] bg-white px-4 py-5 text-left transition hover:border-[#C9B19A] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89D84]"
                  >
                    <p className="text-base font-bold text-[#30271E]">{option.title}</p>
                    <p className="mt-1 text-sm text-[#756353]">{option.subtitle}</p>
                  </button>
                ))}
              </div>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 rounded-full border border-[#D9C8B8] px-4 py-2 text-xs font-semibold text-[#5C4C3E]"
                >
                  Close
                </button>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

