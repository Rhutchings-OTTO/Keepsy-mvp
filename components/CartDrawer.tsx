"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Gift, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────── */

type CartItem = {
  id: string;
  productId: string;
  name: string;
  color?: string;
  size?: string;
  imageUrl: string;
  designUrl?: string;
  unitPrice: number;
  quantity: number;
};

/* ─── Constants ────────────────────────────────────────────────────────── */

const CART_KEY = "keepsy_cart_v2";
const FREE_SHIPPING_THRESHOLD = 75;

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
  // Also trigger storage event for cross-tab awareness
  window.dispatchEvent(new StorageEvent("storage", { key: CART_KEY }));
}

function productEmoji(productId: string): string {
  const id = productId.toLowerCase();
  if (id.includes("mug") || id.includes("cup")) return "☕";
  if (id.includes("card")) return "💌";
  if (id.includes("hoodie") || id.includes("sweat")) return "👕";
  if (id.includes("hat") || id.includes("cap")) return "🧢";
  return "🎁";
}

/* price might be in dollars or cents — normalise to dollars for display */
function priceDollars(unitPrice: number): number {

  // If value looks like cents (>= 100 for a reasonable product), treat as cents
  return unitPrice >= 100 ? unitPrice / 100 : unitPrice;
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const pct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="px-6 py-4 border-b border-charcoal/8">
      <p className="mb-2.5 text-xs text-charcoal/55">
        {remaining > 0 ? (
          <>
            Add{" "}
            <span className="font-semibold text-charcoal/80">
              ${remaining.toFixed(2)}
            </span>{" "}
            more for free shipping
          </>
        ) : (
          <span className="font-semibold" style={{ color: "var(--color-forest)" }}>
            Free shipping unlocked!
          </span>
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

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const price = priceDollars(item.unitPrice);
  const thumb = item.imageUrl || item.designUrl;

  return (
    <div
      className="flex gap-4 py-5 border-b border-charcoal/8 last:border-b-0"
      style={{ borderLeftWidth: 0 }}
    >
      {/* Thumbnail */}
      <div
        className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: "#F5EDE0" }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{productEmoji(item.productId)}</span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="font-serif text-sm font-bold text-charcoal leading-snug truncate">
          {item.name}
        </p>
        {(item.color || item.size) && (
          <p className="text-xs text-charcoal/45">
            {[item.color, item.size].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="text-xs text-charcoal/55">
          ${price.toFixed(2)} each
        </p>

        {/* Qty + remove */}
        <div className="mt-1.5 flex items-center justify-between">
          <div
            className="flex items-center gap-0.5 rounded-lg border border-charcoal/12"
            style={{ backgroundColor: "var(--color-cream)" }}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-charcoal transition hover:bg-black/5 text-sm font-bold"
            >
              −
            </button>
            <span className="w-5 text-center text-xs font-semibold text-charcoal">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-charcoal transition hover:bg-black/5 text-sm font-bold"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-charcoal">
              ${(price * item.quantity).toFixed(2)}
            </p>
            <button
              type="button"
              aria-label="Remove item"
              onClick={() => onRemove(item.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-black/5"
            >
              <Trash2 size={13} className="text-charcoal/35" />
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
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#F5EDE0" }}
      >
        <Gift size={32} style={{ color: "var(--color-terracotta)" }} />
      </div>
      <div>
        <p className="font-serif text-xl font-bold text-charcoal">
          Your bag is empty
        </p>
        <p className="mt-1 text-sm leading-6 text-charcoal/50">
          Start creating something beautiful for the people you love.
        </p>
      </div>
      <Link
        href="/shop"
        onClick={onClose}
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        Start Shopping
      </Link>
    </div>
  );
}

/* ─── Main CartDrawer ───────────────────────────────────────────────────── */

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [giftNote, setGiftNote] = useState("");
  const [noteExpanded, setNoteExpanded] = useState(false);

  /* Listen for open-cart-drawer event */
  useEffect(() => {
    function handleOpen() {
      setItems(readCart());
      setIsOpen(true);
    }
    window.addEventListener("open-cart-drawer", handleOpen);
    return () => window.removeEventListener("open-cart-drawer", handleOpen);
  }, []);

  /* Sync cart when storage changes */
  useEffect(() => {
    function handleUpdate() {
      setItems(readCart());
    }
    window.addEventListener("cart-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  function handleQuantityChange(id: string, qty: number) {
    const next =
      qty <= 0
        ? items.filter((i) => i.id !== id)
        : items.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    setItems(next);
    writeCart(next);
  }

  function handleRemove(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    writeCart(next);
  }

  /* Derived totals */
  const subtotal = items.reduce(
    (sum, item) => sum + priceDollars(item.unitPrice) * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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

          {/* Drawer panel */}
          <motion.aside
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[301] flex w-full flex-col bg-white shadow-[−24px_0_60px_-20px_rgba(45,41,38,0.18)] md:w-[420px]"
            aria-label="Shopping cart"
            role="dialog"
            aria-modal="true"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-charcoal/8 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} style={{ color: "var(--color-forest)" }} />
                <h2 className="font-serif text-xl font-bold text-charcoal">
                  Your Bag
                </h2>
                {itemCount > 0 && (
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: "var(--color-terracotta)" }}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
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
              <>
                {/* ── Free shipping bar ── */}
                <FreeShippingBar subtotal={subtotal} />

                {/* ── Items list ── */}
                <div className="flex-1 overflow-y-auto px-6">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>

                {/* ── Gift note ── */}
                <div className="border-t border-charcoal/8 px-6 py-3">
                  <button
                    type="button"
                    onClick={() => setNoteExpanded((v) => !v)}
                    className="flex w-full items-center justify-between py-1 text-xs font-semibold text-charcoal/60 transition hover:text-charcoal"
                  >
                    <span className="flex items-center gap-1.5">
                      <Gift size={13} />
                      Add Gift Note (optional)
                    </span>
                    {noteExpanded ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  <AnimatePresence>
                    {noteExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <textarea
                          value={giftNote}
                          onChange={(e) => setGiftNote(e.target.value)}
                          placeholder="Write a personal message for the recipient…"
                          rows={3}
                          className="mt-2 w-full resize-none rounded-xl border border-charcoal/10 p-3 text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                          style={{ backgroundColor: "var(--color-cream)" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Totals ── */}
                <div className="border-t border-charcoal/8 px-6 pb-2 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-charcoal/60">
                    <span>Subtotal</span>
                    <span className="font-semibold text-charcoal">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-charcoal/60">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {shippingFree ? (
                        <span className="font-semibold" style={{ color: "var(--color-forest)" }}>Free</span>
                      ) : (
                        "Calculated at checkout"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-charcoal/8 pt-3 text-base font-bold text-charcoal">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* ── Checkout CTA ── */}
                <div className="px-6 pb-6 pt-3">
                  <button
                    type="button"
                    className="flex w-full min-h-[52px] items-center justify-center rounded-xl text-base font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: "var(--color-terracotta)" }}
                    onClick={() => {
                      // TODO: wire up Stripe checkout
                      window.location.href = "/create";
                    }}
                  >
                    Checkout
                  </button>

                  {/* Trust badges */}
                  <p className="mt-3 text-center text-[11px] text-charcoal/40 leading-relaxed">
                    Secure Checkout · Handmade With Care · 30-Day Returns
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
