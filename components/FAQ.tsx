const FAQS = [
  {
    q: "How fast can I make a gift?",
    a: "Most customers finish in under 10 minutes from upload to checkout.",
  },
  {
    q: "When will my order arrive?",
    a: "Typical dispatch is 2–4 business days. See full details on our shipping page.",
  },
  {
    q: "Can I request a refund?",
    a: "Yes. If your item arrives damaged or incorrect, we’ll make it right.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-black sm:text-3xl">FAQs</h2>
      <div className="mt-5 space-y-3">
        {FAQS.map((faq) => (
          <details key={faq.q} className="rounded-xl border border-black/10 bg-white p-4">
            <summary className="cursor-pointer font-semibold">{faq.q}</summary>
            <p className="mt-2 text-black/70">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
