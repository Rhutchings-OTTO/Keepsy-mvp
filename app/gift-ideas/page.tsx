import type { Metadata } from "next";
import Link from "next/link";
import { OccasionTiles } from "@/components/OccasionTiles";

export const metadata: Metadata = {
  title: "Personalised Gift Ideas by Occasion — Keepsy",
  description:
    "Gift ideas for Mother's Day, Father's Day, birthdays, anniversaries, Christmas and pets. Every gift is printed with your own photo or idea and previewed before you order.",
  alternates: {
    canonical: "https://keepsy.store/gift-ideas",
  },
  openGraph: {
    title: "Personalised Gift Ideas by Occasion — Keepsy",
    description:
      "Gift ideas for Mother's Day, Father's Day, birthdays, anniversaries, Christmas and pets. Printed with your own photo or idea and previewed before you order.",
    type: "website",
    url: "https://keepsy.store/gift-ideas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personalised Gift Ideas by Occasion — Keepsy",
    description:
      "Gift ideas for Mother's Day, Father's Day, birthdays, anniversaries, Christmas and pets. Printed with your own photo or idea and previewed before you order.",
  },
};

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

export default function GiftIdeasPage() {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={`${CONTAINER} pt-5 text-sm text-charcoal/50`}
      >
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-charcoal">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-charcoal">Gift ideas</li>
        </ol>
      </nav>

      <section className={`${CONTAINER} py-10 sm:py-14`}>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-terracotta)" }}
        >
          Gift ideas
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
          Pick the occasion. We&apos;ll suggest a starting point.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-charcoal/65">
          Each occasion opens the creator with a style and product already
          chosen. You can change anything.
        </p>
      </section>

      <OccasionTiles />

      <section
        className="border-t border-charcoal/8 py-14 sm:py-20"
        style={{ backgroundColor: "var(--color-cream-dark)" }}
      >
        <div className={CONTAINER}>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--color-terracotta)" }}
          >
            How it works
          </p>
          <ol className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Choose the occasion",
                body: "Birthday, anniversary, new baby, a pet — pick the one that fits.",
              },
              {
                title: "Add your photo or idea",
                body: "Upload a picture or describe what you have in mind in plain words.",
              },
              {
                title: "See it, then order",
                body: "Your design appears on the product. Happy with it? Order and we print and deliver it.",
              },
            ].map((item, i) => (
              <li
                key={item.title}
                className="rounded-3xl border border-charcoal/8 bg-white p-6"
              >
                <p
                  className="font-serif text-3xl font-bold leading-none"
                  style={{ color: "rgba(196,113,74,0.5)" }}
                >
                  {i + 1}
                </p>
                <h2 className="mt-3 font-serif text-xl font-bold tracking-tight text-charcoal">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-charcoal/65">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link
              href="/create"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Start creating
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
