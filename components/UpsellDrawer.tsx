"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart/useCart";
import { addLine, computeTotals, removeFromCart } from "@/lib/cart/store";
import { buildAddonLine, findAddonLines, getAddonOffers, type AddonOffer } from "@/lib/commerce/addons";
import { currencyForRegion, formatMoney } from "@/lib/commerce/pricing";
import type { Region } from "@/lib/region";

type UpsellDrawerProps = {
  open: boolean;
  region: Region;
  onNoThanks: () => void;
  onContinue: () => void;
};

/**
 * Optional extras before checkout. Each option is bound to a REAL basket line
 * (server-priced SKU + fulfilment mapping): ticking adds it, unticking removes
 * it, and because the basket is the state it survives close/reopen/reload.
 */
export default function UpsellDrawer({ open, region, onNoThanks, onContinue }: UpsellDrawerProps) {
  const lines = useCart();
  const currency = currencyForRegion(region);
  const offers = useMemo(() => getAddonOffers(lines, region), [lines, region]);
  const totals = computeTotals(lines, currency);
  const [sizeChoice, setSizeChoice] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const isSelected = (offer: AddonOffer) => findAddonLines(lines, offer.id).length > 0;
  const chosenSize = (offer: AddonOffer) => sizeChoice[offer.id] ?? findAddonLines(lines, offer.id)[0]?.size ?? offer.defaultSize;

  const toggle = (offer: AddonOffer) => {
    setError(null);
    const existing = findAddonLines(lines, offer.id);
    if (existing.length > 0) {
      existing.forEach((l) => removeFromCart(l.id));
      return;
    }
    const size = chosenSize(offer);
    if (offer.needsSize && !size) {
      setError(`Choose a size for the second ${offer.productId} first.`);
      return;
    }
    const line = buildAddonLine(offer, lines, size);
    if (!line) {
      setError("We couldn't add that extra. Please try again.");
      return;
    }
    addLine(line);
  };

  const changeSize = (offer: AddonOffer, size: string) => {
    setSizeChoice((prev) => ({ ...prev, [offer.id]: size }));
    const existing = findAddonLines(lines, offer.id);
    if (existing.length > 0) {
      // Already in the basket: swap the size in place, keeping quantity.
      const qty = existing.reduce((s, l) => s + l.quantity, 0);
      existing.forEach((l) => removeFromCart(l.id));
      const line = buildAddonLine(offer, lines.filter((l) => l.addonId !== offer.id), size);
      if (line) addLine({ ...line, quantity: qty });
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close add-ons"
            className="fixed inset-0 z-[70] bg-black/35"
            onClick={onNoThanks}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Optional add-ons"
            className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-w-lg rounded-t-2xl border border-charcoal/10 bg-white p-5 shadow-[0_-16px_40px_-20px_rgba(45,41,38,0.15)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
          >
            <p className="font-serif text-lg font-bold text-charcoal">Add a little extra?</p>
            <p className="mt-1 text-xs text-charcoal/60">Optional. Anything you tick goes straight into your basket at the price shown.</p>

            {error ? (
              <p role="alert" className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(196,113,74,0.10)", color: "var(--color-terra-dark)" }}>
                {error}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              {offers.length === 0 ? (
                <p className="rounded-xl bg-[#F5EDE0] px-3 py-3 text-xs text-charcoal/60">No extras available for this basket.</p>
              ) : null}
              {offers.map((offer) => {
                const selected = isSelected(offer);
                return (
                  <div
                    key={offer.id}
                    className={`rounded-[1.15rem] border px-3 py-2.5 shadow-[0_10px_24px_-22px_rgba(45,41,38,0.18)] transition ${
                      selected ? "border-terracotta bg-[#FDF6EE]" : "border-charcoal/10 bg-white/70"
                    }`}
                    data-addon={offer.id}
                    data-selected={selected ? "true" : "false"}
                  >
                    <label className="flex cursor-pointer items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-charcoal">{offer.label}</p>
                        <p className="text-xs text-charcoal/55">{offer.description}</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-terracotta)" }}>
                          + {formatMoney(offer.unitPrice, currency)}
                        </p>
                      </div>
                      <span className="relative mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer h-5 w-5 appearance-none rounded border border-charcoal/25 bg-white checked:border-terracotta checked:bg-terracotta"
                          checked={selected}
                          onChange={() => toggle(offer)}
                          aria-label={offer.label}
                        />
                        <Check size={12} className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100" />
                      </span>
                    </label>
                    {offer.needsSize && offer.sizeOptions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-charcoal/55">Size:</span>
                        {offer.sizeOptions.map((size) => {
                          const active = chosenSize(offer) === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => changeSize(offer, size)}
                              aria-pressed={active}
                              className={`min-h-[32px] rounded-lg px-2.5 text-xs font-bold transition ${
                                active ? "bg-terracotta text-white" : "bg-[#F5EDE0] text-charcoal/80 hover:bg-charcoal/5"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5EDE0] px-3 py-2 text-xs font-semibold text-charcoal/70">
              <span>Basket · {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}</span>
              <span className="text-sm font-black text-charcoal">{formatMoney(totals.subtotal, currency)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNoThanks}
                className="rounded-full border border-charcoal/15 px-4 py-2.5 text-sm font-semibold text-charcoal/80 transition hover:bg-charcoal/5"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--color-terracotta)" }}
              >
                Continue to checkout
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
