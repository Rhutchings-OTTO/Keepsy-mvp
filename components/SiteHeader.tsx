"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { DynamicLogo } from "@/components/DynamicLogo";
import { DestinationButton } from "@/components/DestinationSelector";

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const NAV_ITEMS = [
  { href: "/shop", label: "Shop" },
  { href: "/gift-ideas", label: "Gift ideas" },
  { href: "/create", label: "Create" },
  { href: "/account", label: "Account" },
];

const MENU_EXTRAS = [
  { href: "/about", label: "About Keepsy" },
  { href: "/shipping", label: "Delivery" },
  { href: "/faq", label: "Help & FAQ" },
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
            0,
          );
          setCount(total);
        }
      } catch {
        setCount(0);
      }
    }
    readCart();
    window.addEventListener("storage", readCart);
    window.addEventListener("cart-updated", readCart);
    return () => {
      window.removeEventListener("storage", readCart);
      window.removeEventListener("cart-updated", readCart);
    };
  }, []);

  return count;
}

function MobileMenu({
  open,
  onClose,
  pathname,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => closeButtonRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
    triggerRef.current?.focus();
  }, [open, triggerRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      id="mobile-nav"
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: "var(--color-cream)" }}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/" onClick={onClose} aria-label="Keepsy homepage">
          <DynamicLogo
            href={null}
            width={100}
            className="h-8 w-auto text-[#2D2926]"
          />
        </Link>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/10 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
        >
          <X size={20} style={{ color: "var(--color-charcoal)" }} />
        </button>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex flex-1 flex-col justify-center gap-1 px-8"
      >
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[56px] items-center font-serif text-3xl font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              style={{
                color: active
                  ? "var(--color-terracotta)"
                  : "var(--color-charcoal)",
              }}
            >
              {label}
            </Link>
          );
        })}
        <div className="mt-6 flex flex-col gap-1 border-t border-charcoal/10 pt-6">
          {MENU_EXTRAS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex min-h-[44px] items-center text-base font-medium text-charcoal/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="space-y-3 px-8 pb-12">
        <div className="flex justify-center">
          <DestinationButton className="border border-charcoal/15" />
        </div>
        <Link
          href="/create"
          onClick={onClose}
          className="flex min-h-[52px] items-center justify-center rounded-xl text-base font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
          style={{ backgroundColor: "var(--color-terracotta)" }}
        >
          Start creating
        </Link>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const cartCount = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(253, 246, 238, 0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}
        >
          {/* Left: menu (mobile) + logo */}
          <div className="flex items-center gap-2">
            <button
              ref={hamburgerRef}
              type="button"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} style={{ color: "var(--color-charcoal)" }} />
            </button>
            <DynamicLogo
              href="/"
              width={110}
              className="h-8 w-auto text-[#2D2926]"
            />
          </div>

          {/* Centre: primary nav (desktop) */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_ITEMS.map(({ href, label }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 ${
                    active
                      ? "text-charcoal"
                      : "text-charcoal/65 hover:bg-black/5 hover:text-charcoal"
                  }`}
                  style={
                    active
                      ? { boxShadow: "inset 0 -2px 0 var(--color-terracotta)" }
                      : undefined
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: destination + cart + CTA */}
          <div className="flex items-center gap-1 sm:gap-2">
            <DestinationButton className="hidden sm:inline-flex" />
            <button
              type="button"
              aria-label={
                cartCount > 0
                  ? `Basket, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                  : "Basket"
              }
              onClick={() =>
                window.dispatchEvent(new Event("open-cart-drawer"))
              }
              className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
            >
              <ShoppingBag
                size={20}
                style={{ color: "var(--color-charcoal)" }}
              />
              {cartCount > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
            <Link
              href="/create"
              className="hidden min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 md:inline-flex"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Start creating
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        triggerRef={hamburgerRef}
      />
    </>
  );
}
