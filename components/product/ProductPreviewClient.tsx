"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MockupRenderer } from "@/components/MockupRenderer";
import { MugInspector } from "@/components/easter-eggs/MugInspector";
import {
  PRODUCT_LIST,
  getColorName,
  type Product,
  type ProductType,
} from "@/lib/products";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";

function getMockupProductType(type: ProductType): MockupProductType {
  if (type === "tshirt") return "tshirt";
  if (type === "hoodie") return "hoodie";
  if (type === "mug") return "mug";
  return "card";
}

function getMockupColor(hex: string): MockupColor {
  if (hex === "#111827") return "black";
  if (hex === "#2563EB" || hex === "#1e3a8a") return "blue";
  return "white";
}

function slugToProduct(slug: string): Product | null {
  const map: Record<string, ProductType> = {
    tee: "tshirt",
    tshirt: "tshirt",
    hoodie: "hoodie",
    mug: "mug",
    card: "card",
  };
  const type = map[slug?.toLowerCase() ?? ""];
  return type ? PRODUCT_LIST.find((p) => p.id === type) ?? null : null;
}

function gbp(n: number): string {
  return `£${n}`;
}

type ProductPreviewClientProps = {
  initialSlug: string;
};

export function ProductPreviewClient({ initialSlug }: ProductPreviewClientProps) {
  const initialProduct = slugToProduct(initialSlug) ?? PRODUCT_LIST[0];
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct);
  const [selectedColor, setSelectedColor] = useState(
    initialProduct.colors?.[0]?.hex ?? "#FFFFFF"
  );

  const mockupProductType = getMockupProductType(selectedProduct.id);
  const mockupColor = getMockupColor(selectedColor);

  const handleProductChange = (prod: Product) => {
    setSelectedProduct(prod);
    setSelectedColor(prod.colors?.[0]?.hex ?? "#FFFFFF");
  };

  const createHref = `/create?product=${selectedProduct.id === "tshirt" ? "tee" : selectedProduct.id}`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: large mockup with overlay */}
        <div className="lg:col-span-7 sticky top-24">
          <motion.div
            key={`${mockupProductType}-${mockupColor}`}
            initial={{ opacity: 0.96 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {mockupProductType === "mug" ? (
              <MugInspector>
                <MockupRenderer
                  productType={mockupProductType}
                  color={mockupColor}
                  generatedImage={null}
                  hasArtwork={false}
                />
              </MugInspector>
            ) : (
              <MockupRenderer
                productType={mockupProductType}
                color={mockupColor}
                generatedImage={null}
                hasArtwork={false}
              />
            )}
          </motion.div>
          <div className="mt-6 flex gap-3 items-center">
            <div className="px-3 py-2 rounded-full bg-white/70 border border-black/10 text-xs font-extrabold flex items-center gap-2">
              <Sparkles size={14} /> Applied to real mockups
            </div>
          </div>
        </div>

        {/* Right: product selection, color, CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h1 className="text-4xl font-black mb-2">{selectedProduct.name}</h1>
            <p className="text-black/55 font-semibold">{selectedProduct.description}</p>
          </div>

          <div className="bg-white/80 border border-black/10 rounded-3xl p-5 shadow-sm space-y-5">
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-3">
                Select Product
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {PRODUCT_LIST.map((prod) => (
                  <motion.button
                    key={prod.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProductChange(prod)}
                    className={`p-4 rounded-2xl border transition-all text-left ${
                      selectedProduct.id === prod.id
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="text-sm font-extrabold">{prod.name}</div>
                    <div
                      className={`text-xs mt-1 ${
                        selectedProduct.id === prod.id ? "text-white/70" : "text-black/55"
                      }`}
                    >
                      {gbp(prod.basePrice)}
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>

            {selectedProduct.colors && selectedProduct.colors.length > 1 && (
              <section>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-3">
                  Color
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {selectedProduct.colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-10 h-10 rounded-full border-2 transition ${
                        selectedColor === c.hex
                          ? "border-black ring-4 ring-black/5"
                          : "border-black/10 hover:border-black/30"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-pressed={selectedColor === c.hex}
                      aria-label={getColorName(selectedProduct, c.hex)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="pt-4 border-t border-black/10">
              <Link
                href={createHref}
                className="block w-full py-4 rounded-2xl bg-black text-white text-center font-black text-base hover:bg-black/90 transition"
              >
                Start creating
              </Link>
              <p className="mt-3 text-xs text-black/50 text-center">
                Generate or upload to preview your design on this product
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
