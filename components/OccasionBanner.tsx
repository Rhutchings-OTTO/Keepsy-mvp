"use client";

import { CalendarHeart } from "lucide-react";
import { getUpcomingOccasion } from "@/lib/occasion";

type OccasionBannerProps = {
  onUseTemplate?: (template: string) => void;
};

export default function OccasionBanner({ onUseTemplate }: OccasionBannerProps) {
  const occasion = getUpcomingOccasion();

  return (
    <section className="rounded-2xl border border-[#E6DCCE] bg-[#FFF9F3] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[#F9EEDD] p-2 text-[#7A5C43]">
          <CalendarHeart className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#513E2F]">{occasion.badgeText}</p>
          <p className="text-sm text-[#6C5643]">{occasion.suggestionCopy}</p>
          {onUseTemplate ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {occasion.templates.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => onUseTemplate(template)}
                  className="rounded-full border border-[#E1CFBC] bg-white px-3 py-1 text-xs text-[#5C4938] transition hover:bg-[#F9F1E8]"
                >
                  {template}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

