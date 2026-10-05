"use client";

import Link from "next/link";
import { getCountry } from "@/lib/commerce/markets";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/commerce/pricing";
import { useDisplayDestination } from "@/components/DestinationSelector";
import { NewsletterSignup } from "@/components/landing/NewsletterSignup";

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const LINK = "rgba(240,237,232,0.85)";
const HEADER = "#D4A853";
const FAINT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.10)";

const COLUMNS: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/product/hoodie", label: "Hoodies" },
      { href: "/product/tee", label: "T-shirts" },
      { href: "/product/mug", label: "Mugs" },
      { href: "/product/card", label: "Greeting cards" },
      { href: "/product/canvas", label: "Canvas prints" },
      { href: "/gift-ideas", label: "Gift ideas" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Keepsy" },
      { href: "/community", label: "Share your gift" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/shipping", label: "Delivery" },
      { href: "/refunds", label: "Refunds & returns" },
      { href: "/track", label: "Track an order" },
      { href: "/account", label: "Your account" },
    ],
  },
];

const SOCIAL = [
  {
    href: "https://www.instagram.com/wearekeepsy",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    href: "https://www.facebook.com/wearekeepsy",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    href: "https://www.tiktok.com/@wearekeepsy",
    label: "TikTok",
    Icon: TikTokIcon,
  },
];

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

export function SiteFooter() {
  const destination = useDisplayDestination();
  const country = getCountry(destination);
  const currency = country?.currency ?? "gbp";
  const symbol = currency === "usd" ? "$" : "£";

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: "#2D2926", borderColor: BORDER }}
    >
      {/* Newsletter */}
      <div className="border-b py-12 sm:py-16" style={{ borderColor: BORDER }}>
        <div
          className={`${CONTAINER} grid gap-8 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-start lg:gap-16`}
        >
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: HEADER }}
            >
              Keepsy newsletter
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
              10% off your first order
            </h2>
            <p
              className="mt-2 max-w-md text-sm leading-6"
              style={{ color: LINK }}
            >
              Occasional gift ideas and new products. We only email people who
              ask us to, and you can stop any time.
            </p>
          </div>
          <NewsletterSignup source="footer" currency={currency} tone="dark" />
        </div>
      </div>

      {/* Links */}
      <div
        className={`${CONTAINER} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] sm:py-16`}
      >
        <div>
          <p className="font-serif text-2xl font-bold tracking-tight text-white">
            Keepsy
          </p>
          <p
            className="mt-2 max-w-xs text-sm leading-6"
            style={{ color: LINK }}
          >
            Personalised gifts, made to order. Upload a photo or describe an
            idea, see it on the product, then we print and deliver it.
          </p>
          <p className="mt-4 text-xs leading-5" style={{ color: FAINT }}>
            Delivering to the United Kingdom and United States. Free delivery
            over {symbol}
            {FREE_SHIPPING_THRESHOLD}.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {SOCIAL.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Keepsy on ${label}`}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ borderColor: BORDER, color: LINK }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: HEADER }}
            >
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-[32px] items-center text-sm transition hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    style={{ color: LINK }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Legal line */}
      <div className="border-t py-6" style={{ borderColor: BORDER }}>
        <div
          className={`${CONTAINER} flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between`}
          style={{ color: FAINT }}
        >
          <p>© {new Date().getFullYear()} Keepsy. All rights reserved.</p>
          <p>
            Payments by Stripe · Printed with Printify partners ·{" "}
            <a
              href="mailto:support@keepsy.store"
              className="underline underline-offset-2 hover:text-white"
            >
              support@keepsy.store
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
