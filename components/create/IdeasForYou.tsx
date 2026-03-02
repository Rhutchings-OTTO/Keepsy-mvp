"use client";

import { useState } from "react";
import type { Region } from "@/lib/region";
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
    <section className="mt-6 w-full rounded-2xl border border-black/10 bg-white/75 p-4 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-wider text-black/60">Ideas for you</h2>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-black/45">Holidays & occasions</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {holidayChips.slice(0, MAX_CHIPS + 1).map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-semibold text-black/65"
          >
            {badge}
          </span>
        ))}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-black/45">Suggested prompts</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visiblePrompts.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-black/5"
          >
            {chip}
          </button>
        ))}
      </div>
      {hasMorePrompts && (
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="mt-2 text-xs font-bold text-black/60 underline hover:text-black"
        >
          {showMore ? "Show less" : "Show more"}
        </button>
      )}

      {pendingReplace ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          <span className="font-semibold text-amber-800">Replace current prompt?</span>
          {onReplaceConfirm && (
            <button
              type="button"
              onClick={() => onReplaceConfirm(pendingReplace)}
              className="rounded-full bg-amber-700 px-3 py-1.5 font-bold text-white"
            >
              Replace
            </button>
          )}
          {onReplaceCancel && (
            <button
              type="button"
              onClick={onReplaceCancel}
              className="rounded-full border border-amber-300 px-3 py-1.5 font-bold text-amber-800"
            >
              Cancel
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
