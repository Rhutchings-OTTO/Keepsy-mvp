"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Region } from "@/lib/region";
import { CREATE_EXAMPLES } from "@/content/createExamples";
import { FF } from "@/lib/featureFlags";
import { revealUp } from "@/lib/motion";
import { OCCASIONS, getSeasonalUrgency } from "@/lib/siteConfig";
import { OccasionShowcaseCard } from "@/components/OccasionShowcaseCard";

type BeforeAfterCarouselProps = {
  region: Region;
};

export default function BeforeAfterCarousel({ region }: BeforeAfterCarouselProps) {
  const [showMobile, setShowMobile] = useState(false);

  if (!FF.beforeAfter) return null;

  return (
    <motion.section variants={revealUp} initial="initial" animate="animate" className="mt-4 w-full rounded-2xl border border-charcoal/10 bg-white p-4 text-left shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-charcoal/50">Gift-ready inspiration</p>
          <h3 className="mt-1 text-lg font-black text-charcoal">Gift ideas by occasion</h3>
        </div>
        <Sparkles size={16} className="text-charcoal/45" />
      </div>

      <button
        type="button"
        onClick={() => setShowMobile((prev) => !prev)}
        className="mt-3 rounded-full border border-charcoal/15 px-3 py-1 text-xs font-semibold text-charcoal/60 sm:hidden"
      >
        {showMobile ? "Hide examples" : "Show examples"}
      </button>

      <div className={`mt-3 ${showMobile ? "block" : "hidden"} sm:block`}>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {OCCASIONS.map((occasion) => {
            const visual =
              CREATE_EXAMPLES[region].occasionTiles.find((item) => item.id === occasion.id) ??
              CREATE_EXAMPLES[region].occasionTiles[0];
            const urgency = getSeasonalUrgency(
              occasion.id,
              process.env.NEXT_PUBLIC_DEV_DATE ? new Date(process.env.NEXT_PUBLIC_DEV_DATE) : new Date()
            );

            return (
              <OccasionShowcaseCard
                key={occasion.id}
                href={`/create?occasion=${occasion.id}&style=${encodeURIComponent(occasion.defaultStyle)}&product=${occasion.defaultProduct}`}
                title={occasion.title}
                description={occasion.description}
                urgency={urgency}
                visual={visual}
                className="min-w-[17.5rem] sm:min-w-[20rem]"
              />
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
