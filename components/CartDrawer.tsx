"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Gift, ShoppingBag } from "lucide-react";
import { getRegion, type Region } from "@/lib/region";
import { getEstimatedDelivery, type DeliveryRegion } from "@/lib/deliveryEstimate";
import { useCart } from "@/lib/cart/useCart";
import { computeTotals, linePrice, removeFromCart, updateQuantity, type CartLine } from "@/lib/cart/store";
import { currencyForRegion, formatMoney, FREE_SHIPPING_THRESHOLD } from "@/lib/commerce/pricing";
import { startCheckout } from "@/lib/cart/checkoutClient";
import { PrintQualityBadge } from "@/components/create/PrintQualityBadge";

/* ─── Sub-components ────────────────────────────────────────────────────── */

function FreeShippingBar({ subtotal, currency }: { subtotal: number; currency: "gbp" | "usd" }) {
  const pct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="border-b border-charcoal/8 px-6 py-4">
      <p className="mb-2.5 text-xs text-charcoal/55">
        {remaining > 0 ? (
          <>
            Add <span className="font-semibold text-charcoal/80">{formatMoney(remaining, currency)}</span> more for free shipping
          </>
        ) : (
          <span className="font-semibold" style={{ color: "var(--color-forest)" }}>Free shipping unlocked!</span>
        )}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-sm bg-charcoal/8">
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: "var(--color-terracotta)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CartItemRow({ item, currency }: { item: CartLine; currency: "gbp" | "usd" }) {
  const price = linePrice(item, currency);
  const thumb = item.imageUrl || item.designUrl;

  return (
    <div className="flex gap-4 border-b border-charcoal/8 py-5 last:border-b-0" data-cart-line={item.id}>
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: "#F5EDE0" }}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={item.name} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-serif text-sm font-bold leading-snug text-charcoal">{item.name}</p>
        {(item.color || item.size || item.addonId || item.sourceKind === "original") && (
          <p className="text-xs text-charcoal/45">
            {[item.size, item.color, item.sourceKind === "original" ? "Your photo" : null, item.addonId ? "Add-on" : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p className="text-xs text-charcoal/55">{formatMoney(price, currency)} each</p>
        {item.sourceKind === "original" && item.sourceWidth && item.sourceHeight ? (
          <PrintQualityBadge productId={item.productId} size={item.size} width={item.sourceWidth} height={item.sourceHeight} compact />
        ) : null}

        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5 rounded-lg border border-charcoal/20" style={{ backgroundColor: "var(--color-cream)" }}>
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-charcoal transition hover:bg-black/5"
            >
              −
            </button>
            <span className="w-5 text-center text-xs font-semibold text-charcoal">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-charcoal transition hover:bg-black/5"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-charcoal">{formatMoney(price * item.quantity, currency)}</p>
            <button
              type="button"
              aria-label="Remove item"
              onClick={() => removeFromCart(item.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-black/5"
            >
              <Trash2 size={13} className="text-charcoal/55" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ backgroundColor: "#F5EDE0" }}>
        <Gift size={32} style={{ color: "var(--color-terracotta)" }} />
      </div>
      <div>
        <p className="font-serif text-xl font-bold text-charcoal">Your bag is empty</p>
        <p className="mt-1 text-sm leading-6 text-charcoal/50">Start creating something beautiful for the people you love.</p>
      </div>
      <Link
        href="/create"
        onClick={onClose}
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        Make a gift
      </Link>
    </div>
  );
}

/* ─── Main CartDrawer ───────────────────────────────────────────────────── */

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [region, setRegionState] = useState<Region>("UK");

  useEffect(() => {
    const sync = () => setRegionState(getRegion() ?? "UK");
    sync();
    window.addEventListener("keepsy-region-set", sync);
    return () => window.removeEventListener("keepsy-region-set", sync);
  }, []);

  const currency = currencyForRegion(region);
  const deliveryRegion: DeliveryRegion = region === "US" ? "us" : "uk";
  const delivery = getEstimatedDelivery(deliveryRegion);
  const totals = computeTotals(items, currency);

  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
    }
    window.addEventListener("open-cart-drawer", handleOpen);
    return () => window.removeEventListener("open-cart-drawer", handleOpen);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  async function handleCheckout() {
    if (isCheckingOut || items.length === 0) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const { url } = await startCheckout(items, region);
      window.location.href = url;
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Checkout failed. Please try again.");
      setIsCheckingOut(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[300] bg-black/40"
            onClick={close}
            aria-hidden
          />

          <motion.aside
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[301] flex w-full flex-col bg-white shadow-[-24px_0_60px_-20px_rgba(45,41,38,0.18)] md:w-[420px]"
            style={{ willChange: "transform", isolation: "isolate" }}
            aria-label="Shopping cart"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-charcoal/8 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} style={{ color: "var(--color-forest)" }} />
                <h2 className="font-serif text-xl font-bold text-charcoal">Your Bag</h2>
                {totals.itemCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white" style={{ backgroundColor: "var(--color-terracotta)" }}>
                    {totals.itemCount > 99 ? "99+" : totals.itemCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal/10 transition hover:bg-charcoal/5"
              >
                <X size={16} className="text-charcoal" />
              </button>
            </div>

            {items.length === 0 ? (
              <EmptyState onClose={close} />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <FreeShippingBar subtotal={totals.subtotal} currency={currency} />

                <div className="min-h-0 flex-1 overflow-y-auto px-6">
                  {items.map((item) => (
                    <CartItemRow key={item.id} item={item} currency={currency} />
                  ))}

                  <div className="space-y-1.5 border-t border-charcoal/8 pb-4 pt-3">
                    <div className="flex items-center justify-between text-sm text-charcoal/65">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatMoney(totals.subtotal, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-charcoal/65">
                      <span>Shipping</span>
                      <span className="font-medium">
                        {totals.shipping === 0 ? (
                          <span className="font-semibold" style={{ color: "var(--color-forest)" }}>Free</span>
                        ) : (
                          formatMoney(totals.shipping, currency)
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-charcoal/40">
                      Estimated delivery: {delivery.from} – {delivery.to}
                    </p>
                    <p className="text-[11px] leading-relaxed text-charcoal/50">
                      Secure Checkout · Handmade With Care ·{" "}
                      <Link href="/refunds" className="underline underline-offset-2">30-Day Returns</Link>
                    </p>
                  </div>
                </div>

                <div
                  className="flex-shrink-0 border-t-2 border-charcoal/12 bg-white px-6 pt-4"
                  style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-base font-bold text-charcoal">Total</span>
                    <span className="text-base font-bold text-charcoal">{formatMoney(totals.total, currency)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCheckout()}
                    disabled={isCheckingOut}
                    className="flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: "var(--color-terracotta)" }}
                  >
                    {isCheckingOut ? "Taking you to checkout…" : "Checkout"}
                  </button>
                  {checkoutError && (
                    <p role="alert" className="mt-3 rounded-lg px-3 py-2 text-center text-xs font-semibold" style={{ backgroundColor: "rgba(196,113,74,0.10)", color: "var(--color-terra-dark)" }}>
                      {checkoutError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
