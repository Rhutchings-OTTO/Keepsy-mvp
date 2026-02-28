import Link from "next/link";
import Image from "next/image";
import { OCCASIONS, getSeasonalUrgency } from "@/lib/siteConfig";

export function OccasionTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-black sm:text-3xl">Gift ideas by occasion</h2>
      <p className="mt-2 text-black/65">Start with curated design directions for each occasion.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OCCASIONS.map((occasion) => (
          (() => {
            const urgency = getSeasonalUrgency(occasion.id, new Date(process.env.NEXT_PUBLIC_DEV_DATE || Date.now()));
            return (
          <Link
            key={occasion.id}
            href={`/create?occasion=${occasion.id}&style=${encodeURIComponent(occasion.defaultStyle)}&product=${occasion.defaultProduct}`}
            className="rounded-2xl border border-black/10 bg-white p-3 hover:shadow-md"
          >
            <Image src={occasion.image} alt={occasion.title} width={420} height={280} className="h-36 w-full rounded-xl object-cover" />
            <h3 className="mt-3 font-bold">{occasion.title}</h3>
            <p className="text-sm text-black/65">{occasion.description}</p>
            {urgency && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">{urgency}</p>}
          </Link>
            );
          })()
        ))}
      </div>
    </section>
  );
}
