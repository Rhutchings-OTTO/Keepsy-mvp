"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QUANTITY } from "@/lib/cart/store";

export type SizeQuantities = Record<string, number>;

type Props = {
  sizes: string[];
  quantities: SizeQuantities;
  onChange: (next: SizeQuantities) => void;
  unitPrice: number;
  formatPrice: (n: number) => string;
  disabled?: boolean;
};

export function totalQuantity(q: SizeQuantities): number {
  return Object.values(q).reduce((s, n) => s + (n > 0 ? n : 0), 0);
}

/**
 * "Buy several sizes" — one row per fulfilable size with a quantity stepper.
 * Produces one basket line per size with quantity > 0.
 */
export function SizeQuantityPicker({ sizes, quantities, onChange, unitPrice, formatPrice, disabled = false }: Props) {
  const set = (size: string, qty: number) => {
    const next = { ...quantities, [size]: Math.max(0, Math.min(MAX_LINE_QUANTITY, qty)) };
    if (next[size] === 0) delete next[size];
    onChange(next);
  };
  const total = totalQuantity(quantities);

  return (
    <div className="rounded-xl border border-charcoal/10 bg-white" role="group" aria-label="Quantity per size">
      <ul className="divide-y divide-charcoal/8">
        {sizes.map((size) => {
          const qty = quantities[size] ?? 0;
          return (
            <li key={size} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="w-12 text-sm font-extrabold text-charcoal">{size}</span>
              <span className="flex-1 text-xs text-charcoal/50">{formatPrice(unitPrice)} each</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Fewer ${size}`}
                  disabled={disabled || qty === 0}
                  onClick={() => set(size, qty - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/15 text-charcoal transition hover:bg-charcoal/5 disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_LINE_QUANTITY}
                  value={qty}
                  aria-label={`Quantity for size ${size}`}
                  disabled={disabled}
                  onChange={(e) => set(size, Number.parseInt(e.target.value || "0", 10) || 0)}
                  className="h-8 w-12 rounded-lg border border-charcoal/15 text-center text-sm font-bold text-charcoal outline-none focus:border-terracotta/50"
                />
                <button
                  type="button"
                  aria-label={`More ${size}`}
                  disabled={disabled || qty >= MAX_LINE_QUANTITY}
                  onClick={() => set(size, qty + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/15 text-charcoal transition hover:bg-charcoal/5 disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-charcoal/8 px-3 py-2 text-xs font-semibold text-charcoal/60">
        <span>{total} {total === 1 ? "item" : "items"} across {Object.keys(quantities).length} {Object.keys(quantities).length === 1 ? "size" : "sizes"}</span>
        <span className="text-sm font-black text-charcoal">{formatPrice(total * unitPrice)}</span>
      </div>
    </div>
  );
}
