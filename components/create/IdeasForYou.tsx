"use client";

import { useState } from "react";
import type { Region } from "@/lib/region";
import { KineticHeading } from "@/components/motion/KineticHeading";
import { REGION_CONTENT } from "@/content/regionContent";

const MAX_CHIPS = 6;
const MAX_PROMPTS_VISIBLE = 4;

type IdeasForYouProps = {
  region: Region;
  onUsePrompt: (prompt: string) => void;
  onReplaceConfirm?: (prompt: string) => void;
  onReplaceCancel?: () => void;
  pendingReplace: string | null;
};

export function IdeasForYou({
  region,
  onUsePrompt,
  onReplaceConfirm,
  onReplaceCancel,
  pendingReplace,
}: IdeasForYouProps) {
  const [showMore, setShowMore] = useState(false);
  const content = REGION_CONTENT[region];
  const holidayChips = content.holidayBadges.slice(0, 7);
  const promptChips = content.promptChips;
  const visiblePrompts = showMore ? promptChips : promptChips.slice(0, MAX_PROMPTS_VISIBLE);
  const hasMorePrompts = promptChips.length > MAX_PROMPTS_VISIBLE;

  const handleChipClick = (prompt: string) => {
    onUsePrompt(prompt);
  };

  return (
    <section className="w-full">
      <KineticHeading as="h2" className="text-sm font-black uppercase tracking-wider text-charcoal/60">Ideas for you</KineticHeading>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Holidays & occasions</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {holidayChips.slice(0, MAX_CHIPS + 1).map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-charcoal/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-charcoal/65"
          >
            {badge}
          </span>
        ))}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Suggested prompts</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visiblePrompts.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="rounded-full border border-charcoal/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-charcoal/70 transition hover:bg-white"
          >
            {chip}
          </button>
        ))}
      </div>
      {hasMorePrompts && (
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="mt-2 text-xs font-bold text-charcoal/60 underline hover:text-charcoal"
        >
          {showMore ? "Show less" : "Show more"}
        </button>
      )}

      {pendingReplace ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-terracotta/25 bg-terracotta/8 px-3 py-2 text-xs">
          <span className="font-semibold text-charcoal">Replace current prompt?</span>
          {onReplaceConfirm && (
            <button
              type="button"
              onClick={() => onReplaceConfirm(pendingReplace)}
              className="rounded-full bg-terracotta px-3 py-1.5 font-bold text-white shadow-terra-glow transition hover:opacity-90"
            >
              Replace
            </button>
          )}
          {onReplaceCancel && (
            <button
              type="button"
              onClick={onReplaceCancel}
              className="rounded-full border border-charcoal/15 bg-white/80 px-3 py-1.5 font-bold text-charcoal"
            >
              Cancel
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
