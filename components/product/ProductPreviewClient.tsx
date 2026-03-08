"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Package, RotateCcw, Gift } from "lucide-react";
import { MockupRenderer } from "@/components/MockupRenderer";
import { MugInspector } from "@/components/easter-eggs/MugInspector";
import {
  PRODUCT_LIST,
  getColorName,
  type Product,
  type ProductType,
} from "@/lib/products";
import { getRegion, type Region } from "@/lib/region";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const GBP_FMT = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const USD_FMT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function renderStars(rating: number) {
  return "★".repeat(Math.floor(rating));
}

// ─── Reviews data per product type ───────────────────────────────────────────

const REVIEWS: Record<
  ProductType,
  Array<{ name: string; location: string; text: string; rating: number }>
> = {
  mug: [
    {
      name: "Deborah M.",
      location: "Ohio",
      text: "My daughter cried happy tears when she opened it. The photo transfer is crystal clear and the mug feels so premium.",
      rating: 5,
    },
    {
      name: "Sandra K.",
      location: "Texas",
      text: "Ordered for Mother's Day and the quality blew me away. Mum uses it every single morning now.",
      rating: 5,
    },
    {
      name: "Carol B.",
      location: "California",
      text: "I've bought four of these as gifts. Every single person loved theirs. Can't recommend enough.",
      rating: 5,
    },
    {
      name: "Patricia L.",
      location: "Georgia",
      text: "The quality blew me away for the price. Even the packaging felt luxurious.",
      rating: 5,
    },
  ],
  tshirt: [
    {
      name: "Jennifer R.",
      location: "Florida",
      text: "The family portrait came out better than I imagined. Soft, comfy, and it's already been washed a dozen times — no fade.",
      rating: 5,
    },
    {
      name: "Susan T.",
      location: "Virginia",
      text: "Wearing this 'Mama Bear' tee makes me smile every single day. The fit is perfect too.",
      rating: 5,
    },
    {
      name: "Linda W.",
      location: "North Carolina",
      text: "Ordered for my sister's birthday — she wore it to Thanksgiving and got so many compliments.",
      rating: 5,
    },
    {
      name: "Mary J.",
      location: "Tennessee",
      text: "The heavyweight fabric is genuinely lovely. Feels nothing like a typical print-on-demand tee.",
      rating: 5,
    },
  ],
  hoodie: [
    {
      name: "Barbara H.",
      location: "Michigan",
      text: "I wear this hoodie constantly. The photo print is still vivid after months of washing. Worth every penny.",
      rating: 5,
    },
    {
      name: "Nancy C.",
      location: "Oregon",
      text: "Got the Est. family hoodie for Christmas and our whole family wanted one. Reordering for everyone.",
      rating: 5,
    },
    {
      name: "Laura S.",
      location: "Illinois",
      text: "The fleece is so cozy. And the packaging with the ribbon made opening it feel like a real luxury experience.",
      rating: 5,
    },
    {
      name: "Helen V.",
      location: "Arizona",
      text: "Excellent quality and it arrived faster than expected. The memory collage design is stunning.",
      rating: 5,
    },
  ],
  card: [
    {
      name: "Margaret F.",
      location: "New York",
      text: "The cardstock is beautiful and thick. My gran kept it on her mantelpiece for months.",
      rating: 5,
    },
    {
      name: "Dorothy P.",
      location: "Pennsylvania",
      text: "I order these every birthday now. They feel so much more personal than anything from a shop.",
      rating: 5,
    },
    {
      name: "Ruth A.",
      location: "Washington",
      text: "The pack of 5 is incredible value. Everyone who received one said it was the nicest card they'd ever gotten.",
      rating: 5,
    },
    {
      name: "Frances G.",
      location: "Colorado",
      text: "Arrived the day before I needed it and looked even better in person. Will order again.",
      rating: 5,
    },
  ],
};

// ─── Related products ─────────────────────────────────────────────────────────

