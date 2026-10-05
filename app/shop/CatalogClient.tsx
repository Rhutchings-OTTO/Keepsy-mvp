"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCountry } from "@/lib/commerce/markets";
import {
  formatMoney,
  getUnitPrice,
  type Currency,
} from "@/lib/commerce/pricing";
import { isProductAvailableInMarket } from "@/lib/commerce/shipping";
import { PRODUCTS as PRODUCT_SPECS } from "@/lib/products";
import { useDisplayDestination } from "@/components/DestinationSelector";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "hoodie" | "tee" | "mug" | "card" | "canvas";
type Filter = "all" | Category;
type SortKey = "featured" | "price-asc" | "price-desc";

type CatalogItem = {
  id: string;
  name: string;
  category: Category;
  /** Catalogue id used for price + availability. Card depends on market. */
  priceId: string | ((region: "UK" | "US") => string);
  from?: boolean;
  /** Colour key used by the create flow (`/create?product=…&color=…`). */
  color?: "white" | "black" | "blue";
  colorName?: string;
  image: string;
  alt: string;
  /** Product page slug (for “Details”). */
  slug: Category;
};

// ─── Catalogue (honest: names, real prices, real colours) ───────────────────

const HOODIE_COLORS = PRODUCT_SPECS.hoodie.colors ?? [];
const TEE_COLORS = PRODUCT_SPECS.tshirt.colors ?? [];

function colorKey(name: string): "white" | "black" | "blue" {
  const n = name.toLowerCase();
  if (n === "black") return "black";
  if (n === "navy" || n === "blue") return "blue";
  return "white";
}

const HOODIE_IMAGES: Record<string, { image: string; alt: string }> = {
  white: {
    image: "/images/refresh/newbaby-hoodie.webp",
    alt: "White hoodie with a printed design",
  },
  black: {
    image: "/images/refresh/pet-hoodie.webp",
    alt: "Black hoodie with a printed pet portrait",
  },
  blue: {
    image: "/images/refresh/wedding-hoodie-blue.webp",
    alt: "Navy hoodie with a printed design",
  },
};
const TEE_IMAGES: Record<string, { image: string; alt: string }> = {
  white: {
    image: "/images/refresh/friends-tee.webp",
    alt: "White t-shirt with a printed photo",
  },
  black: {
    image: "/images/refresh/bulldog-tee.webp",
    alt: "Black t-shirt with a printed bulldog design",
  },
  blue: {
    image: "/images/refresh/golf-tee.webp",
    alt: "Navy t-shirt with a printed design",
  },
};

