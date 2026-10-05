"use client";

import { OCCASIONS } from "@/lib/siteConfig";
import { CREATE_EXAMPLES } from "@/content/createExamples";
import { getCountry } from "@/lib/commerce/markets";
import { useDisplayDestination } from "@/components/DestinationSelector";
import { OccasionShowcaseCard } from "@/components/OccasionShowcaseCard";

export function OccasionTiles() {
  const destination = useDisplayDestination();
  const region = getCountry(destination)?.region ?? "UK";
  const visuals = CREATE_EXAMPLES[region].occasionTiles;

  return (
    <section
      className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"
      aria-label="Occasions"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OCCASIONS.map((occasion) => {
          const visual =
            visuals.find((item) => item.id === occasion.id) ?? visuals[0];
          return (
            <li key={occasion.id}>
              <OccasionShowcaseCard
                href={`/create?occasion=${occasion.id}&style=${encodeURIComponent(occasion.defaultStyle)}&product=${occasion.defaultProduct}`}
                title={occasion.title}
                description={occasion.description}
                visual={visual}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
