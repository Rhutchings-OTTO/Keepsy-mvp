"use client";

import { useState } from "react";
import Link from "next/link";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

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

function PinterestIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
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

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span
        className="text-xs font-semibold"
        style={{ color: "var(--color-forest)" }}
      >
        {label}
      </span>
    </div>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span
      className="rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide"
      style={{
        borderColor: "var(--border)",
        color: "var(--ink-muted)",
        backgroundColor: "rgba(255,255,255,0.6)",
      }}
    >
      {label}
    </span>
  );
}

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  }

  return (
    <footer
      className="relative border-t overflow-hidden"
      style={{
        backgroundColor: "#F5EDE0",
        borderColor: "var(--border)",
      }}
    >
      {/* Grain texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <div className="relative z-10">
        {/* ── Email signup banner ── */}
        <div
          className="border-b py-10"
          style={{ borderColor: "var(--border)" }}
        >
          <div className={CONTAINER}>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p
                  className="font-serif text-xl font-semibold sm:text-2xl"
                  style={{ color: "var(--color-charcoal)" }}
                >
                  Join women who love thoughtful gifting
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--ink-muted)" }}
                >
                  Get 10% off your first order + early access to new designs.
                </p>
              </div>
              {submitted ? (
                <p
                  className="shrink-0 text-sm font-semibold"
                  style={{ color: "var(--color-terracotta)" }}
                >
                  🎉 You&apos;re in! Check your inbox.
                </p>
              ) : (
                <form
                  onSubmit={handleSignup}
                  className="flex w-full max-w-sm gap-2"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "rgba(255,255,255,0.7)",
                      color: "var(--color-charcoal)",
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": "var(--color-terracotta)",
                    }}
                    aria-label="Email address"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: "var(--color-terracotta)" }}
                  >
                    Get 10% Off
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div
          className="border-b py-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className={CONTAINER}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:justify-start">
              <TrustBadge icon="✦" label="Premium Quality" />
              <TrustBadge icon="↩" label="30-Day Returns" />
              <TrustBadge icon="🎁" label="Gift Wrapped Free" />
              <TrustBadge icon="✈" label="US & UK Shipping" />
            </div>
          </div>
        </div>

        {/* ── 4-column grid ── */}
        <div className={`${CONTAINER} py-14`}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <p
                className="font-serif text-2xl font-bold tracking-tight"
                style={{ color: "var(--color-charcoal)" }}
              >
                Keepsy
              </p>
              <p
                className="font-serif text-base italic"
                style={{ color: "var(--color-terracotta)" }}
              >
                Gifts they&apos;ll never forget.
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--ink-muted)" }}
              >
                Turn a photo, memory, pet, home, or occasion into a polished
                personalised keepsake — mugs, tees, hoodies, and greeting
                cards, all beautifully made.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3 pt-1">
                {[
                  {
                    href: "https://instagram.com/keepsy.store",
                    Icon: InstagramIcon,
                    label: "Instagram",
                  },
                  {
                    href: "https://pinterest.com/keepsystore",
                    Icon: PinterestIcon,
                    label: "Pinterest",
                  },
                  {
                    href: "https://facebook.com/keepsystore",
                    Icon: FacebookIcon,
                    label: "Facebook",
                  },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:border-transparent hover:text-white"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--ink-muted)",
                      // hover handled via tailwind group or inline — using CSS vars via style isn't straightforward for hover, keep simple
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "var(--color-terracotta)";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "#fff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "var(--ink-muted)";
                    }}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Shop */}
            <div className="space-y-4">
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-faint)" }}
              >
                Shop
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { href: "/shop", label: "All Products" },
                  { href: "/gift-ideas", label: "Gift Ideas" },
                  { href: "/create", label: "Create a Gift" },
                  { href: "/product/mug", label: "Personalised Mugs" },
                  { href: "/product/tee", label: "Custom Tees" },
                  { href: "/product/hoodie", label: "Hoodies" },
                  { href: "/product/card", label: "Greeting Cards" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm transition hover:underline"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 3: Company */}
            <div className="space-y-4">
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-faint)" }}
              >
                Company
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { href: "/about", label: "About Us" },
                  { href: "/terms", label: "Terms of Service" },
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/refunds", label: "Refund Policy" },
                  { href: "/shipping", label: "Shipping Info" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm transition hover:underline"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 4: Help */}
            <div className="space-y-4">
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-faint)" }}
              >
                Help
              </p>
              <div className="flex flex-col gap-2.5">
                <a
                  href="mailto:support@keepsy.store"
                  className="text-sm transition hover:underline"
                  style={{ color: "var(--color-terracotta)" }}
                >
                  support@keepsy.store
                </a>
                <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                  🇺🇸 Made with love in the USA
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--ink-faint)" }}
                >
                  Support available 7 days a week
                </p>
              </div>
              {/* Payment icons */}
              <div>
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--ink-faint)" }}
                >
                  We accept
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <PaymentBadge label="VISA" />
                  <PaymentBadge label="MC" />
                  <PaymentBadge label="AMEX" />
                  <PaymentBadge label="PayPal" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="border-t py-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className={`${CONTAINER} flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left`}
          >
            <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
              © {new Date().getFullYear()} Keepsy. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
              Powered by AI · Fulfilled by Printful · Payments by Stripe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
