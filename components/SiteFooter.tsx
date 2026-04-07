/*
 * GOOGLE BUSINESS PROFILE SETUP (do this manually):
 * 1. Go to https://business.google.com and sign in with the Keepsy Google account
 * 2. Search for "Keepsy" — if it appears, claim it; if not, create a new listing
 * 3. Category: "Gift Shop" (primary) + "Online Gift Store" (secondary)
 * 4. Business name: Keepsy
 * 5. Website: https://keepsy.store
 * 6. Description: "Keepsy is an online personalised gift store where you can design custom hoodies, mugs, t-shirts, greeting cards and canvas prints — and see your design on the product before ordering. Ships to UK and US."
 * 7. Add product photos: upload 10+ high-quality product mockup images
 * 8. Enable Google Messaging for customer enquiries
 * 9. Add all products with photos and prices
 * 10. Request reviews from customers after orders arrive
 */

"use client";

import { useState } from "react";
import Link from "next/link";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

// Dark footer colour tokens
const LINK_COLOR = "#F0EDE8";
const HEADER_COLOR = "#D4A853";
const FAINT_COLOR = "rgba(255,255,255,0.70)";
const BORDER_COLOR = "rgba(255,255,255,0.1)";

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

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-semibold" style={{ color: LINK_COLOR }}>
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
        borderColor: BORDER_COLOR,
        color: LINK_COLOR,
        backgroundColor: "rgba(255,255,255,0.06)",
      }}
    >
      {label}
    </span>
  );
}

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [footerError, setFooterError] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setFooterError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { success?: boolean; alreadySubscribed?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setFooterError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setFooterError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer
      className="relative border-t overflow-hidden"
      style={{
        backgroundColor: "#2D2926",
        borderColor: BORDER_COLOR,
      }}
    >
      {/* Grain texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
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
          style={{ borderColor: BORDER_COLOR }}
        >
          <div className={CONTAINER}>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p
                  className="font-serif text-xl font-semibold sm:text-2xl"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  Join the people who love thoughtful gifting
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: LINK_COLOR }}
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
                <div className="flex flex-col gap-1.5 w-full max-w-sm">
                  <form
                    onSubmit={(e) => { void handleSignup(e); }}
                    className="flex w-full gap-2"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 placeholder:text-white/50"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderColor: BORDER_COLOR,
                        color: "rgba(255,255,255,0.9)",
                        // @ts-expect-error CSS custom property
                        "--tw-ring-color": "var(--color-terracotta)",
                      }}
                      aria-label="Email address"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="shrink-0 rounded-lg px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
                      style={{ backgroundColor: "var(--color-terracotta)" }}
                    >
                      {loading ? "…" : "Get 10% Off"}
                    </button>
                  </form>
                  {footerError && (
                    <p className="text-xs" style={{ color: "var(--color-terracotta)" }}>{footerError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div
          className="border-b py-4"
          style={{ borderColor: BORDER_COLOR }}
        >
          <div className={CONTAINER}>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <TrustBadge icon="⭐" label="Premium Quality" />
              <TrustBadge icon="↩️" label="30-Day Returns" />
              <TrustBadge icon="⚡" label="Fast Delivery" />
              <TrustBadge icon="✈️" label="US & UK Shipping" />
            </div>
          </div>
        </div>

        {/* ── Grid: Brand + accordions ── */}
        <div className={`${CONTAINER} py-10 sm:py-14`}>
          {/* Brand — always visible */}
          <div className="space-y-3 pb-6 sm:pb-0">
            <p
              className="font-serif text-2xl font-bold tracking-tight"
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              Keepsy
            </p>
            <p
              className="serif-italic text-base"
              style={{ color: "var(--color-terracotta)" }}
            >
              Gifts they&apos;ll never forget.
            </p>
            <p
              className="hidden text-sm leading-relaxed sm:block"
              style={{ color: LINK_COLOR }}
            >
              Turn a photo, memory, pet, home, or occasion into a polished
              personalised keepsake — mugs, tees, hoodies, and greeting
              cards, all beautifully made.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {[
                { href: "https://www.instagram.com/wearekeepsy", Icon: InstagramIcon, label: "Instagram" },
                { href: "https://www.facebook.com/wearekeepsy", Icon: FacebookIcon, label: "Facebook" },
                { href: "https://www.tiktok.com/@wearekeepsy", Icon: TikTokIcon, label: "TikTok" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 hover:text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded-full"
                  style={{
                    borderColor: BORDER_COLOR,
                    color: LINK_COLOR,
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — accordion on mobile, 3-col grid on sm+ */}
          <div className="divide-y sm:mt-10 sm:divide-y-0 sm:grid sm:grid-cols-3 sm:gap-10 lg:grid-cols-3" style={{ borderColor: BORDER_COLOR }}>
            {/* Shop */}
            <div className="py-3 sm:py-0">
              <button
                type="button"
                onClick={() => setShopOpen(!shopOpen)}
                className="flex w-full items-center justify-between sm:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: HEADER_COLOR }}>
                  Shop
                </p>
                <span className="text-sm sm:hidden" style={{ color: FAINT_COLOR }}>{shopOpen ? "−" : "+"}</span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out sm:!max-h-none sm:!opacity-100 ${shopOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="mt-3 flex flex-col gap-2.5">
                  {[
                    { href: "/shop", label: "All Products" },
                    { href: "/gift-ideas", label: "Gift Ideas" },
                    { href: "/community", label: "Community" },
                    { href: "/create", label: "Create a Gift" },
                    { href: "/product/mug", label: "Personalised Mugs" },
                    { href: "/product/tee", label: "Custom Tees" },
                    { href: "/product/hoodie", label: "Hoodies" },
                    { href: "/product/card", label: "Greeting Cards" },
                    { href: "/product/canvas", label: "Canvas Prints" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-sm transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
                      style={{ color: LINK_COLOR }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="py-3 sm:py-0">
              <button
                type="button"
                onClick={() => setCompanyOpen(!companyOpen)}
                className="flex w-full items-center justify-between sm:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: HEADER_COLOR }}>
                  Company
                </p>
                <span className="text-sm sm:hidden" style={{ color: FAINT_COLOR }}>{companyOpen ? "−" : "+"}</span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out sm:!max-h-none sm:!opacity-100 ${companyOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="mt-3 flex flex-col gap-2.5">
                  {[
                    { href: "/about", label: "About Us" },
                    { href: "/terms", label: "Terms & Conditions" },
                    { href: "/privacy", label: "Privacy Policy" },
                    { href: "/cookies", label: "Cookie Policy" },
                    { href: "/refunds", label: "Refund Policy" },
                    { href: "/shipping", label: "Shipping Info" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-sm transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
                      style={{ color: LINK_COLOR }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="py-3 sm:py-0">
              <button
                type="button"
                onClick={() => setHelpOpen(!helpOpen)}
                className="flex w-full items-center justify-between sm:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: HEADER_COLOR }}>
                  Help
                </p>
                <span className="text-sm sm:hidden" style={{ color: FAINT_COLOR }}>{helpOpen ? "−" : "+"}</span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out sm:!max-h-none sm:!opacity-100 ${helpOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="mt-3 flex flex-col gap-2.5">
                <a
                  href="mailto:support@keepsy.store"
                  className="text-sm transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
                  style={{ color: "var(--color-terracotta)" }}
                >
                  support@keepsy.store
                </a>
                <Link
                  href="/faq"
                  className="text-sm transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:rounded"
                  style={{ color: LINK_COLOR }}
                >
                  FAQ
                </Link>
                <p className="text-sm" style={{ color: LINK_COLOR }}>Made with love, shipped worldwide</p>
                <p className="text-xs" style={{ color: FAINT_COLOR }}>Support available 7 days a week</p>
                {/* Payment icons */}
                <div className="mt-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: FAINT_COLOR }}>
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
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="border-t py-6"
          style={{ borderColor: BORDER_COLOR }}
        >
          <div
            className={`${CONTAINER} flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left`}
          >
            <p className="text-xs" style={{ color: FAINT_COLOR }}>
              © {new Date().getFullYear()} Keepsy. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: FAINT_COLOR }}>
              Powered by AI · Printing by Printify · Payments by Stripe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
