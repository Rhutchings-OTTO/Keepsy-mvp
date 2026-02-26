export function TrustBar() {
  const items = [
    "Secure checkout",
    "Fast delivery",
    "Satisfaction guarantee",
    "US/UK support",
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="grid gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm font-semibold text-black/70 shadow-sm sm:grid-cols-4">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-black/10 bg-[#F7F1EB] px-3 py-2 text-center">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
