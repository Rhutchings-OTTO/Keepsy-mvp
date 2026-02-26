const STEPS = [
  "Upload photo",
  "Pick a style",
  "Choose product",
  "Delivered",
];

export function Explainer() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-black sm:text-3xl">How it works</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <article key={step} className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-black/50">Step {index + 1}</p>
            <p className="mt-1 text-lg font-bold">{step}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
