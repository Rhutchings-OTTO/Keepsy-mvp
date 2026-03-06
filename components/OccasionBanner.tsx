"use client";

import { CalendarHeart } from "lucide-react";
import { getUpcomingOccasion } from "@/lib/occasion";

type OccasionBannerProps = {
  onUseTemplate?: (template: string) => void;
};

export default function OccasionBanner({ onUseTemplate }: OccasionBannerProps) {
  const occasion = getUpcomingOccasion();

  return (
    <section
      className="rounded-[1.5rem] border border-white/65 p-4 shadow-warm-sm backdrop-blur-sm"
      style={{ backgroundColor: "rgba(253,246,238,0.88)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 rounded-full p-2"
          style={{ backgroundColor: "rgba(196,113,74,0.12)", color: "var(--color-terracotta)" }}
        >
          <CalendarHeart className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-charcoal">{occasion.badgeText}</p>
          <p className="mt-0.5 text-sm leading-6 text-charcoal/65">{occasion.suggestionCopy}</p>
          {onUseTemplate && (
            <div className="mt-2 flex flex-wrap gap-2">
              {occasion.templates.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => onUseTemplate(template)}
                  className="rounded-full border border-black/12 bg-white/80 px-3 py-1 text-xs font-medium text-charcoal transition hover:bg-white hover:border-terracotta/40 focus:outline-none focus:ring-2 focus:ring-terracotta/25"
                >
                  {template}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
