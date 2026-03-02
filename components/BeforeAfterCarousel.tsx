"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Region } from "@/lib/region";
import { CREATE_EXAMPLES } from "@/content/createExamples";
import { FF } from "@/lib/featureFlags";
import { revealUp } from "@/lib/motion";

type BeforeAfterCarouselProps = {
  region: Region;
};

export default function BeforeAfterCarousel({ region }: BeforeAfterCarouselProps) {
  const [showMobile, setShowMobile] = useState(false);

  if (!FF.beforeAfter) return null;

  return (
    <motion.section variants={revealUp} initial="initial" animate="animate" className="mt-4 w-full rounded-3xl border border-black/10 bg-white/70 p-4 text-left shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-black/50">From memory to gift</p>
          <h3 className="mt-1 text-lg font-black text-[#2D241E]">Photo to artwork to gift</h3>
        </div>
        <Sparkles size={16} className="text-black/45" />
      </div>

      <button
        type="button"
        onClick={() => setShowMobile((prev) => !prev)}
        className="mt-3 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60 sm:hidden"
      >
        {showMobile ? "Hide examples" : "Show examples"}
      </button>

      <div className={`mt-3 ${showMobile ? "block" : "hidden"} sm:block`}>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {CREATE_EXAMPLES[region].beforeAfterTiles.map((tile) => (
            <article key={tile.caption} className="min-w-[15rem] rounded-2xl border border-black/10 bg-white p-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#F4EFE8] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-black/45">Photo</p>
                  <p className="mt-5 text-xs font-semibold text-black/65">{tile.beforeLabel}</p>
                </div>
                <div className="rounded-xl bg-[#E8EEF8] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-black/45">Artwork</p>
                  <p className="mt-5 text-xs font-semibold text-black/65">{tile.afterLabel}</p>
                </div>
                <div className="rounded-xl bg-[#F1EEE9] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-black/45">Gift</p>
                  <p className="mt-5 text-xs font-semibold text-black/65">Ready to print</p>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-black/60">{tile.caption}</p>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

