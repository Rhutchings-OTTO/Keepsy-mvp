"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ContentBlockError = {
  title: string;
  message: string;
  suggestions: string[];
};

export type GenerationErrorDisplayProps = {
  /** Simple error message (rate limit, timeout, etc.) */
  error: string | null;
  /** Content block with suggestions (neutral, friendly) */
  contentBlock: ContentBlockError | null;
  onSuggestionClick?: (suggestion: string) => void;
  onDismiss?: () => void;
};

export function GenerationErrorDisplay({
  error,
  contentBlock,
  onSuggestionClick,
}: GenerationErrorDisplayProps) {
  if (!error && !contentBlock) return null;

  const isContentBlock = Boolean(contentBlock);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="rounded-xl border border-charcoal/8 bg-white px-4 py-3 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)]"
      >
        {isContentBlock ? (
          <>
            <h4 className="text-sm font-bold text-charcoal mb-1">{contentBlock!.title}</h4>
            <p className="text-sm text-charcoal/70 mb-3">{contentBlock!.message}</p>
            {contentBlock!.suggestions.length > 0 && onSuggestionClick && (
              <div className="flex flex-wrap gap-2">
                {contentBlock!.suggestions.map((s) => (
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
            )}
          </>
        ) : (
          <p className="text-sm text-charcoal/70">{error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
