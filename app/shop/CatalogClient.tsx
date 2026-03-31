"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { getRegion, type Region } from "@/lib/region";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "all" | "mug" | "tee" | "hoodie" | "card" | "canvas";
type SortKey = "popular" | "price-asc" | "price-desc";

interface CatalogProduct {
  id: string;
  name: string;
  category: "mug" | "tee" | "hoodie" | "card" | "canvas";
  color?: "white" | "black" | "blue";
  price: number;
  rating: number;
  reviewCount: number;
  soldThisWeek: number;
  badge: "Bestseller" | "New" | null;
  image: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PRODUCTS: CatalogProduct[] = [
  {
    id: "hoodie-white",
    name: "Personalised Hoodie — White",
    category: "hoodie",
    color: "white",
    price: 44.99,
    rating: 4.9,
    reviewCount: 412,
    soldThisWeek: 18,
    badge: "Bestseller",
    image: "/images/collections/collection-newbaby-hoodie-white.png",
  },
  {
    id: "hoodie-black",
    name: "Personalised Hoodie — Black",
    category: "hoodie",
    color: "black",
    price: 44.99,
    rating: 4.9,
    reviewCount: 347,
    soldThisWeek: 14,
    badge: null,
    image: "/images/collections/collection-pet-hoodie-black.png",
  },
  {
    id: "hoodie-blue",
    name: "Personalised Hoodie — Blue",
    category: "hoodie",
    color: "blue",
    price: 44.99,
    rating: 4.8,
    reviewCount: 198,
    soldThisWeek: 9,
    badge: "New",
    image: "/images/collections/collection-wedding-hoodie-blue.png",
  },
  {
    id: "tee-white",
    name: "Personalised T-Shirt — White",
    category: "tee",
    color: "white",
    price: 29.99,
    rating: 4.9,
    reviewCount: 856,
    soldThisWeek: 34,
    badge: "Bestseller",
    image: "/images/collections/collection-friends-tshirt-white.png",
  },
  {
    id: "tee-black",
    name: "Personalised T-Shirt — Black",
    category: "tee",
    color: "black",
    price: 29.99,
    rating: 4.9,
    reviewCount: 621,
    soldThisWeek: 27,
    badge: null,
    image: "/images/collections/collection-bulldog-tshirt-black.png",
  },
  {
    id: "tee-blue",
    name: "Personalised T-Shirt — Blue",
    category: "tee",
    color: "blue",
    price: 29.99,
    rating: 4.8,
    reviewCount: 289,
    soldThisWeek: 11,
    badge: "New",
    image: "/images/collections/collection-golf-tshirt-blue.png",
  },
  {
    id: "mug-white",
    name: "Personalised Mug",
    category: "mug",
    color: "white",
    price: 14.99,
    rating: 4.9,
    reviewCount: 1847,
    soldThisWeek: 72,
    badge: "Bestseller",
    image: "/images/collections/collection-pet-mug.png",
  },
  {
    id: "card-white",
    name: "Personalised Greeting Card",
    category: "card",
    color: "white",
    price: 6.99,
    rating: 4.9,
    reviewCount: 2341,
    soldThisWeek: 98,
    badge: "Bestseller",
    image: "/images/collections/collection-newbaby-card.png",
  },
  {
    id: "canvas-family",
    name: "Personalised Canvas",
    category: "canvas",
    price: 79.99,
    rating: 4.9,
    reviewCount: 64,
    soldThisWeek: 12,
    badge: "New",
    image: "/images/collections/collection-family-canvas.png",
  },
  {
    id: "canvas-pet",
    name: "Personalised Canvas — Square",
    category: "canvas",
    price: 49.99,
    rating: 4.9,
    reviewCount: 41,
    soldThisWeek: 8,
    badge: "New",
    image: "/images/collections/collection-pet-canvas.png",
  },
  {
    id: "canvas-house",
    name: "Personalised Canvas — Portrait",
    category: "canvas",
    price: 49.99,
    rating: 4.8,
    reviewCount: 29,
    soldThisWeek: 6,
    badge: "New",
    image: "/images/collections/collection-newhome-canvas.png",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: number) {
  const full = Math.floor(rating);
  return "★".repeat(full) + (rating % 1 >= 0.5 ? "½" : "");
}

function productHref(product: CatalogProduct) {
  const base = `/create?product=${product.category === "tee" ? "tee" : product.category}`;
  if (product.category === "canvas") return "/create?product=canvas";
  return product.color ? `${base}&color=${product.color}` : base;
}

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function fmtPrice(price: number, region: Region | null): string {
  return region === "UK" ? GBP.format(price) : USD.format(price);
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, index, region }: { product: CatalogProduct; index: number; region: Region | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(45,41,38,0.04),_0_4px_12px_rgba(45,41,38,0.05)] transition-all duration-200 ease-out hover:shadow-[0_2px_8px_rgba(45,41,38,0.07),_0_12px_28px_rgba(45,41,38,0.08)] hover:-translate-y-0.5"
    >
      {/* Badge */}
      {product.badge && (
        <div
          className={`absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
            product.badge === "Bestseller" ? "bg-[#C9A84C]" : "bg-terracotta"
          }`}
        >
          {product.badge}
        </div>
      )}

      {/* Image — edge to edge, portrait aspect */}
      <div className="relative overflow-hidden bg-[#F5EDE0] rounded-t-2xl" style={{ aspectRatio: "4/5" }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Stars — hidden on mobile to keep cards compact */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-sm leading-none text-[#C9A84C]">
            {renderStars(product.rating)}
          </span>
          <span className="text-[11px] text-charcoal/45 font-medium">
            (100+)
          </span>
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-charcoal leading-snug mb-1">{product.name}</p>

        {/* Price */}
        <p className="text-base font-bold text-charcoal">{fmtPrice(product.price, region)}</p>

        {/* Sold this week — hidden on mobile */}
        <p className="hidden text-xs text-terracotta font-medium mb-2 sm:block">
          Popular this week
        </p>

        {/* CTA */}
        <Link
          href={productHref(product)}
          className="mt-auto block w-full min-h-[44px] rounded-xl text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center"
          style={{ backgroundColor: "var(--color-terracotta)" }}
        >
          Personalise Now
        </Link>
      </div>
    </motion.div>
  );
}


// ─── Category Tabs ────────────────────────────────────────────────────────────

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mug", label: "Mugs" },
  { key: "tee", label: "Tees" },
  { key: "hoodie", label: "Hoodies" },
  { key: "card", label: "Cards" },
  { key: "canvas", label: "Canvas" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most Popular" },
  { key: "price-asc", label: "Price: Low–High" },
  { key: "price-desc", label: "Price: High–Low" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function CatalogClient() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    setRegion(getRegion());
  }, []);

  // Filter
  const filtered =
    activeCategory === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "price-asc") return a.price - b.price;
    if (sortKey === "price-desc") return b.price - a.price;
    return b.soldThisWeek - a.soldThisWeek;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* ── Hero banner — terracotta ── */}
      <section
        className="py-10 sm:py-20"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                Keepsy
              </p>
              <h1 className="mt-2 font-serif text-4xl font-bold tracking-[-0.04em] text-white sm:text-6xl">
                Our Collection
              </h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base sm:mt-3">
                Personalised gifts she&apos;ll treasure forever
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hidden gap-6 sm:flex sm:text-right"
            >
              <div>
                <p className="font-serif text-2xl font-bold text-white">{PRODUCTS.length}</p>
                <p className="text-sm text-white/55">Products</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-white">Hundreds</p>
                <p className="text-sm text-white/55">of Reviews</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Filters bar ── */}
      <div
        className="sticky top-16 z-30 border-b border-charcoal/8"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Category pills — horizontally scrollable on mobile */}
            <div className="-mx-4 flex flex-1 items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    activeCategory === key
                      ? "text-white"
                      : "border border-charcoal/20 bg-transparent text-charcoal/65 hover:border-terracotta hover:text-terracotta"
                  }`}
                  style={
                    activeCategory === key
                      ? { backgroundColor: "var(--color-charcoal)" }
                      : {}
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative flex flex-shrink-0 items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-charcoal/40" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort products"
                className="min-h-[44px] appearance-none rounded-lg border border-charcoal/20 bg-transparent px-2 pr-6 text-sm font-medium text-charcoal/65 cursor-pointer focus:outline-none"
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-1.5 text-charcoal/40" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + sortKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {sorted.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} region={region} />
            ))}
          </motion.div>
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl font-bold text-charcoal">No products found</p>
            <p className="mt-2 text-charcoal/55">Try a different filter.</p>
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className="mt-5 inline-flex rounded-lg px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
