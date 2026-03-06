import { OccasionTiles } from "@/components/OccasionTiles";
import { PromoBanner } from "@/components/PromoBanner";
import { Reveal } from "@/components/motion/Reveal";
import { RevealSplitText } from "@/components/motion/RevealSplitText";

export const metadata = {
  title: "Gift Ideas | Keepsy",
  description: "Browse gift ideas by occasion — birthdays, anniversaries, holidays and more. Find the perfect personalised gift.",
};

export default function GiftIdeasPage() {
  return (
    <>
      <PromoBanner />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal variant="fadeUp">
          <div className="rounded-[2.25rem] border border-white/65 bg-[linear-gradient(180deg,rgba(253,246,238,0.92),rgba(247,236,224,0.95))] p-8 shadow-warm-md backdrop-blur-xl sm:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>Browse ideas</p>
            <div style={{ color: "var(--color-charcoal)" }}>
              <RevealSplitText
                text="Gift Ideas"
                as="h1"
                className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"
              />
            </div>
            <p className="mt-4 max-w-2xl text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
              Start with a polished occasion direction, then make it uniquely yours with AI-generated art.
            </p>
          </div>
        </Reveal>
      </section>
      <OccasionTiles />
    </>
  );
}
