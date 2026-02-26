type Testimonial = {
  name: string;
  age: number;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  { name: "Amelia", age: 34, quote: "I made a birthday card for my mum in under 10 minutes. She cried." },
  { name: "Noah", age: 29, quote: "The pet mug looked exactly like our dog. Perfect anniversary gift." },
  { name: "Olivia", age: 41, quote: "The flow is so easy even for non-tech family members." },
  { name: "Ethan", age: 37, quote: "Fast shipping and genuinely premium print quality." },
  { name: "Sophie", age: 32, quote: "I love the style presets; no prompt-writing stress." },
  { name: "Lucas", age: 45, quote: "Great customer support and a smooth reorder process." },
];

export function TestimonialGrid() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-6">
        <p className="text-sm font-bold text-black/60">Rated 4.8/5 by 2,400+ customers</p>
        <h2 className="text-2xl font-black sm:text-3xl">Loved by gift-givers across the UK and US</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, idx) => (
          <article key={`${t.name}-${idx}`} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div
                aria-hidden
                className="h-10 w-10 rounded-full border border-white/80 bg-gradient-to-br from-sky-300 to-pink-300 shadow-sm"
              />
              <div className="font-semibold">
                {t.name}, {t.age}
              </div>
            </div>
            <p className="leading-relaxed text-black/70">“{t.quote}”</p>
          </article>
        ))}
      </div>
    </section>
  );
}
