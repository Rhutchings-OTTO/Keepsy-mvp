"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type HardBlockState = {
  type: "block";
  title: string;
  message: string;
  suggestions: string[];
  suggestedPrompt?: string;
  appliedPatches?: Array<{ from: string; to: string }>;
};

export type RewriteAppliedState = {
  type: "rewrite";
  originalPreview: string;
  safePreview: string;
  appliedPatches?: Array<{ from: string; to: string }>;
};

export type GenerationSafetyNoticeProps = {
  hardBlock: HardBlockState | null;
  rewriteApplied: RewriteAppliedState | null;
  /** Generic error (e.g. network, timeout) when not a content block */
  error?: string | null;
  onSuggestionClick?: (suggestion: string) => void;
  onUseSuggestedPromptClick?: (prompt: string) => void;
};

export function GenerationSafetyNotice({
  hardBlock,
  rewriteApplied,
  error,
  onSuggestionClick,
  onUseSuggestedPromptClick,
}: GenerationSafetyNoticeProps) {
  const [showViewChange, setShowViewChange] = useState(false);

  if (!hardBlock && !rewriteApplied && !error) return null;

  const patches = rewriteApplied?.appliedPatches ?? hardBlock?.appliedPatches ?? [];
  const hasPatches = patches.length > 0;

  return (
    <AnimatePresence>
      {hardBlock && (
        <motion.div
          key="block"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,238,0.92))] px-4 py-3 shadow-warm-sm backdrop-blur-sm"
        >
          <h4 className="text-sm font-bold text-charcoal mb-1">{hardBlock.title}</h4>
          <p className="text-sm text-charcoal/70 mb-3">{hardBlock.message}</p>
          {hardBlock.suggestedPrompt && onUseSuggestedPromptClick ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUseSuggestedPromptClick(hardBlock.suggestedPrompt!)}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-terracotta text-white shadow-terra-glow transition hover:opacity-90"
              >
                Try again with suggested wording
              </button>
            </div>
          ) : (
            hardBlock.suggestions.length > 0 &&
            onSuggestionClick && (
              <div className="flex flex-wrap gap-2">
                {hardBlock.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSuggestionClick(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-charcoal/5 hover:bg-charcoal/10 text-charcoal/80 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )
          )}
          {hasPatches && (
            <>
              <button
                type="button"
                onClick={() => setShowViewChange((x) => !x)}
                className="mt-3 text-xs font-semibold text-charcoal/60 hover:text-charcoal underline"
              >
                {showViewChange ? "Hide changes" : "See changes"}
              </button>
              {showViewChange && (
                <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
                  {patches.map((p, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-charcoal/55 line-through">{p.from}</span>
                      <span className="text-charcoal/55 mx-1">→</span>
                      <span className="text-charcoal/80">{p.to}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {error && !hardBlock && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,238,0.92))] px-4 py-3 shadow-warm-sm backdrop-blur-sm"
        >
          <p className="text-sm text-charcoal/70">{typeof error === "string" ? error : String(error)}</p>
        </motion.div>
      )}

      {rewriteApplied && !hardBlock && (
        <motion.div
          key="rewrite"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,238,0.92))] px-4 py-3 text-left shadow-warm-sm backdrop-blur-sm"
        >
          <p className="text-sm text-charcoal/70">
            We adjusted a couple of words to keep this original.
          </p>
          <button
            type="button"
            onClick={() => setShowViewChange((x) => !x)}
            className="mt-2 text-xs font-semibold text-charcoal/60 hover:text-charcoal underline"
          >
            {showViewChange ? "Hide details" : "See changes"}
          </button>
          {showViewChange && (
            <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
              {hasPatches ? (
                patches.map((p, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-charcoal/55 line-through">{p.from}</span>
                    <span className="text-charcoal/55 mx-1">→</span>
                    <span className="text-charcoal/80">{p.to}</span>
                  </div>
                ))
              ) : (
                <>
                  <div>
                    <div className="text-xs text-charcoal/55 mb-0.5">Original:</div>
                    <div className="text-xs text-charcoal/80 break-words">{rewriteApplied.originalPreview}</div>
                  </div>
                  <div>
                    <div className="text-xs text-charcoal/55 mb-0.5">Safe version:</div>
                    <div className="text-xs text-charcoal/80 break-words">{rewriteApplied.safePreview}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
