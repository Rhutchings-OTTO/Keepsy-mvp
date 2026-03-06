"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Region } from "@/lib/region";
import { NanoPlane } from "@/components/easter-eggs/NanoPlane";

type RegionSelectorProps = {
  open: boolean;
  onSelect: (region: Region) => void;
  onClose?: () => void;
  /** Current region for Transatlantic Flight easter egg (3 clicks on current region) */
  currentRegion?: Region;
};

const OPTIONS: Array<{ region: Region; title: string }> = [
  { region: "US", title: "United States" },
  { region: "UK", title: "United Kingdom" },
];

const RESET_CLICKS_MS = 2000;

export default function RegionSelector({ open, onSelect, onClose, currentRegion }: RegionSelectorProps) {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickedRegion, setLastClickedRegion] = useState<Region | null>(null);
  const [triggerPlane, setTriggerPlane] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<Region | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    firstButtonRef.current?.focus();
  }, [open]);

  const handleRegionClick = (region: Region) => {
    const isCurrentRegion = region === currentRegion;
    const sameRegion = lastClickedRegion === region;
    const next = sameRegion && isCurrentRegion ? clickCount + 1 : 1;
    setClickCount(next);
    setLastClickedRegion(region);

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
      setLastClickedRegion(null);
    }, RESET_CLICKS_MS);

    if (next === 3 && isCurrentRegion) {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      const otherRegion: Region = region === "UK" ? "US" : "UK";
      setPendingRegion(otherRegion);
      setTriggerPlane(true);
    } else if (!isCurrentRegion) {
      onSelect(region);
      onClose?.();
      setClickCount(0);
      setLastClickedRegion(null);
    }
  };

  const handlePlaneComplete = () => {
    setTriggerPlane(false);
    setClickCount(0);
    setLastClickedRegion(null);
    if (pendingRegion) {
      onSelect(pendingRegion);
      onClose?.();
      setPendingRegion(null);
    }
  };

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

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
                  onClick={() => handleRegionClick(option.region)}
                  className="rounded-2xl border border-[#DDCFC2] bg-white px-4 py-4 text-left transition hover:border-[#C9B49F] hover:bg-[#FFFCF8] focus:outline-none focus:ring-2 focus:ring-[#C9B49F]"
                >
                  <p className="text-lg font-bold text-[#3A2E25]">{option.title}</p>
                  <p className="mt-1 text-xs text-[#7A6552]">See local gift ideas & holidays</p>
                </button>
              ))}
            </div>
          </motion.section>
          {triggerPlane && <NanoPlane onComplete={handlePlaneComplete} />}
        </>
      ) : null}
    </AnimatePresence>
  );
}
