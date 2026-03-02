"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FF } from "@/lib/featureFlags";

type BeforeAfterSliderProps = {
  beforeSrc: string | null;
  afterSrc: string | null;
};

export default function BeforeAfterSlider({ beforeSrc, afterSrc }: BeforeAfterSliderProps) {
  const [value, setValue] = useState(50);

  const canRender = useMemo(() => Boolean(beforeSrc && afterSrc && FF.beforeAfter), [beforeSrc, afterSrc]);
  if (!canRender || !beforeSrc || !afterSrc) return null;

  return (
    <section className="rounded-3xl border border-black/10 bg-white/75 p-4 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-wider text-black/60">Compare your transformation</h3>
      <p className="mt-1 text-xs font-semibold text-black/55">Slide to compare your original photo with your generated artwork.</p>

      <div className="relative mt-3 h-56 w-full overflow-hidden rounded-2xl border border-black/10 bg-[#F5F1EC]">
        <Image src={beforeSrc} alt="Original upload" fill className="object-cover" unoptimized />
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <Image src={afterSrc} alt="Generated artwork" fill className="object-cover" unoptimized />
        </div>
        <motion.div
          className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
          style={{ left: `${value}%` }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="mt-3 w-full accent-[#24201D]"
        aria-label="Before and after comparison slider"
      />
    </section>
  );
}

