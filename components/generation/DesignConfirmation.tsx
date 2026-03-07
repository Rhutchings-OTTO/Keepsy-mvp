"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { GenerationSafetyNotice } from "@/components/safety/GenerationSafetyNotice";
import { motionTransition } from "@/lib/motion";
import { KineticHeading } from "@/components/motion/KineticHeading";
import { MagneticButton } from "@/components/ui/MagneticButton";

const REFINEMENT_CHIPS = [
  "Softer colours",
  "More realistic",
  "Watercolor",
  "Warmer lighting",
  "Simpler background",
];

const PLACEHOLDERS = [
  "Make the colours softer",
  "Add more detail to the background",
  "Make it feel warmer and more cozy",
  "Change it to a watercolor style",
  "Make the people look more natural",
];

export type DesignConfirmationProps = {
  generatedImage: string;
  region?: "UK" | "US";
  onContinue: () => void;
  onRefine: (refinementText: string) => Promise<void>;
  onBackToPrompt: () => void;
  onStartFresh?: () => void;
  isRefining?: boolean;
  refinementError?: string | null;
  refinementContentBlock?: { title: string; message: string; suggestions: string[] } | null;
  refinementRewriteApplied?: {
    originalPreview: string;
    safePreview: string;
    appliedPatches?: Array<{ from: string; to: string }>;
  } | null;
  onRefinementSuggestionClick?: (suggestion: string) => void;
  refinementSuccess?: boolean;
  refinementsLeft?: number;
  canRefine?: boolean;
};

