import { OccasionTiles } from "@/components/OccasionTiles";
import { PromoBanner } from "@/components/PromoBanner";

export default function GiftIdeasPage() {
  return (
    <>
      <PromoBanner />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-4xl font-black">Gift Ideas</h1>
        <p className="mt-2 text-black/65">Pick an occasion and we pre-select a style + product to get you started.</p>
      </section>
      <OccasionTiles />
    </>
  );
}
