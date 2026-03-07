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
    id: "mug-1",
    name: "The 'Best Mom Ever' Mug",
    category: "mug",
    price: 24.99,
    rating: 4.9,
    reviewCount: 847,
    soldThisWeek: 34,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
  },
  {
    id: "mug-2",
    name: "Custom Photo Memory Mug",
    category: "mug",
    price: 27.99,
    rating: 4.9,
    reviewCount: 1203,
    soldThisWeek: 58,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400",
  },
  {
    id: "mug-3",
    name: "Personalised Kids' Artwork Mug",
    category: "mug",
    price: 26.99,
    rating: 4.8,
    reviewCount: 634,
    soldThisWeek: 21,
    badge: null,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
  },
  {
    id: "mug-4",
    name: "The Friendship Quote Mug",
    category: "mug",
    price: 24.99,
    rating: 4.8,
    reviewCount: 412,
    soldThisWeek: 17,
    badge: null,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400",
  },
  {
    id: "tee-1",
    name: "Custom Family Portrait Tee",
    category: "tee",
    price: 32.99,
    rating: 4.9,
    reviewCount: 328,
    soldThisWeek: 12,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
  },
  {
    id: "tee-2",
    name: "The 'Mama Bear' Tee",
    category: "tee",
    price: 29.99,
    rating: 4.9,
    reviewCount: 567,
    soldThisWeek: 28,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400",
  },
  {
    id: "tee-3",
    name: "Personalised Date & Initials Tee",
    category: "tee",
    price: 31.99,
    rating: 4.7,
    reviewCount: 189,
    soldThisWeek: 8,
    badge: "New",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
  },
  {
    id: "hoodie-1",
    name: "The Cozy Custom Photo Hoodie",
    category: "hoodie",
    price: 54.99,
    rating: 4.9,
    reviewCount: 276,
    soldThisWeek: 11,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400",
  },
  {
    id: "hoodie-2",
    name: "Personalised 'Est.' Family Hoodie",
    category: "hoodie",
    price: 52.99,
    rating: 4.8,
    reviewCount: 198,
    soldThisWeek: 7,
    badge: null,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },
  {
    id: "hoodie-3",
    name: "The Memory Collage Hoodie",
    category: "hoodie",
    price: 56.99,
    rating: 4.8,
    reviewCount: 143,
    soldThisWeek: 5,
    badge: "New",
    image: "https://images.unsplash.com/photo-1614495152581-2ccea408b0a8?w=400",
  },
  {
    id: "card-1",
    name: "Custom Photo Greeting Card (Pack of 5)",
    category: "card",
    price: 18.99,
    rating: 4.9,
    reviewCount: 892,
    soldThisWeek: 47,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400",
  },
  {
    id: "card-2",
    name: "Personalised Birthday Card",
    category: "card",
    price: 4.99,
    rating: 4.9,
    reviewCount: 1456,
    soldThisWeek: 92,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400",
  },
];

// ─── Toast data ───────────────────────────────────────────────────────────────

const TOAST_COMBOS = [
  { name: "Sarah", location: "Texas", product: "Best Mom Ever Mug", time: "3 min ago" },
  { name: "Jennifer", location: "Ohio", product: "Custom Photo Hoodie", time: "7 min ago" },
  { name: "Lisa", location: "California", product: "Mama Bear Tee", time: "2 min ago" },
  { name: "Michelle", location: "Florida", product: "Personalised Birthday Card", time: "5 min ago" },
  { name: "Karen", location: "Georgia", product: "Custom Family Portrait Tee", time: "9 min ago" },
  { name: "Deborah", location: "Tennessee", product: "Photo Memory Mug", time: "1 min ago" },
  { name: "Patricia", location: "Virginia", product: "Est. Family Hoodie", time: "4 min ago" },
  { name: "Nancy", location: "Illinois", product: "Greeting Card Pack", time: "6 min ago" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: number) {
  const full = Math.floor(rating);
  return "★".repeat(full) + (rating % 1 >= 0.5 ? "½" : "");
}

function productHref(category: CatalogProduct["category"]) {
  return `/create?product=${category === "card" ? "card" : category === "tee" ? "tee" : category}`;
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
            {product.reviewCount.toLocaleString()}
          </span>
        </div>

        {/* Name */}
        <p className="font-sans font-semibold text-charcoal text-sm leading-snug">{product.name}</p>

        {/* Price */}
        <p className="font-bold text-charcoal text-lg">{fmtPrice(product.price, region)}</p>

        {/* Sold this week */}
        <p className="font-medium" style={{ fontSize: "11px", color: "var(--color-terracotta)" }}>
          {product.soldThisWeek} sold this week
        </p>

        {/* CTA */}
        <Link
          href={productHref(product.category)}
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
                <p className="font-serif text-2xl font-bold text-white">4,800+</p>
                <p className="text-sm text-white/55">Reviews</p>
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