export function DesignConfirmation({
  generatedImage,
  onContinue,
  onRefine,
  onBackToPrompt,
  onStartFresh,
  isRefining = false,
  refinementError = null,
  refinementContentBlock = null,
  refinementRewriteApplied = null,
  onRefinementSuggestionClick,
  refinementSuccess = false,
  refinementsLeft = 3,
  canRefine = true,
}: DesignConfirmationProps) {
  const [refinementExpanded, setRefinementExpanded] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [placeholderIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  const safeRefinementText = typeof refinementText === "string" ? refinementText : "";
  const trimmedText = safeRefinementText.trim();

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (isRefining) return;
    if (!trimmedText) {
      setInlineError("Please describe what you'd like to change.");
      return;
    }
    if (!canRefine) return;
    try {
      await onRefine(trimmedText);
      setRefinementText("");
    } finally {
      setInlineError(null);
    }
  };

  const insertChip = (chip: string) => {
    if (!canRefine) return;
    setRefinementText((prev) => (typeof prev === "string" && prev ? `${prev}. ${chip}` : chip));
  };

  return (
    <motion.div
      key="design-confirmation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={motionTransition("slow")}
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      {/* Back link */}
      <button
        onClick={onBackToPrompt}
        className="text-sm font-semibold text-charcoal/55 hover:text-charcoal inline-flex items-center gap-1 mb-8 transition-colors"
        type="button"
      >
        <ChevronLeft size={16} aria-hidden />
        Back to prompt
      </button>

      {/* Section 1 — Title + reassurance */}
      <div className="mb-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/40">Review your artwork</p>
        <KineticHeading className="mb-2 mt-3 text-3xl font-black text-charcoal sm:text-4xl">How does this look?</KineticHeading>
        <p className="text-sm font-semibold text-charcoal/60 sm:text-base">You can still refine it before moving into product preview.</p>
      </div>

      {/* Section 2 — Large image preview */}
      <div className="mb-10 flex justify-center">
        <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-charcoal/8 bg-white p-3 shadow-[0_30px_72px_-40px_rgba(45,41,38,0.20)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-charcoal/8 bg-white">
          {isRefining ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-[#F5EDE0]">
              <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
              <span className="text-sm font-semibold text-charcoal/60">Updating your design…</span>
            </div>
          ) : (
            <Image
              key={generatedImage}
              src={generatedImage}
              alt="Your generated design"
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 672px"
              priority
              unoptimized={generatedImage.startsWith("data:")}
            />
          )}
          </div>
        </div>
      </div>

      {/* Refinement success hint */}
      <AnimatePresence>
        {refinementSuccess && !isRefining && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm font-semibold mb-4"
            style={{ color: "var(--color-forest)" }}
          >
            Updated. Want to see it on your gift?
          </motion.p>
        )}
      </AnimatePresence>

      {/* Section 3 — Two choice buttons */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Option A — Refine (secondary) */}
        <motion.button
          type="button"
          onClick={() => setRefinementExpanded((x) => !x)}
          disabled={isRefining || !canRefine}
          className="min-h-[72px] rounded-2xl border border-charcoal/10 bg-[#F5EDE0] px-6 py-4 text-left transition-all hover:border-charcoal/20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[80px]"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="font-bold text-base sm:text-lg text-charcoal">I&apos;d like to make a few changes</div>
          <div className="text-sm text-charcoal/55 mt-1">
            {canRefine ? `Tweak colours, style, or details. Tweaks left: ${refinementsLeft}` : "Maximum tweaks reached."}
          </div>
        </motion.button>

        {/* Option B — Continue (primary) */}
        <MagneticButton
          type="button"
          onClick={onContinue}
          disabled={isRefining}
          className="min-h-[72px] rounded-2xl px-6 py-4 text-left text-base font-bold text-white shadow-[0_18px_34px_-20px_rgba(196,113,74,0.5)] transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[80px] sm:text-lg"
          style={{ backgroundColor: "var(--color-terracotta)" }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div>Show me how this will look on my gift</div>
          <div className="text-white/75 text-sm mt-1">See it on cards, mugs and more.</div>
        </MagneticButton>
      </div>

      {/* Section 4 — Refinement panel (accordion) */}
      <AnimatePresence>
        {refinementExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTransition("base")}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
              <h3 className="text-lg font-bold text-charcoal mb-3">Tell us what you&apos;d like to change</h3>

              {!canRefine ? (
                <div className="rounded-xl border border-charcoal/10 bg-[#F5EDE0] px-4 py-3 mb-4">
                  <p className="text-sm text-charcoal/70 mb-3">
                    You&apos;ve reached the maximum of 3 tweaks for this design. If you&apos;d like, start a fresh design from the prompt.
                  </p>
                  {onStartFresh && (
                    <MagneticButton
                      type="button"
                      onClick={onStartFresh}
                      className="px-4 py-2 rounded-xl bg-terracotta text-white text-sm font-bold hover:opacity-90"
                    >
                      Start a fresh design
                    </MagneticButton>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-charcoal/55 mb-2">Tweaks left: {refinementsLeft}</p>
                  {/* Helper chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {REFINEMENT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => insertChip(chip)}
                        disabled={!canRefine}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#F5EDE0] hover:bg-charcoal/5 text-charcoal/80 transition-colors disabled:opacity-50"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {canRefine && (
                <form onSubmit={handleRefineSubmit} className="space-y-3">
                  <textarea
                    value={safeRefinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    placeholder={PLACEHOLDERS[placeholderIndex]}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-transparent resize-none text-charcoal placeholder:text-charcoal/40"
                    disabled={isRefining}
                  />

                  {inlineError && (
                    <p className="text-sm font-medium text-terracotta">{inlineError}</p>
                  )}

                  <GenerationSafetyNotice
                    hardBlock={refinementContentBlock ? { type: "block", ...refinementContentBlock } : null}
                    rewriteApplied={refinementRewriteApplied ? { type: "rewrite", ...refinementRewriteApplied } : null}
                    error={refinementContentBlock ? null : (typeof refinementError === "string" ? refinementError : refinementError ? String(refinementError) : null)}
                    onSuggestionClick={onRefinementSuggestionClick}
                  />

                  <div className="flex items-center gap-4">
                    <MagneticButton
                      type="submit"
                      disabled={!trimmedText || isRefining || !canRefine}
                      className="px-6 py-3 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "var(--color-terracotta)" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isRefining ? "Updating…" : "Update my design"}
                    </MagneticButton>
                    <button
                      type="button"
                      onClick={() => {
                        setRefinementExpanded(false);
                        setRefinementText("");
                        setInlineError(null);
                      }}
                      className="text-sm font-semibold text-charcoal/55 hover:text-charcoal"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
