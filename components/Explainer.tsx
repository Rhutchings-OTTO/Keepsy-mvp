import { Reveal } from "@/components/motion/Reveal";

const STEPS = [
  { label: "Upload photo", detail: "Share a photo or describe a moment in words." },
  { label: "Pick a style", detail: "Choose from watercolour, line art, portrait and more." },
  { label: "Choose product", detail: "See your art on mugs, tees, hoodies, and cards." },
  { label: "Delivered", detail: "Printed on premium materials and shipped to your door." },
];

export function Explainer() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <Reveal variant="fadeUp">
        <h2 className="font-serif text-3xl font-bold text-charcoal sm:text-4xl">How it works</h2>
      </Reveal>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.label} variant="fadeUp" delay={index * 0.07}>
            <article className="rounded-2xl border border-charcoal/8 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/40">Step {index + 1}</p>
              <p className="mt-2 font-serif text-lg font-bold text-charcoal">{step.label}</p>
              <p className="mt-1 text-sm leading-6 text-charcoal/60">{step.detail}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
