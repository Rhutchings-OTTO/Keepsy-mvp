import { OccasionTiles } from "@/components/OccasionTiles";
import { PromoBanner } from "@/components/PromoBanner";
import { Reveal } from "@/components/motion/Reveal";
import { RevealSplitText } from "@/components/motion/RevealSplitText";

export default function GiftIdeasPage() {
  return (
    <>
      <PromoBanner />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Reveal variant="fadeUp">
          <RevealSplitText text="Gift Ideas" as="h1" className="text-4xl font-black" />
          <p className="mt-2 text-black/65">Pick an occasion and start from curated design references, then choose your product.</p>
        </Reveal>
      </section>
      <OccasionTiles />
    </>
  );
}