const ITEMS: CatalogItem[] = [
  ...HOODIE_COLORS.map((c): CatalogItem => {
    const key = colorKey(c.name);
    return {
      id: `hoodie-${key}`,
      name: "Hoodie",
      category: "hoodie",
      slug: "hoodie",
      priceId: "hoodie",
      color: key,
      colorName: c.name,
      ...HOODIE_IMAGES[key],
    };
  }),
  ...TEE_COLORS.map((c): CatalogItem => {
    const key = colorKey(c.name);
    return {
      id: `tee-${key}`,
      name: "T-shirt",
      category: "tee",
      slug: "tee",
      priceId: "tee",
      color: key,
      colorName: c.name,
      ...TEE_IMAGES[key],
    };
  }),
  {
    id: "mug",
    name: "Mug",
    category: "mug",
    slug: "mug",
    priceId: "mug",
    color: "white",
    colorName: "White",
    image: "/images/refresh/pet-mug.webp",
    alt: "White mug with a printed cat portrait",
  },
  {
    id: "card",
    name: "Greeting card",
    category: "card",
    slug: "card",
    priceId: (region) => (region === "US" ? "uscard_1" : "postcard"),
    image: "/images/refresh/newbaby-card.webp",
    alt: "Greeting card with a printed photo",
  },
  {
    id: "canvas",
    name: "Canvas print",
    category: "canvas",
    slug: "canvas",
    priceId: "canvas_10x8",
    from: true,
    image: "/images/refresh/family-canvas.webp",
    alt: "Canvas print of a family photo on a wall",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Keeps the existing href scheme used by the create flow. */
function productHref(item: CatalogItem): string {
  const base = `/create?product=${item.category}`;
  if (item.category === "canvas") return base;
  return item.color ? `${base}&color=${item.color}` : base;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hoodie", label: "Hoodies" },
  { key: "tee", label: "T-shirts" },
  { key: "mug", label: "Mugs" },
  { key: "card", label: "Cards" },
  { key: "canvas", label: "Canvas" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
];

// ─── Card ─────────────────────────────────────────────────────────────────────

function ProductCard({
  item,
  price,
  currency,
  available,
  countryName,
}: {
  item: CatalogItem;
  price: number | null;
  currency: Currency;
  available: boolean;
  countryName: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/8 bg-white transition hover:border-charcoal/20">
      <Link
        href={`/product/${item.slug}`}
        className="relative block bg-[#F5EDE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracotta/40"
        style={{ aspectRatio: "4 / 5" }}
      >
        <Image
          src={item.image}
          alt={item.alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg font-bold leading-tight text-charcoal">
              {item.name}
            </h2>
            {item.colorName ? (
              <p className="mt-0.5 text-xs text-charcoal/55">
                {item.colorName}
              </p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm font-semibold text-charcoal">
            {price == null
              ? "—"
              : `${item.from ? "From " : ""}${formatMoney(price, currency)}`}
          </p>
        </div>
        <p className="mt-2 text-xs text-charcoal/55">
          {available
            ? `Delivers to ${countryName}`
            : `Not available in ${countryName} yet`}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Link
            href={productHref(item)}
            aria-disabled={!available}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Personalise
          </Link>
          <Link
            href={`/product/${item.slug}`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl text-sm font-medium text-charcoal/70 transition hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CatalogClient() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const destination = useDisplayDestination();
  const country = getCountry(destination) ?? getCountry("GB")!;
  const currency = country.currency;

  const rows = useMemo(() => {
    const withPrice = ITEMS.map((item) => {
      const id =
        typeof item.priceId === "function"
          ? item.priceId(country.region)
          : item.priceId;
      return {
        item,
        price: getUnitPrice(id, currency),
        available: isProductAvailableInMarket(id, country.market),
      };
    });
    const filtered =
      filter === "all"
        ? withPrice
        : withPrice.filter((r) => r.item.category === filter);
    if (sort === "featured") return filtered;
    return [...filtered].sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      return sort === "price-asc" ? pa - pb : pb - pa;
    });
  }, [filter, sort, currency, country.region, country.market]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
      {/* Intro */}
      <section className="py-10 sm:py-14">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-terracotta)" }}
        >
          Shop
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
          Every product, ready to personalise.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-charcoal/65">
          Choose the product first, then add your photo or idea. Prices shown
          for delivery to {country.name}.
        </p>
      </section>

      {/* Filters */}
      <div
        className="sticky top-16 z-30 -mx-5 border-y border-charcoal/8 px-5 sm:-mx-8 sm:px-8"
        style={{
          backgroundColor: "rgba(253,246,238,0.94)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filter by product"
            className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:pb-0"
          >
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={active}
                  className={`inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 ${
                    active
                      ? "text-white"
                      : "border border-charcoal/15 bg-white text-charcoal/70 hover:border-charcoal/35 hover:text-charcoal"
                  }`}
                  style={
                    active
                      ? { backgroundColor: "var(--color-charcoal)" }
                      : undefined
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal/60">
            <span className="shrink-0">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="min-h-[40px] rounded-lg border border-charcoal/15 bg-white px-3 text-sm font-medium text-charcoal"
              style={{ width: "auto" }}
            >
              {SORTS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Grid */}
      <section className="py-8 sm:py-12" aria-live="polite">
        <p className="text-sm text-charcoal/55">
          {rows.length} {rows.length === 1 ? "product" : "products"}
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {rows.map(({ item, price, available }) => (
            <li key={item.id}>
              <ProductCard
                item={item}
                price={price}
                currency={currency}
                available={available}
                countryName={country.name}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Help */}
      <section className="mb-16 rounded-3xl border border-charcoal/8 bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-charcoal">
          Not sure which to pick?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/65">
          Mugs and cards are the quickest, most affordable gifts. Hoodies and
          t-shirts come in S–3XL in white, navy or black. Canvas prints come in
          many sizes and arrive ready to hang.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/create"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Start with your photo or idea
          </Link>
          <Link
            href="/gift-ideas"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-charcoal/15 bg-white px-5 text-sm font-semibold text-charcoal transition hover:border-charcoal/35"
          >
            Gift ideas by occasion
          </Link>
        </div>
      </section>
    </div>
  );
}
