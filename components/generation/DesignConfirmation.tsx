"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { GenerationSafetyNotice } from "@/components/safety/GenerationSafetyNotice";
import { motionTransition } from "@/lib/motion";

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
  refinementRewriteApplied?: { originalPreview: string; safePreview: string } | null;
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
      className="max-w-[980px] mx-auto w-full px-4 sm:px-6"
    >
      {/* Back link */}
      <button
        onClick={onBackToPrompt}
        className="text-sm font-semibold text-black/55 hover:text-black inline-flex items-center gap-1 mb-8 transition-colors"
        type="button"
      >
        <ChevronLeft size={16} aria-hidden />
        Back to prompt
      </button>

      {/* Section 1 — Title + reassurance */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-2">How does this look?</h1>
        <p className="text-black/60 font-semibold text-sm sm:text-base">You can still make changes later.</p>
      </div>

      {/* Section 2 — Large image preview */}
      <div className="flex justify-center mb-10">
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] max-w-2xl mx-auto rounded-2xl overflow-hidden bg-white/80 border border-black/10 shadow-lg">
          {isRefining ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/5 rounded-2xl">
              <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span className="text-sm font-semibold text-black/60">Updating your design…</span>
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

      {/* Refinement success hint */}
      <AnimatePresence>
        {refinementSuccess && !isRefining && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm font-semibold text-emerald-700 mb-4"
          >
            Updated. Want to see it on your gift?
          </motion.p>
        )}
      </AnimatePresence>

      {/* Section 3 — Two choice buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Option A — Refine (secondary) */}
        <motion.button
          type="button"
          onClick={() => setRefinementExpanded((x) => !x)}
          disabled={isRefining || !canRefine}
          className="min-h-[72px] sm:min-h-[80px] px-6 py-4 rounded-2xl border-2 border-black/15 bg-white/90 hover:bg-white hover:border-black/25 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed text-left transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="font-bold text-base sm:text-lg text-black">I&apos;d like to make a few changes</div>
          <div className="text-sm text-black/55 mt-1">
            {canRefine ? `Tweak colours, style, or details. Tweaks left: ${refinementsLeft}` : "Maximum tweaks reached."}
          </div>
        </motion.button>

        {/* Option B — Continue (primary) */}
        <motion.button
          type="button"
          onClick={onContinue}
          disabled={isRefining}
          className="min-h-[72px] sm:min-h-[80px] px-6 py-4 rounded-2xl bg-black text-white font-bold text-base sm:text-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed text-left transition-all shadow-lg"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div>Show me how this will look on my gift</div>
          <div className="text-white/75 text-sm mt-1">See it on cards, mugs and more.</div>
        </motion.button>
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
            <div className="border border-black/10 rounded-2xl bg-white/90 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-black mb-3">Tell us what you&apos;d like to change</h3>

              {!canRefine ? (
                <div className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 mb-4">
                  <p className="text-sm text-black/70 mb-3">
                    You&apos;ve reached the maximum of 3 tweaks for this design. If you&apos;d like, start a fresh design from the prompt.
                  </p>
                  {onStartFresh && (
                    <button
                      type="button"
                      onClick={onStartFresh}
                      className="px-4 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-black/90"
                    >
                      Start a fresh design
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-black/55 mb-2">Tweaks left: {refinementsLeft}</p>
                  {/* Helper chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {REFINEMENT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => insertChip(chip)}
                        disabled={!canRefine}
                        className="px-3 py-1.5 rounded-full text-sm font-semibold bg-black/5 hover:bg-black/10 text-black/80 transition-colors disabled:opacity-50"
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
                    className="w-full px-4 py-3 rounded-xl border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent resize-none text-black placeholder:text-black/40"
                    disabled={isRefining}
                  />

                  {inlineError && (
                    <p className="text-sm text-amber-700 font-medium">{inlineError}</p>
                  )}

                  <GenerationSafetyNotice
                    hardBlock={refinementContentBlock ? { type: "block", ...refinementContentBlock } : null}
                    rewriteApplied={refinementRewriteApplied ? { type: "rewrite", ...refinementRewriteApplied } : null}
                    error={refinementContentBlock ? null : (typeof refinementError === "string" ? refinementError : refinementError ? String(refinementError) : null)}
                    onSuggestionClick={onRefinementSuggestionClick}
                  />

                  <div className="flex items-center gap-4">
                    <motion.button
                      type="submit"
                      disabled={!trimmedText || isRefining || !canRefine}
                      className="px-6 py-3 rounded-xl bg-black text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isRefining ? "Updating…" : "Update my design"}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefinementExpanded(false);
                        setRefinementText("");
                        setInlineError(null);
                      }}
                      className="text-sm font-semibold text-black/55 hover:text-black"
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