const RELATED_META: Record<
  ProductType,
  Array<{ type: ProductType; label: string; price: number }>
> = {
  mug: [
    { type: "tshirt", label: "Premium Tee", price: 29.99 },
    { type: "hoodie", label: "Hoodie", price: 44.99 },
    { type: "card", label: "Greeting Card", price: 9.99 },
  ],
  tshirt: [
    { type: "mug", label: "Mug", price: 18.99 },
    { type: "hoodie", label: "Hoodie", price: 44.99 },
    { type: "card", label: "Greeting Card", price: 9.99 },
  ],
  hoodie: [
    { type: "mug", label: "Mug", price: 18.99 },
    { type: "tshirt", label: "Premium Tee", price: 29.99 },
    { type: "card", label: "Greeting Card", price: 9.99 },
  ],
  card: [
    { type: "mug", label: "Mug", price: 18.99 },
    { type: "tshirt", label: "Premium Tee", price: 29.99 },
    { type: "hoodie", label: "Hoodie", price: 44.99 },
  ],
};

const PRODUCT_UNSPLASH: Record<ProductType, string> = {
  mug: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300",
  tshirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
  hoodie: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=300",
  card: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=300",
};

// ─── Trust badges ─────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  { icon: Package, label: "Free Shipping" },
  { icon: RotateCcw, label: "30-Day Returns" },
  { icon: Gift, label: "Handmade With Care" },
];

// ─── Sizes (for apparel) ──────────────────────────────────────────────────────

