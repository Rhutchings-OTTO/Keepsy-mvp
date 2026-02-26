import { getCurrentPromo } from "@/lib/siteConfig";

export function PromoBanner() {
  const devNow = process.env.NEXT_PUBLIC_DEV_DATE;
  const promo = getCurrentPromo(devNow ? new Date(devNow) : undefined);
  if (!promo) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-bold text-amber-900">
          {promo.title} — {promo.discountLabel}
        </p>
        <p className="text-sm text-amber-800">{promo.subtitle}</p>
      </div>
    </section>
  );
}
