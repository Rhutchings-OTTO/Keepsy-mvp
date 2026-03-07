import { getCurrentPromo } from "@/lib/siteConfig";

export function PromoBanner() {
  const devNow = process.env.NEXT_PUBLIC_DEV_DATE;
  const promo = getCurrentPromo(devNow ? new Date(devNow) : undefined);
  if (!promo) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <div
        className="rounded-2xl px-5 py-4"
        style={{ backgroundColor: "rgba(196,113,74,0.08)", borderColor: "rgba(196,113,74,0.20)", border: "1px solid" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--color-terracotta)" }}>
          {promo.title} — {promo.discountLabel}
        </p>
        <p className="mt-0.5 text-sm" style={{ color: "rgba(45,41,38,0.70)" }}>{promo.subtitle}</p>
      </div>
    </section>
  );
}
