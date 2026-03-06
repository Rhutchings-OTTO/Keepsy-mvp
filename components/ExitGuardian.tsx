"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function ExitGuardian() {
  const [showExit, setShowExit] = useState(false);

  useEffect(() => {
    const handleMouseOut = (e: MouseEvent) => {
      if (e.clientY < 5) setShowExit(true);
    };
    document.addEventListener("mouseleave", handleMouseOut);
    return () => document.removeEventListener("mouseleave", handleMouseOut);
  }, []);

  return (
    <AnimatePresence>
      {showExit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-xl"
          style={{ backgroundColor: "rgba(253,246,238,0.4)" }}
        >
          <div className="p-12 rounded-[40px] shadow-2xl text-center max-w-md border border-black/10" style={{ backgroundColor: "var(--color-cream)" }}>
            <h2 className="font-serif text-4xl text-charcoal mb-4">Wait.</h2>
            <p className="font-sans text-charcoal/60 mb-8 leading-relaxed">
              Your masterpiece is still cooling in the kiln. If you leave now, the pigment might fade.
            </p>
            <MagneticButton
              onClick={() => setShowExit(false)}
              className="px-8 py-4 rounded-full font-sans tracking-widest uppercase text-xs text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-charcoal)" }}
            >
              Continue Creating
            </MagneticButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
