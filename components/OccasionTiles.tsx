"use client";

import Image from "next/image";
import { OCCASIONS, getSeasonalUrgency } from "@/lib/siteConfig";
import { Reveal } from "@/components/motion/Reveal";
import { InteractiveCard } from "@/components/ui/InteractiveCard";

export function OccasionTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <Reveal variant="fadeUp">
        <h2 className="text-2xl font-black sm:text-3xl">Gift ideas by occasion</h2>
        <p className="mt-2 text-black/65">Start with curated design directions for each occasion.</p>
      </Reveal>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OCCASIONS.map((occasion, i) => {
          const urgency = getSeasonalUrgency(occasion.id, process.env.NEXT_PUBLIC_DEV_DATE ? new Date(process.env.NEXT_PUBLIC_DEV_DATE) : new Date());
          return (
            <Reveal key={occasion.id} variant="scaleIn" delay={i * 0.06}>
              <InteractiveCard
                href={`/create?occasion=${occasion.id}&style=${encodeURIComponent(occasion.defaultStyle)}&product=${occasion.defaultProduct}`}
                image={<Image src={occasion.image} alt={occasion.title} width={420} height={280} className="h-36 w-full rounded-xl object-cover" />}
                title={occasion.title}
                subtitle={occasion.description}
                className="border-black/10 bg-white"
              >
                {urgency && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">{urgency}</p>}
              </InteractiveCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
