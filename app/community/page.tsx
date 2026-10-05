import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Share Your Keepsy Gift — Keepsy",
  description:
    "Made something with Keepsy? Tell us how it went. We share customer gifts (with permission) and use your feedback to make the products better.",
  alternates: {
    canonical: "https://keepsy.store/community",
  },
  openGraph: {
    title: "Share Your Keepsy Gift — Keepsy",
    description: "Made something with Keepsy? Tell us how it went.",
    type: "website",
    url: "https://keepsy.store/community",
  },
};

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const EXAMPLES = [
  {
    src: "/images/refresh/pet-mug.webp",
    alt: "Mug printed with a cat portrait",
  },
  {
    src: "/images/refresh/friends-tee.webp",
    alt: "T-shirt printed with a photo of friends",
  },
  {
    src: "/images/refresh/newbaby-card.webp",
    alt: "Card printed with a photo of a newborn",
  },
  {
    src: "/images/refresh/family-canvas.webp",
    alt: "Canvas print of a family photo",
  },
];

export default function CommunityPage() {
  return (
    <>
      <section className={`${CONTAINER} py-14 sm:py-20`}>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--color-terracotta)" }}
            >
              Share your gift
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
              Made something with Keepsy?
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-charcoal/70">
              We&apos;re a small business and we&apos;d love to see how your
              gift landed. Tag us on Instagram or TikTok, or email a photo —
              with your permission we may feature it here and on our social
              pages.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://www.instagram.com/wearekeepsy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--color-terracotta)" }}
              >
                @wearekeepsy on Instagram
              </a>
              <a
                href="mailto:hello@keepsy.store?subject=My%20Keepsy%20gift"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-charcoal/15 bg-white px-6 text-sm font-semibold text-charcoal transition hover:border-charcoal/35"
              >
                Email us a photo
              </a>
            </div>
            <p className="mt-6 text-sm text-charcoal/55">
              Something not right with your order? Go to{" "}
              <Link href="/refunds" className="underline underline-offset-2">
                refunds &amp; returns
              </Link>{" "}
              — we&apos;ll sort it.
            </p>
          </div>

          <ul
            className="grid grid-cols-2 gap-3 sm:gap-4"
            aria-label="Example Keepsy gifts"
          >
            {EXAMPLES.map((img) => (
              <li
                key={img.src}
                className="relative overflow-hidden rounded-2xl bg-[#F5EDE0]"
                style={{ aspectRatio: "1 / 1" }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 280px"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-t border-charcoal/8 py-14 sm:py-20"
        style={{ backgroundColor: "var(--color-cream-dark)" }}
      >
        <div className={`${CONTAINER} grid gap-8 md:grid-cols-3`}>
          {[
            {
              title: "Post it",
              body: "Share a photo of your gift and tag @wearekeepsy. We repost our favourites.",
            },
            {
              title: "Tell us what to improve",
              body: "Honest feedback helps. Email support@keepsy.store with anything that could be better.",
            },
            {
              title: "Make another",
              body: "Every design is made to order, so the next one can be completely different.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-charcoal/8 bg-white p-6"
            >
              <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <div className={`${CONTAINER} mt-8`}>
          <Link
            href="/create"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Start creating
          </Link>
        </div>
      </section>
    </>
  );
}
