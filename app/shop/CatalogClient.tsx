"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { getRegion, type Region } from "@/lib/region";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "all" | "mug" | "tee" | "hoodie" | "card";
type SortKey = "popular" | "price-asc" | "price-desc";

interface CatalogProduct {
  id: string;
  name: string;
  category: "mug" | "tee" | "hoodie" | "card";
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
    image: "/images/products/hoodie-white.jpg",
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
    image: "/images/products/hoodie-black.jpg",
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
    image: "/images/products/hoodie-blue.jpg",
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
    image: "/images/products/tshirt-white.jpg",
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
    image: "/images/products/tshirt-black.jpg",
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
    image: "/images/products/tshirt-blue.jpg",
  },
  {
    id: "mug-white",
    name: "Personalised Mug",
    category: "mug",
    color: "white",
    price: 18.99,
    rating: 4.9,
    reviewCount: 1847,
    soldThisWeek: 72,
    badge: "Bestseller",
    image: "/images/products/mug.jpg",
  },
  {
    id: "card-white",
    name: "Personalised Greeting Card",
    category: "card",
    color: "white",
    price: 9.99,
    rating: 4.9,
    reviewCount: 2341,
    soldThisWeek: 98,
    badge: "Bestseller",
    image: "/images/products/greeting-card.jpg",
  },
];

// ─── Toast data ───────────────────────────────────────────────────────────────

const TOAST_COMBOS = [
  { name: "Sarah", location: "Texas", product: "Personalised Mug", time: "3 min ago" },
  { name: "Jennifer", location: "Ohio", product: "Black Hoodie", time: "7 min ago" },
  { name: "Lisa", location: "California", product: "White T-Shirt", time: "2 min ago" },
  { name: "Michelle", location: "Florida", product: "Personalised Greeting Card", time: "5 min ago" },
  { name: "Karen", location: "Georgia", product: "Blue Hoodie", time: "9 min ago" },
  { name: "Deborah", location: "Tennessee", product: "Personalised Mug", time: "1 min ago" },
  { name: "Patricia", location: "Virginia", product: "Black T-Shirt", time: "4 min ago" },
  { name: "Nancy", location: "Illinois", product: "White Hoodie", time: "6 min ago" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: number) {
  const full = Math.floor(rating);
  return "★".repeat(full) + (rating % 1 >= 0.5 ? "½" : "");
}

function productHref(product: CatalogProduct) {
  const base = `/create?product=${product.category === "tee" ? "tee" : product.category}`;
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
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-charcoal/8 bg-white transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(196,113,74,0.18)]"
    >
      {/* Badge */}
      {product.badge && (
        <div
          className="absolute left-3 top-3 z-10 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
          style={{
            backgroundColor:
              product.badge === "Bestseller"
                ? "var(--color-gold)"
                : "var(--color-terracotta)",
          }}
        >
          {product.badge}
        </div>
      )}

      {/* Image — edge to edge, portrait aspect */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-1.5 border-t border-charcoal/8 px-4 py-4">
        {/* Stars */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none" style={{ color: "var(--color-gold)" }}>
            {renderStars(product.rating)}
          </span>
          <span className="text-[11px] text-charcoal/45 font-medium">
            (100+)
          </span>
        </div>

        {/* Name */}
        <p className="font-sans font-semibold text-charcoal text-sm leading-snug">{product.name}</p>

        {/* Price */}
        <p className="font-bold text-charcoal text-lg">{fmtPrice(product.price, region)}</p>

        {/* Sold this week */}
        <p className="font-medium" style={{ fontSize: "11px", color: "var(--color-terracotta)" }}>
          Popular this week
        </p>

        {/* CTA */}
        <Link
          href={productHref(product)}
          className="mt-auto block w-full rounded-lg py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--color-terracotta)" }}
        >
          Personalise Now
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Purchase Toast ───────────────────────────────────────────────────────────

function PurchaseToast() {
  const [visible, setVisible] = useState(false);
  const [combo, setCombo] = useState(TOAST_COMBOS[0]);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function showNext() {
      indexRef.current = (indexRef.current + 1) % TOAST_COMBOS.length;
      setCombo(TOAST_COMBOS[indexRef.current]);
      setVisible(true);

      timerRef.current = setTimeout(() => {
        setVisible(false);
        const delay = 15000 + Math.random() * 5000;
        timerRef.current = setTimeout(showNext, delay);
      }, 4000);
    }

    const initial = 8000 + Math.random() * 4000;
    timerRef.current = setTimeout(showNext, initial);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={combo.name + combo.product}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-4 z-50 max-w-[280px] rounded-xl bg-white shadow-[0_8px_32px_-8px_rgba(45,41,38,0.22)] border-l-4 border-charcoal/10 pl-1 pr-4 py-3"
          style={{ borderLeftColor: "var(--color-gold)" }}
        >
          <div className="flex items-start gap-2 pl-3">
            <span className="text-xl leading-none mt-0.5">🛍️</span>
            <div>
              <p className="text-[12px] font-semibold text-charcoal leading-snug">
                {combo.name} from {combo.location} just ordered
              </p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--color-terracotta)" }}>
                {combo.product} · {combo.time}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mug", label: "Mugs" },
  { key: "tee", label: "Tees" },
  { key: "hoodie", label: "Hoodies" },
  { key: "card", label: "Cards" },
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
        className="py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                Keepsy
              </p>
              <h1 className="mt-3 font-serif text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl">
                Our Collection
              </h1>
              <p className="mt-3 text-base text-white/70">
                Personalised gifts she&apos;ll treasure forever
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex gap-6 sm:text-right"
            >
              <div>
                <p className="font-serif text-2xl font-bold text-white">{PRODUCTS.length}</p>
                <p className="text-sm text-white/55">Products</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-white">Thousands</p>
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
          <div className="flex items-center justify-between gap-4 py-4 overflow-x-auto scrollbar-hide">
            {/* Category pills */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
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
            <div className="relative flex-shrink-0 flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-charcoal/40" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort products"
                className="appearance-none bg-transparent pr-4 text-sm font-medium text-charcoal/65 cursor-pointer focus:outline-none"
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="text-charcoal/40 pointer-events-none" />
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
            className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
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

      {/* Purchase activity toast */}
      <PurchaseToast />
    </div>
  );
}
