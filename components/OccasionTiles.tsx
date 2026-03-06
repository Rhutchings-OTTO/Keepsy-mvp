"use client";

import { OCCASIONS, getSeasonalUrgency } from "@/lib/siteConfig";
import { CREATE_EXAMPLES } from "@/content/createExamples";
import { getRegion } from "@/lib/region";
import { Reveal } from "@/components/motion/Reveal";
import { RevealSplitText } from "@/components/motion/RevealSplitText";
import { OccasionShowcaseCard } from "@/components/OccasionShowcaseCard";

export function OccasionTiles() {
  const region = getRegion() ?? "UK";
  const visuals = CREATE_EXAMPLES[region].occasionTiles;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <Reveal variant="fadeUp">
        <RevealSplitText
          text="Gift ideas by occasion"
          as="h2"
          className="text-2xl font-black sm:text-3xl"
        />
        <p className="mt-2 text-black/65">
          Start with a polished gift direction, then make it your own.
        </p>
      </Reveal>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OCCASIONS.map((occasion, i) => {
          const urgency = getSeasonalUrgency(
            occasion.id,
            process.env.NEXT_PUBLIC_DEV_DATE ? new Date(process.env.NEXT_PUBLIC_DEV_DATE) : new Date()
          );
          const visual = visuals.find((item) => item.id === occasion.id) ?? visuals[0];

          return (
            <Reveal key={occasion.id} variant="scaleIn" delay={i * 0.06}>
              <OccasionShowcaseCard
                href={`/create?occasion=${occasion.id}&style=${encodeURIComponent(occasion.defaultStyle)}&product=${occasion.defaultProduct}`}
                title={occasion.title}
                description={occasion.description}
                urgency={urgency}
                visual={visual}
              />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
