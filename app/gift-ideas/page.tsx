import { OccasionTiles } from "@/components/OccasionTiles";
import { PromoBanner } from "@/components/PromoBanner";
import { Reveal } from "@/components/motion/Reveal";
import { RevealSplitText } from "@/components/motion/RevealSplitText";

export default function GiftIdeasPage() {
  return (
    <>
      <PromoBanner />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Reveal variant="fadeUp">
          <div className="rounded-[2.25rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,242,236,0.88))] p-6 shadow-[0_34px_80px_-46px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">Browse ideas</p>
            <RevealSplitText text="Gift Ideas" as="h1" className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" />
            <p className="mt-4 max-w-2xl text-base leading-8 text-black/58">
              Start with a polished occasion direction, then move into product preview and generation with less guesswork.
            </p>
          </div>
        </Reveal>
      </section>
      <OccasionTiles />
    </>
  );
}
