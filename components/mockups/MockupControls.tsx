"use client";

import { motion } from "framer-motion";

export type ProductOption = {
  id: string;
  name: string;
  price: string;
};

export type ColorOption = {
  hex: string;
};

type MockupControlsProps = {
  products: ProductOption[];
  colors?: ColorOption[];
  selectedProductId: string;
  selectedColorHex?: string;
  onProductSelect: (id: string) => void;
  onColorSelect?: (hex: string) => void;
  productLabel?: string;
  colorLabel?: string;
};

export function MockupControls({
  products,
  colors = [],
  selectedProductId,
  selectedColorHex,
  onProductSelect,
  onColorSelect,
  productLabel = "Select Product",
  colorLabel = "Color",
}: MockupControlsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-3">
          {productLabel}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onProductSelect(p.id)}
              className={`min-h-[52px] rounded-2xl border p-4 text-left transition-all ${
                selectedProductId === p.id
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white hover:border-black/20"
              }`}
            >
              <div className="text-sm font-extrabold">{p.name}</div>
              <div
                className={`text-xs mt-1 ${
                  selectedProductId === p.id ? "text-white/70" : "text-black/55"
                }`}
              >
                {p.price}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {colors.length > 1 && onColorSelect && selectedColorHex && (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-3">
            {colorLabel}
          </h3>
          <div className="flex gap-3">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onColorSelect(c.hex)}
                className={`h-10 w-10 rounded-full border-2 transition-all min-w-[40px] ${
                  selectedColorHex === c.hex
                    ? "border-black ring-4 ring-black/5"
                    : "border-black/10 hover:border-black/25"
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={`Color ${c.hex}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
