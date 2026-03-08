"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X } from "lucide-react";
import { DynamicLogo } from "@/components/DynamicLogo";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

const NAV_ITEMS = [
  { href: "/shop", label: "Shop" },
  { href: "/gift-ideas", label: "Gift Ideas" },
  { href: "/create", label: "Create" },
  { href: "/community", label: "Reviews" },
];

function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function readCart() {
      try {
        const raw = localStorage.getItem("keepsy_cart_v2");
        if (!raw) return setCount(0);
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          const total = items.reduce(
            (sum: number, item: { quantity?: number }) =>
              sum + (item.quantity ?? 1),
            0
          );
          setCount(total);
        }
      } catch {
        setCount(0);
      }
    }
    readCart();
    window.addEventListener("storage", readCart);
    return () => window.removeEventListener("storage", readCart);
  }, []);

  return count;
}

function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  useEffect(() => {
    const val = localStorage.getItem("keepsy_announce_dismissed");
    setDismissed(val === "true");
  }, []);

  function dismiss() {
    localStorage.setItem("keepsy_announce_dismissed", "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div
      className="relative flex items-center justify-center gap-2 px-10 py-2 text-xs font-medium text-white"
      style={{ backgroundColor: "var(--color-terracotta)" }}
    >
      <span>⚡ Fast shipping on every order · Free shipping over £75 (UK) / $75 (US)</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 hover:bg-white/20 transition"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function MobileOverlay({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ backgroundColor: "var(--color-cream)" }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-5">
            <Link href="/" onClick={onClose} aria-label="Keepsy homepage">
              <DynamicLogo
                href={null}
                width={100}
                className="h-8 w-auto text-[#2D2926]"
              />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-full border p-2 transition hover:bg-black/5"
              style={{ borderColor: "var(--border)" }}
            >
              <X size={20} style={{ color: "var(--color-charcoal)" }} />
            </button>
          </div>

          {/* Nav links */}
          <nav
            aria-label="Mobile navigation"
            className="flex flex-1 flex-col justify-center px-8 gap-2"
          >
            {NAV_ITEMS.map(({ href, label }, i) => {
              const active = href.startsWith("/") && pathname === href;
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.07, duration: 0.28 }}
                >
                  <Link
                    href={href}
                    onClick={onClose}
                    className="flex min-h-[64px] items-center font-serif text-4xl font-bold tracking-tight transition"
                    style={{
                      color: active
                        ? "var(--color-terracotta)"
                        : "var(--color-charcoal)",
                    }}
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="px-8 pb-16">
            <Link
              href="/create"
              onClick={onClose}
              className="flex min-h-[52px] items-center justify-center rounded-full text-base font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Start Creating
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const cartCount = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AnnouncementBar />
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(253, 246, 238, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "var(--border)",
        }}
      >
        <div className={`${CONTAINER} flex items-center justify-between py-3`}>
          {/* ── Mobile: hamburger left ── */}
          <button
            type="button"
            className="flex items-center justify-center rounded-full p-2 transition hover:bg-black/5 md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} style={{ color: "var(--color-charcoal)" }} />
          </button>

          {/* ── Logo ── */}
          {/* Mobile: centered absolutely; Desktop: left-aligned */}
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <DynamicLogo
              href="/"
              width={110}
              className="h-8 w-auto text-[#2D2926]"
            />
          </div>

          {/* ── Desktop center pill nav ── */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 rounded-full border border-charcoal/10 bg-white px-2 py-1.5 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] md:flex"
          >
            {NAV_ITEMS.map(({ href, label }) => {
              const active = href.startsWith("/") && pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="min-h-9 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  style={
                    active
                      ? {
                          backgroundColor: "var(--color-terracotta)",
                          color: "#fff",
                        }
                      : {
                          color: "rgba(45,41,38,0.70)",
                        }
                  }
                  data-active-nav={active ? "true" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right side: cart + CTA ── */}
          <div className="flex items-center gap-2">
            {/* Cart icon — opens CartDrawer via custom event */}
            <button
              type="button"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              onClick={() => window.dispatchEvent(new Event("open-cart-drawer"))}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5"
            >
              <ShoppingCart
                size={20}
                style={{ color: "var(--color-charcoal)" }}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Desktop CTA */}
            <Link
              href="/create"
              className="hidden min-h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_rgba(196,113,74,0.5)] transition hover:opacity-90 md:inline-flex"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Start Creating
            </Link>
          </div>
        </div>
      </header>

      <MobileOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
      />
    </>
  );
}
