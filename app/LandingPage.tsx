"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ImageIcon,
  Lock,
  Package,
  PenLine,
  Truck,
  Undo2,
} from "lucide-react";
import type { Region } from "@/lib/region";
import {
  countryForRegion,
  getCountry,
  type CountryCode,
} from "@/lib/commerce/markets";
import {
  formatMoney,
  getUnitPrice,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/commerce/pricing";
import { SHIPPING_TABLE } from "@/lib/commerce/shipping";
import { useDestination } from "@/lib/hooks/useDestination";
import {
  DestinationSuggestionStrip,
  DEFAULT_DESTINATION,
} from "@/components/DestinationSelector";
import { NewsletterSignup } from "@/components/landing/NewsletterSignup";

const CONTAINER = "mx-auto w-full max-w-7xl px-5 sm:px-8";
const EYEBROW = "text-[11px] font-bold uppercase tracking-[0.2em]";
const H2 =
  "mt-3 font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-4xl";
const PRIMARY_BTN =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-7 text-base font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40";
const SECONDARY_BTN =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-charcoal/20 bg-white px-7 text-base font-semibold text-charcoal transition hover:border-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40";

/* ─── Data ───────────────────────────────────────────────────────────────── */

const HERO_IMAGES = [
  {
    src: "/images/refresh/pet-mug.webp",
    alt: "White mug printed with a ginger cat portrait framed by wildflowers",
  },
  {
    src: "/images/refresh/wedding-hoodie.webp",
    alt: "Cream hoodie printed with a small heart and a couple's names",
  },
  {
    src: "/images/refresh/newbaby-card.webp",
    alt: "Greeting card with a photo of a father and his newborn",
  },
  {
    src: "/images/refresh/family-canvas.webp",
    alt: "Canvas print of a family photo hanging on a wall",
  },
];

type Slug = "hoodie" | "tee" | "mug" | "card" | "canvas";

const PRODUCTS: Array<{
  slug: Slug;
  name: string;
  blurb: string;
  image: string;
  alt: string;
  /** Catalogue id used for pricing. Card depends on market. */
  priceId: string | ((region: Region) => string);
  from?: boolean;
}> = [
  {
    slug: "hoodie",
    name: "Hoodie",
    blurb: "Soft fleece, printed on the chest. S–3XL.",
    image: "/mockups/premium-v2/hoodie-white.webp",
    alt: "Plain white hoodie",
    priceId: "hoodie",
  },
  {
    slug: "tee",
    name: "T-shirt",
    blurb: "Heavyweight cotton tee. S–3XL.",
    image: "/mockups/premium-v2/tee-white.webp",
    alt: "Plain white t-shirt",
    priceId: "tee",
  },
  {
    slug: "mug",
    name: "Mug",
    blurb: "11oz ceramic, dishwasher safe.",
    image: "/mockups/premium-v2/mug-white.webp",
    alt: "Plain white mug",
    priceId: "mug",
  },
  {
    slug: "card",
    name: "Greeting card",
    blurb: "Printed card, blank inside for your message.",
    image: "/mockups/premium-v2/plain-card.webp",
    alt: "Plain greeting card",
    priceId: (r) => (r === "US" ? "uscard_1" : "postcard"),
  },
  {
    slug: "canvas",
    name: "Canvas print",
    blurb: "Stretched on a wooden frame, ready to hang.",
    image: "/product-tiles/plain-canvas.png",
    alt: "Plain canvas print",
    priceId: "canvas_10x8",
    from: true,
  },
];

const PRODUCT_TILES = PRODUCTS.map((p) => ({
  src: p.image,
  alt: p.alt,
  name: p.name,
}));

/* ─── Component ──────────────────────────────────────────────────────────── */

type LandingPageProps = {
  /** Legacy region cookie (kept for compatibility). */
  initialRegion?: Region | null;
  /** Destination cookie read on the server, so first paint shows the right currency. */
  initialCountry?: CountryCode | null;
  /** Soft guess from request headers; only used for the suggestion strip. */
  suggestedCountry?: CountryCode | null;
};

export default function LandingPage({
  initialRegion = null,
  initialCountry = null,
  suggestedCountry = null,
}: LandingPageProps) {
  const chosen = useDestination();
  const destination =
    chosen ??
    initialCountry ??
    countryForRegion(initialRegion) ??
    DEFAULT_DESTINATION;
  const country = getCountry(destination) ?? getCountry(DEFAULT_DESTINATION)!;
  const currency = country.currency;
  const region = country.region;
  const rate = SHIPPING_TABLE[country.market];
  const symbol = currency === "usd" ? "$" : "£";

  const price = (p: (typeof PRODUCTS)[number]) => {
    const id = typeof p.priceId === "function" ? p.priceId(region) : p.priceId;
    const n = getUnitPrice(id, currency);
    return n == null ? null : formatMoney(n, currency);
  };

  return (
    <div className="text-charcoal">
      <DestinationSuggestionStrip suggestedCountry={suggestedCountry} />

      {/* ── Hero ── */}
      <section className="page-enter">
        <div
          className={`${CONTAINER} grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24`}
        >
          <div>
            <p className={EYEBROW} style={{ color: "var(--color-terracotta)" }}>
              Personalised gifts, made to order
            </p>
            <h1
              className="mt-4 font-serif font-black leading-[1.0] tracking-[-0.035em] text-charcoal"
              style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.4rem)" }}
            >
              A gift only they could get.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-charcoal/70">
              Upload a photo or describe an idea. See it on a hoodie, mug, card
              or canvas, then order — we print it and deliver it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className={PRIMARY_BTN}
                style={{ backgroundColor: "var(--color-terracotta)" }}
              >
                Start creating
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/shop" className={SECONDARY_BTN}>
                Browse the shop
              </Link>
            </div>
            <p className="mt-6 text-sm text-charcoal/60">
              Delivering to the UK and US · Free delivery over {symbol}
              {FREE_SHIPPING_THRESHOLD} · Secure checkout by Stripe
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-3 sm:gap-4"
            aria-label="Examples of Keepsy gifts"
          >
            {HERO_IMAGES.map((img, i) => (
              <div
                key={img.src}
                className={`relative overflow-hidden rounded-2xl bg-[#F5EDE0] ${i % 2 === 1 ? "translate-y-4 sm:translate-y-6" : ""}`}
                style={{ aspectRatio: "1 / 1" }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  priority={i < 2}
                  sizes="(max-width: 1024px) 50vw, 300px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two ways to make it ── */}
      <section className="py-16 sm:py-24">
        <div className={CONTAINER}>
          <div className="max-w-2xl">
            <p className={EYEBROW} style={{ color: "var(--color-terracotta)" }}>
              Two ways to make it
            </p>
            <h2 className={H2}>Start with a photo, or start with an idea.</h2>
            <p className="mt-3 text-base leading-7 text-charcoal/65">
              Preview your design on your chosen product before you pay.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {/* Upload a photo */}
            <article className="flex flex-col overflow-hidden rounded-3xl border border-charcoal/8 bg-white">
              <div className="grid grid-cols-2 gap-2 bg-[#F5EDE0] p-4">
                <figure
                  className="relative overflow-hidden rounded-xl"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Image
                    src="/images/refresh/source-pet.webp"
                    alt="Original photo of a dog"
                    fill
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="object-cover"
                  />
                  <figcaption className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-charcoal">
                    Your photo
                  </figcaption>
                </figure>
                <figure
                  className="relative overflow-hidden rounded-xl"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Image
                    src="/images/refresh/after-pet.webp"
                    alt="The same dog as a painted portrait"
                    fill
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="object-cover"
                  />
                  <figcaption className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-charcoal">
                    Transformed
                  </figcaption>
                </figure>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(196,113,74,0.12)" }}
                  >
                    <ImageIcon
                      size={20}
                      style={{ color: "var(--color-terracotta)" }}
                      aria-hidden
                    />
                  </span>
                  <h3 className="font-serif text-2xl font-bold tracking-tight">
                    Upload a photo
                  </h3>
                </div>
                <p className="mt-3 text-base leading-7 text-charcoal/70">
                  Print it exactly as it is, or let us turn it into a painting,
                  sketch or illustration.
                </p>
                <ol className="mt-5 space-y-2 text-sm text-charcoal/75">
                  <li className="flex gap-3">
                    <span className="font-bold text-charcoal">1</span> Pick a
                    photo from your phone or computer.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-charcoal">2</span> Keep it
                    as a photo, or choose a style.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-charcoal">3</span> See it on
                    the product and order.
                  </li>
                </ol>
                <div className="mt-auto pt-6">
                  <Link
                    href="/create?mode=upload"
                    className={`${PRIMARY_BTN} w-full sm:w-auto`}
                    style={{ backgroundColor: "var(--color-terracotta)" }}
                  >
                    Use a photo
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>

            {/* Describe an idea */}
            <article className="flex flex-col overflow-hidden rounded-3xl border border-charcoal/8 bg-white">
              <div className="grid grid-cols-2 gap-2 bg-[#F5EDE0] p-4">
                <div
                  className="flex flex-col justify-between rounded-xl border border-charcoal/10 bg-white p-4"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal/45">
                    You type
                  </p>
                  <p className="font-serif text-lg leading-snug text-charcoal sm:text-xl">
                    &ldquo;Our ginger cat Bella surrounded by wildflowers, soft
                    watercolour.&rdquo;
                  </p>
                </div>
                <figure
                  className="relative overflow-hidden rounded-xl"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Image
                    src="/images/refresh/pet-mug.webp"
                    alt="Mug printed with a watercolour cat portrait"
                    fill
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="object-cover"
                  />
                  <figcaption className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-charcoal">
                    On a mug
                  </figcaption>
                </figure>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(44,74,62,0.12)" }}
                  >
                    <PenLine
                      size={20}
                      style={{ color: "var(--color-forest)" }}
                      aria-hidden
                    />
                  </span>
                  <h3 className="font-serif text-2xl font-bold tracking-tight">
                    Describe an idea
                  </h3>
                </div>
                <p className="mt-3 text-base leading-7 text-charcoal/70">
                  No photo? Say what you&apos;d like in plain words and we
                  create the artwork for you.
                </p>
                <ol className="mt-5 space-y-2 text-sm text-charcoal/75">
                  <li className="flex gap-3">
                    <span className="font-bold text-charcoal">1</span> Describe
                    the person, pet, place or moment.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-charcoal">2</span> Choose a
                    style, or let us suggest one.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-charcoal">3</span> See it on
                    the product and order.
                  </li>
                </ol>
                <div className="mt-auto pt-6">
                  <Link
                    href="/create?mode=describe"
                    className={`${PRIMARY_BTN} w-full sm:w-auto`}
                    style={{ backgroundColor: "var(--color-forest)" }}
                  >
                    Describe an idea
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="border-y border-charcoal/8 py-16 sm:py-24"
        style={{ backgroundColor: "var(--color-cream-dark)" }}
      >
        <div className={CONTAINER}>
          <div className="max-w-2xl">
            <p className={EYEBROW} style={{ color: "var(--color-terracotta)" }}>
              How it works
            </p>
            <h2 className={H2}>Three steps, about five minutes.</h2>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            <li className="flex flex-col rounded-3xl border border-charcoal/8 bg-white p-5 sm:p-6">
              <div className="grid grid-cols-5 gap-1.5 rounded-2xl bg-[#FDF6EE] p-3">
                {PRODUCT_TILES.map((t) => (
                  <div
                    key={t.src}
                    className="relative overflow-hidden rounded-lg bg-white"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <Image
                      src={t.src}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </div>
                ))}
              </div>
              <p
                className="mt-5 font-serif text-3xl font-bold leading-none"
                style={{ color: "rgba(196,113,74,0.5)" }}
              >
                1
              </p>
              <h3 className="mt-2 font-serif text-xl font-bold tracking-tight">
                Choose a product and size
              </h3>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                Hoodie, t-shirt, mug, card or canvas. Pick a colour and size
                where it applies.
              </p>
            </li>
            <li className="flex flex-col rounded-3xl border border-charcoal/8 bg-white p-5 sm:p-6">
              <div
                className="relative overflow-hidden rounded-2xl bg-[#FDF6EE]"
                style={{ aspectRatio: "3 / 2" }}
              >
                <Image
                  src="/images/refresh/how-it-works-mug.webp"
                  alt="A golden retriever photo previewed on a white mug"
                  fill
                  sizes="(max-width: 768px) 90vw, 360px"
                  className="object-cover"
                />
              </div>
              <p
                className="mt-5 font-serif text-3xl font-bold leading-none"
                style={{ color: "rgba(196,113,74,0.5)" }}
              >
                2
              </p>
              <h3 className="mt-2 font-serif text-xl font-bold tracking-tight">
                See it on the product
              </h3>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                Preview the placement, then change the style, colour or wording
                until it&apos;s right.
              </p>
            </li>
            <li className="flex flex-col rounded-3xl border border-charcoal/8 bg-white p-5 sm:p-6">
              <div
                className="relative overflow-hidden rounded-2xl bg-[#FDF6EE]"
                style={{ aspectRatio: "3 / 2" }}
              >
                <Image
                  src="/images/refresh/about-gifting.webp"
                  alt="A gift box being tied with a ribbon next to a printed mug and card"
                  fill
                  sizes="(max-width: 768px) 90vw, 360px"
                  className="object-cover"
                />
              </div>
              <p
                className="mt-5 font-serif text-3xl font-bold leading-none"
                style={{ color: "rgba(196,113,74,0.5)" }}
              >
                3
              </p>
              <h3 className="mt-2 font-serif text-xl font-bold tracking-tight">
                Order, we print and deliver
              </h3>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                Made to order in 2–4 working days, then delivered
                {rate
                  ? ` in ${rate.eta.min}–${rate.eta.max} working days`
                  : ""}{" "}
                to {country.name}.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Products ── */}
      <section className="py-16 sm:py-24">
        <div className={CONTAINER}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p
                className={EYEBROW}
                style={{ color: "var(--color-terracotta)" }}
              >
                The products
              </p>
              <h2 className={H2}>Everyday things. Entirely yours.</h2>
              <p className="mt-3 text-base leading-7 text-charcoal/65">
                Prices shown in {currency === "usd" ? "US dollars" : "pounds"}{" "}
                for delivery to {country.name}.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-charcoal/70 hover:text-charcoal"
            >
              See the shop <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
            {PRODUCTS.map((p) => {
              const label = price(p);
              return (
                <li key={p.slug}>
                  <Link
                    href={`/product/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/8 bg-white transition hover:border-charcoal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
                  >
                    <div
                      className="relative bg-[#F5EDE0]"
                      style={{ aspectRatio: "1 / 1" }}
                    >
                      <Image
                        src={p.image}
                        alt={p.alt}
                        fill
                        sizes="(max-width: 640px) 50vw, 220px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="font-serif text-lg font-bold leading-tight">
                        {p.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-charcoal/60">
                        {p.blurb}
                      </p>
                      <p className="mt-auto pt-3 text-sm font-semibold">
                        {label
                          ? p.from
                            ? `From ${label}`
                            : label
                          : "See price"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Good to know ── */}
      <section className="border-t border-charcoal/8 py-16 sm:py-20">
        <div className={CONTAINER}>
          <p className={EYEBROW} style={{ color: "var(--color-terracotta)" }}>
            Good to know
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li className="flex gap-4">
              <Lock
                size={22}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-forest)" }}
                aria-hidden
              />
              <div>
                <p className="font-semibold">Secure checkout</p>
                <p className="mt-1 text-sm leading-6 text-charcoal/65">
                  Payments are handled by Stripe. We never see your card
                  details.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Package
                size={22}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-forest)" }}
                aria-hidden
              />
              <div>
                <p className="font-semibold">Printed near you</p>
                <p className="mt-1 text-sm leading-6 text-charcoal/65">
                  Made to order by established print partners serving the UK and
                  US.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Truck
                size={22}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-forest)" }}
                aria-hidden
              />
              <div>
                <p className="font-semibold">Delivery to {country.name}</p>
                <p className="mt-1 text-sm leading-6 text-charcoal/65">
                  {rate
                    ? `${formatMoney(rate.fee, currency)} standard delivery, free over ${formatMoney(rate.freeThreshold ?? FREE_SHIPPING_THRESHOLD, currency)}.`
                    : "See delivery details."}{" "}
                  <Link
                    href="/shipping"
                    className="underline underline-offset-2"
                  >
                    Details
                  </Link>
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Undo2
                size={22}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-forest)" }}
                aria-hidden
              />
              <div>
                <p className="font-semibold">If something&apos;s wrong</p>
                <p className="mt-1 text-sm leading-6 text-charcoal/65">
                  Damaged or misprinted? Tell us within 30 days of delivery and
                  we&apos;ll reprint or refund.{" "}
                  <Link
                    href="/refunds"
                    className="underline underline-offset-2"
                  >
                    Our policy
                  </Link>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section
        className="py-16 sm:py-24"
        style={{ backgroundColor: "var(--color-cream-dark)" }}
      >
        <div
          className={`${CONTAINER} grid gap-8 lg:grid-cols-[1fr_minmax(0,480px)] lg:items-start lg:gap-16`}
        >
          <div>
            <p className={EYEBROW} style={{ color: "var(--color-terracotta)" }}>
              Newsletter
            </p>
            <h2 className={H2}>10% off your first order</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-charcoal/65">
              Join the list and we&apos;ll email you a welcome code, plus
              occasional gift ideas and new products. No spam, and you can stop
              any time.
            </p>
          </div>
          <div className="rounded-3xl border border-charcoal/8 bg-white p-6 sm:p-8">
            <NewsletterSignup
              source="homepage"
              currency={currency}
              tone="light"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