const APPAREL_SIZES = ["S", "M", "L", "XL", "2XL"] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductPreviewClient({ initialSlug }: { initialSlug: string }) {
  const initialProduct = slugToProduct(initialSlug) ?? PRODUCT_LIST[0];
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct);
  const [selectedColor, setSelectedColor] = useState(
    initialProduct.colors?.[0]?.hex ?? "#FFFFFF"
  );
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    setRegion(getRegion());
  }, []);

  const fmt = (n: number) => region === "UK" ? GBP_FMT.format(n) : USD_FMT.format(n);

  const mockupProductType = getMockupProductType(selectedProduct.id);
  const mockupColor = getMockupColor(selectedColor);

  const handleProductChange = (prod: Product) => {
    setSelectedProduct(prod);
    setSelectedColor(prod.colors?.[0]?.hex ?? "#FFFFFF");
  };

  const createHref = `/create?product=${selectedProduct.id === "tshirt" ? "tee" : selectedProduct.id}`;
  const reviews = REVIEWS[selectedProduct.id];
  const related = RELATED_META[selectedProduct.id];

  const isApparel = selectedProduct.id === "tshirt" || selectedProduct.id === "hoodie";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* ── Left: Mockup ── */}
        <div className="lg:col-span-6 sticky top-24">
          <motion.div
            key={`${mockupProductType}-${mockupColor}`}
            initial={{ opacity: 0.92, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
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

          {/* Below-mockup meta */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* Stars */}
            <div className="flex items-center gap-1.5">
              <span className="text-gold text-base leading-none">{renderStars(4.9)}</span>
              <span className="text-sm text-charcoal/55 font-medium">Highly rated</span>
            </div>
            {/* Badge */}
            <div className="px-3 py-1.5 rounded-full bg-white/70 border border-charcoal/10 text-xs font-bold flex items-center gap-1.5 text-charcoal">
              <Sparkles size={13} className="text-gold" />
              Applied to real mockups
            </div>
          </div>
        </div>

        {/* ── Right: Details ── */}
        <div className="lg:col-span-6 space-y-7">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-medium">
            <Link href="/shop" className="text-terracotta hover:underline">
              Shop
            </Link>
            <span className="text-charcoal/30">/</span>
            <span className="text-charcoal/55">{selectedProduct.name}</span>
          </nav>

          {/* Title + description */}
          <div>
            <h1 className="font-serif text-4xl text-charcoal font-bold leading-tight">
              {selectedProduct.name}
            </h1>
            <p className="mt-2 text-xl font-bold text-charcoal">
              {fmt(selectedProduct.basePrice)}
            </p>
            <p className="mt-2 text-charcoal/60 font-sans text-sm leading-relaxed">
              {selectedProduct.description} Personalised just for her — every detail crafted with care.
            </p>
          </div>

          {/* Product selector pills */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-3">
              Select Product
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_LIST.map((prod) => (
                <motion.button
                  key={prod.id}
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleProductChange(prod)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                    selectedProduct.id === prod.id
                      ? "bg-terracotta border-terracotta text-white shadow-warm-sm"
                      : "bg-cream border-charcoal/20 text-charcoal hover:border-terracotta/40"
                  }`}
                >
                  {prod.name}
                  <span
                    className={`ml-1.5 text-xs ${
                      selectedProduct.id === prod.id ? "text-white/75" : "text-charcoal/45"
                    }`}
                  >
                    {fmt(prod.basePrice)}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          {selectedProduct.colors && selectedProduct.colors.length > 1 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-3">
                Color
                <span className="ml-2 normal-case font-normal text-charcoal/55">
                  — {getColorName(selectedProduct, selectedColor)}
                </span>
              </h3>
              <div className="flex gap-3 flex-wrap">
                {selectedProduct.colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      selectedColor === c.hex
                        ? "border-terracotta ring-2 ring-terracotta/30 ring-offset-1"
                        : "border-charcoal/15 hover:border-charcoal/35"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-pressed={selectedColor === c.hex}
                    aria-label={getColorName(selectedProduct, c.hex)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {isApparel && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-3">
                Size
              </h3>
              <div className="flex gap-2 flex-wrap">
                {APPAREL_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                      selectedSize === size
                        ? "bg-terracotta border-terracotta text-white"
                        : "bg-cream border-charcoal/20 text-charcoal hover:border-terracotta/40"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA + trust badges */}
          <div className="space-y-4 pt-2">
            <Link
              href={createHref}
              className="flex items-center justify-center gap-2 w-full h-14 rounded-full
                         btn-primary-sheen text-white text-base font-bold tracking-wide
                         shadow-terra-glow transition-opacity hover:opacity-90"
            >
              Start Creating →
            </Link>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/70
                             border border-charcoal/8 py-3 px-2 text-center"
                >
                  <Icon size={16} className="text-forest" />
                  <span className="text-[11px] font-semibold text-charcoal/65 leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="pt-4 border-t border-charcoal/8">
            <h2 className="font-serif text-xl text-charcoal font-semibold mb-4">
              What customers say
            </h2>
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className="rounded-2xl bg-white/75 border border-charcoal/8 px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-semibold text-charcoal">{r.name}</span>
                      <span className="text-xs text-charcoal/40 ml-1.5">{r.location}</span>
                    </div>
                    <span className="text-gold text-sm">{renderStars(r.rating)}</span>
                  </div>
                  <p className="text-sm text-charcoal/65 leading-relaxed">{r.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* You May Also Like */}
          <div className="pt-4 border-t border-charcoal/8">
            <h2 className="font-serif text-xl text-charcoal font-semibold mb-4">
              You May Also Like
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {related.map(({ type, label, price }) => (
                <Link
                  key={type}
                  href={`/product/${type === "tshirt" ? "tee" : type}`}
                  className="group rounded-2xl bg-white/75 border border-charcoal/8
                             overflow-hidden hover:shadow-warm-md transition-all hover:-translate-y-0.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PRODUCT_UNSPLASH[type]}
                    alt={label}
                    className="w-full aspect-square object-cover group-hover:scale-[1.03] transition-transform duration-400"
                  />
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-charcoal leading-snug">{label}</p>
                    <p className="text-xs text-charcoal/50 mt-0.5">{fmt(price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
