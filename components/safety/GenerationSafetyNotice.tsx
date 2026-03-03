"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type HardBlockState = {
  type: "block";
  title: string;
  message: string;
  suggestions: string[];
};

export type RewriteAppliedState = {
  type: "rewrite";
  originalPreview: string;
  safePreview: string;
};

export type GenerationSafetyNoticeProps = {
  hardBlock: HardBlockState | null;
  rewriteApplied: RewriteAppliedState | null;
  /** Generic error (e.g. network, timeout) when not a content block */
  error?: string | null;
  onSuggestionClick?: (suggestion: string) => void;
};

export function GenerationSafetyNotice({
  hardBlock,
  rewriteApplied,
  error,
  onSuggestionClick,
}: GenerationSafetyNoticeProps) {
  const [showViewChange, setShowViewChange] = useState(false);

  if (!hardBlock && !rewriteApplied && !error) return null;

  return (
    <AnimatePresence>
      {hardBlock && (
        <motion.div
          key="block"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-black/10 bg-white/95 px-4 py-3 shadow-sm"
        >
          <h4 className="text-sm font-bold text-black mb-1">{hardBlock.title}</h4>
          <p className="text-sm text-black/70 mb-3">{hardBlock.message}</p>
          {hardBlock.suggestions.length > 0 && onSuggestionClick && (
            <div className="flex flex-wrap gap-2">
              {hardBlock.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestionClick(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-black/5 hover:bg-black/10 text-black/80 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {error && !hardBlock && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-black/10 bg-white/95 px-4 py-3 shadow-sm"
        >
          <p className="text-sm text-black/70">{error}</p>
        </motion.div>
      )}

      {rewriteApplied && !hardBlock && (
        <motion.div
          key="rewrite"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-left"
        >
          <p className="text-sm text-black/70">
            We made a small tweak so your design uses original characters.
          </p>
          <button
            type="button"
            onClick={() => setShowViewChange((x) => !x)}
            className="mt-2 text-xs font-semibold text-black/60 hover:text-black underline"
          >
            {showViewChange ? "Hide details" : "View change"}
          </button>
          {showViewChange && (
            <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
              <div>
                <div className="text-xs text-black/55 mb-0.5">Original:</div>
                <div className="text-xs text-black/80 break-words">{rewriteApplied.originalPreview}</div>
              </div>
              <div>
                <div className="text-xs text-black/55 mb-0.5">Safe version:</div>
                <div className="text-xs text-black/80 break-words">{rewriteApplied.safePreview}</div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
