"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Region } from "@/lib/region";
import { CREATE_EXAMPLES } from "@/content/createExamples";
import { FF } from "@/lib/featureFlags";
import { revealUp } from "@/lib/motion";
import { MockupStage } from "@/components/mockups/MockupStage";

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
            <article
              key={tile.caption}
              className="min-w-[17.5rem] rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,241,0.96))] p-3 shadow-[0_18px_45px_-32px_rgba(34,24,16,0.4)] sm:min-w-[20rem]"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="relative overflow-hidden rounded-xl border border-black/10 bg-[#F4EFE8]">
                  <Image src={tile.beforeImage} alt={tile.beforeLabel} width={170} height={150} className="h-24 w-full object-cover" />
                  <p className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Photo
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-black/10 bg-[#E8EEF8]">
                  <Image src={tile.afterImage} alt={tile.afterLabel} width={170} height={150} className="h-24 w-full object-contain p-1" />
                  <p className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Artwork
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-black/10 bg-[#F1EEE9]">
                  <MockupStage
                    productType={tile.gift.productType}
                    color={tile.gift.color}
                    generatedImage={tile.gift.artworkImage}
                    className="h-24 !rounded-none !border-0 !shadow-none"
                  />
                  <p className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Gift
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{tile.beforeLabel} to {tile.afterLabel}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-black/80">{tile.caption}</p>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
