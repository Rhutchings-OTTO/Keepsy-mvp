"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Gift,
  ImageIcon,
  Sparkles,
  ShoppingBag,
  Package,
  Printer,
  BadgeCheck,
  Truck,
  RotateCcw,
  Lock,
} from "lucide-react";
import { DynamicLogo } from "@/components/DynamicLogo";
import RegionSelector from "@/components/RegionSelector";
import { getRegion, setRegion, type Region } from "@/lib/region";

const PremiumGateway = dynamic(
  () => import("@/components/PremiumGateway").then((mod) => mod.PremiumGateway),
  { ssr: false }
);

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

// ─── Data ────────────────────────────────────────────────────────────────────

const HERO_BULLETS = [
  "See it on the product before you buy",
  "Gift-wrapped free with every order",
  "Shipped to US & UK",
];

const PRODUCT_IMAGES = [
  {
    src: "/images/hero/mug-hero.jpg",
    alt: "Custom personalised mug",
    label: "Mugs",
    tag: "From $24",
  },
  {
    src: "/images/hero/cards-hero.jpg",
    alt: "Personalised greeting card",
    label: "Cards",
    tag: "From $4",
  },
  {
    src: "/images/hero/tee-hero.jpg",
    alt: "Custom printed tee",
    label: "Tees",
    tag: "From $32",
  },
  {
    src: "/images/featured/grandma-hoodie.jpg",
    alt: "Custom hoodie",
    label: "Hoodies",
    tag: "From $54",
  },
];

const SOCIAL_PROOF_ITEMS = [
  "★★★★★  Thousands of Happy Customers",
  "🎁  Free Gift Wrapping",
  "🇺🇸  Made & Shipped with Love",
  "↩️  30-Day Returns",
  "🔒  Secure Checkout",
  "⚡  Fast US & UK Delivery",
];

const FEATURED_PRODUCTS = [
  {
    name: "Best Mom Ever Mug",
    priceUS: "$24.99",
    priceUK: "£19.99",
    rating: "★★★★★",
    reviews: 847,
    src: "/images/featured/mom-mug.jpg",
    alt: "Best Mom Ever custom mug",
  },
  {
    name: "Custom Photo Card Pack",
    priceUS: "$18.99",
    priceUK: "£14.99",
    rating: "★★★★★",
    reviews: 1203,
    src: "/images/featured/card-pack.jpg",
    alt: "Custom photo greeting card",
  },
  {
    name: "The Cozy Custom Hoodie",
    priceUS: "$54.99",
    priceUK: "£44.99",
    rating: "★★★★★",
    reviews: 276,
    src: "/images/featured/grandma-hoodie.jpg",
    alt: "Custom personalised hoodie",
  },
  {
    name: "Personalised Family Tee",
    priceUS: "$32.99",
    priceUK: "£26.99",
    rating: "★★★★★",
    reviews: 328,
    src: "/images/featured/family-tee.jpg",
    alt: "Personalised family t-shirt",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    icon: ImageIcon,
    step: "01",
    title: "Choose Your Product",
    body: "Pick a mug, card, tee, or hoodie from our collection of beautiful keepsakes.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Make It Personal",
    body: "Upload a photo or describe your idea in plain words — no design skills needed.",
  },
  {
    icon: Gift,
    step: "03",
    title: "We Do the Rest",
    body: "We create the artwork, wrap it beautifully, and ship it to your door.",
  },
];

const REVIEWS = [
  {
    quote:
      "I ordered the custom mug with my daughter's artwork on it for my mom's 70th birthday. She cried. Literally cried. The quality is incredible — it feels expensive and the print is crystal clear.",
    name: "Sarah M.",
    state: "Ohio",
    occasion: "Birthday Gift",
  },
  {
    quote:
      "Got the personalised hoodie for my best friend for Mother's Day and she texted me at 7am when she opened it. She said it was the most thoughtful gift she'd ever received. I'll definitely be ordering again.",
    name: "Jennifer K.",
    state: "Texas",
    occasion: "Mother's Day",
  },
  {
    quote:
      "My husband passed away last year and I had a photo card made of our favourite family memory for Christmas. Every one of my kids got one. It was the most meaningful thing I've ever given.",
    name: "Diane R.",
    state: "Colorado",
    occasion: "Memorial Gift",
  },
  {
    quote:
      "Ordered the custom tee for my sister's anniversary trip. The colours are so vibrant and it arrived beautifully wrapped. Felt like I'd spent twice what I did. Absolute steal.",
    name: "Michelle T.",
    state: "Florida",
    occasion: "Anniversary",
  },
  {
    quote:
      "I am NOT a tech person but this was so easy. I uploaded a photo of my granddaughter and had a mug ordered in literally ten minutes. My daughter loved it for Christmas.",
    name: "Carol B.",
    state: "Virginia",
    occasion: "Christmas Gift",
  },
  {
    quote:
      "Bought the photo card pack just because I wanted to do something special, no occasion. My best friend called me sobbing. The photo quality is gorgeous — not like a drugstore print at all.",
    name: "Lisa H.",
    state: "California",
    occasion: "Just Because",
  },
];

const TRUST_BADGES = [
  { icon: Package, label: "Premium Materials" },
  { icon: Printer, label: "Vivid Lasting Prints" },
  { icon: BadgeCheck, label: "Gift-Ready Packaging" },
  { icon: Truck, label: "Fast US & UK Shipping" },
  { icon: RotateCcw, label: "Easy 30-Day Returns" },
  { icon: Lock, label: "Secure Checkout" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCollectionCard({
  src,
  alt,
  label,
  tag,
  index,
}: {
  src: string;
  alt: string;
  label: string;
  tag: string;
  index: number;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-[#EDE6DD]"
      style={{ aspectRatio: index === 0 ? "3/4" : "3/4" }}
    >
      {visible && (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
          onError={() => setVisible(false)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-serif text-xl font-bold text-white">{label}</p>
        <p className="mt-0.5 text-sm text-white/65">{tag}</p>
      </div>
    </motion.div>
  );
}

function FeaturedProductCard({
  product,
  index,
  region,
}: {
  product: (typeof FEATURED_PRODUCTS)[0];
  index: number;
  region: Region;
}) {
  const [imgVisible, setImgVisible] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-charcoal/8 bg-white"
    >
      {/* Bestseller badge */}
      <div
        className="absolute left-3 top-3 z-10 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
        style={{ backgroundColor: "var(--color-gold)" }}
      >
        Bestseller
      </div>

      {/* Image */}
      <div className="relative overflow-hidden bg-[#F5EDE0]" style={{ aspectRatio: "4/5" }}>
        {imgVisible ? (
          <Image
            src={product.src}
            alt={product.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgVisible(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag size={40} className="text-terracotta/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-serif text-base font-bold leading-tight text-charcoal sm:text-lg">
          {product.name}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-sm" style={{ color: "var(--color-gold)" }}>{product.rating}</span>
          <span className="text-xs text-charcoal/45">(100+)</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-charcoal">
            {region === "UK" ? product.priceUK : product.priceUS}
          </span>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Shop Now
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const [region, setCurrentRegion] = useState<Region | null>(() => initialRegion ?? getRegion());
  const [showGateway, setShowGateway] = useState<boolean>(() => {
    const resolvedRegion = initialRegion ?? getRegion();
    return !resolvedRegion;
  });
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const activeRegion = region ?? "US";

  useEffect(() => {
    if (showGateway) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showGateway]);

  const handleSelectRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  const handleGatewayComplete = (nextRegion: Region) => {
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  const handleEmailSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (emailValue.trim()) {
      setEmailSubmitted(true);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden text-charcoal ${
        showGateway ? "fixed inset-0 h-screen" : ""
      }`}
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      {showGateway ? (
        <PremiumGateway onComplete={handleGatewayComplete} />
      ) : (
        <>
          {/* ── Header ── */}
          <header className="relative z-30 border-b border-charcoal/8">
            <div className={`${CONTAINER} flex items-center justify-between py-4`}>
              <DynamicLogo href="/" width={140} className="text-charcoal" />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegionSelectorOpen(true)}
                  className="hidden rounded-full border border-charcoal/15 bg-transparent px-4 py-2 text-sm font-medium text-charcoal/70 transition hover:border-charcoal/30 sm:inline-flex"
                >
                  {activeRegion} shipping
                </button>
                <Link
                  href="/shop"
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </header>

          <main>
            {/* ── 1. HERO — editorial split layout ── */}
            <section className="overflow-hidden">
              <div className={CONTAINER}>
                <div className="grid min-h-[90vh] items-center gap-10 py-16 lg:grid-cols-[3fr_2fr] lg:gap-16 lg:py-24">
                  {/* Left: Editorial headline */}
                  <motion.div
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col"
                  >
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2">
                      <div className="h-px w-8" style={{ backgroundColor: "var(--color-terracotta)" }} />
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: "var(--color-terracotta)" }}
                      >
                        Keepsy
                      </span>
                    </div>

                    {/* Main headline */}
                    <h1
                      className="mt-5 font-serif font-bold leading-[0.95] tracking-[-0.05em] text-charcoal"
                      style={{ fontSize: "clamp(3.2rem, 7vw, 6.5rem)" }}
                    >
                      Gifts<br />They&apos;ll<br />Never<br />Forget.
                    </h1>

                    {/* Social proof under headline */}
                    <div className="mt-6 flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--color-gold)" }}>★★★★★</span>
                      <span className="text-sm text-charcoal/55">Thousands of happy customers</span>
                    </div>

                    <p className="mt-6 max-w-sm text-base leading-8 text-charcoal/65">
                      Turn your favourite photos and memories into beautiful, personalised keepsakes — mugs, cards, tees, hoodies.
                    </p>

                    {/* Trust bullets */}
                    <ul className="mt-6 space-y-2">
                      {HERO_BULLETS.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-charcoal/65">
                          <span
                            className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: "rgba(196,113,74,0.14)" }}
                          >
                            <Check size={11} strokeWidth={3} style={{ color: "var(--color-terracotta)" }} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href="/shop"
                        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold text-white shadow-[0_12px_28px_-12px_rgba(196,113,74,0.55)] transition-all hover:shadow-[0_16px_36px_-14px_rgba(196,113,74,0.65)] hover:-translate-y-0.5"
                        style={{ backgroundColor: "var(--color-terracotta)" }}
                      >
                        Shop the Collection
                        <ShoppingBag size={17} />
                      </Link>
                      <Link
                        href="/create"
                        className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 px-8 text-base font-semibold text-charcoal transition-all hover:-translate-y-0.5"
                        style={{ borderColor: "var(--color-charcoal)" }}
                      >
                        Create Your Own
                      </Link>
                    </div>
                  </motion.div>

                  {/* Right: Product gallery */}
                  <motion.div
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {PRODUCT_IMAGES.map((img, i) => (
                      <ProductCollectionCard key={img.label} {...img} index={i} />
                    ))}
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ── 2. Social proof marquee — TERRACOTTA background ── */}
            <section
              className="overflow-hidden py-4"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              <style>{`
                @keyframes marquee-run {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .marquee-run {
                  display: flex;
                  width: max-content;
                  animation: marquee-run 22s linear infinite;
                }
                .marquee-run:hover { animation-play-state: paused; }
              `}</style>
              <div className="marquee-run">
                {[...SOCIAL_PROOF_ITEMS, ...SOCIAL_PROOF_ITEMS].map((item, i) => (
                  <span
                    key={i}
                    className="px-8 text-sm font-semibold text-white/85"
                  >
                    {item}
                    <span className="mx-8 text-white/30">·</span>
                  </span>
                ))}
              </div>
            </section>

            {/* ── 3. Featured Products ── */}
            <section className="py-20 sm:py-28">
              <div className={CONTAINER}>
                <div className="flex items-end justify-between">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      The Collection
                    </p>
                    <h2 className="mt-2 font-serif text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
                      Most Loved This Month
                    </h2>
                  </motion.div>
                  <Link
                    href="/shop"
                    className="hidden items-center gap-1.5 text-sm font-semibold text-charcoal/60 transition hover:text-charcoal sm:flex"
                  >
                    View all <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
                  {FEATURED_PRODUCTS.map((product, i) => (
                    <FeaturedProductCard
                      key={product.name}
                      product={product}
                      index={i}
                      region={activeRegion}
                    />
                  ))}
                </div>

                <div className="mt-6 sm:hidden">
                  <Link
                    href="/shop"
                    className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-charcoal/60"
                  >
                    View all products <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </section>

            {/* ── 4. Emotional storytelling — editorial split ── */}
            <section
              className="py-20 sm:py-28"
              style={{ backgroundColor: "#F5EDE0" }}
            >
              <div className={CONTAINER}>
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  {/* Image first on desktop */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl bg-[#E8DDD0] lg:order-2"
                    style={{ aspectRatio: "4/5" }}
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1536010305525-f7aa0834e2c7?w=800"
                      alt="Woman smiling while receiving a gift"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t"
                      style={{ backgroundImage: "linear-gradient(to top, rgba(45,41,38,0.4), transparent)" }}
                    />
                  </motion.div>

                  {/* Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                    className="lg:order-1"
                  >
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      Our Story
                    </p>
                    <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-charcoal sm:text-5xl lg:text-6xl">
                      Every Keepsake<br />Tells a Story
                    </h2>
                    <div className="mt-6 h-px w-12" style={{ backgroundColor: "var(--color-terracotta)" }} />
                    <p className="mt-6 text-base leading-8 text-charcoal/65">
                      We built Keepsy because the most meaningful gifts aren&apos;t expensive —
                      they&apos;re personal. A photo turned into art. A memory preserved on
                      something beautiful. Something she&apos;ll look at every day and think of you.
                    </p>
                    <div className="mt-8">
                      <Link
                        href="/create"
                        className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_28px_-14px_rgba(196,113,74,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_rgba(196,113,74,0.65)]"
                        style={{ backgroundColor: "var(--color-terracotta)" }}
                      >
                        Create Your First Keepsake
                        <ArrowRight size={17} />
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ── 5. How It Works — editorial numbered list ── */}
            <section className="py-20 sm:py-28">
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: "var(--color-terracotta)" }}
                  >
                    The Process
                  </p>
                  <h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
                    Three Simple Steps
                  </h2>
                </motion.div>

                <div className="mt-14 space-y-0">
                  {HOW_IT_WORKS_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
                        className="grid grid-cols-[auto_1fr] gap-8 border-b border-charcoal/10 py-8 lg:grid-cols-[120px_1fr_auto] lg:items-center last:border-0"
                      >
                        {/* Step number */}
                        <span
                          className="font-serif text-5xl font-bold leading-none"
                          style={{ color: "rgba(196,113,74,0.25)", minWidth: "3.5rem" }}
                        >
                          {step.step}
                        </span>

                        {/* Content */}
                        <div>
                          <h3 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">
                            {step.title}
                          </h3>
                          <p className="mt-2 max-w-md text-base leading-7 text-charcoal/60">
                            {step.body}
                          </p>
                        </div>

                        {/* Icon */}
                        <div
                          className="hidden h-14 w-14 items-center justify-center rounded-xl lg:flex"
                          style={{ backgroundColor: "rgba(196,113,74,0.10)" }}
                        >
                          <Icon size={24} style={{ color: "var(--color-terracotta)" }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 6. Reviews — large editorial pull-quotes ── */}
            <section
              className="py-20 sm:py-28"
              style={{ backgroundColor: "var(--color-charcoal)" }}
            >
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                    Customer Love
                  </p>
                  <h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                    What Our Customers Say
                  </h2>
                </motion.div>

                <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {REVIEWS.map((review, index) => (
                    <motion.div
                      key={review.name}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                      className="flex flex-col rounded-2xl border border-white/8 bg-white/5 p-6"
                    >
                      {/* Stars */}
                      <span className="text-sm" style={{ color: "var(--color-gold)" }}>★★★★★</span>

                      {/* Big quotation mark */}
                      <div
                        className="mt-2 font-serif text-6xl font-bold leading-none"
                        style={{ color: "rgba(196,113,74,0.35)" }}
                      >
                        &ldquo;
                      </div>

                      {/* Quote */}
                      <p className="mt-1 flex-1 text-[15px] leading-7 text-white/75">
                        {review.quote}
                      </p>

                      {/* Attribution */}
                      <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                          style={{ backgroundColor: "rgba(196,113,74,0.2)", color: "var(--color-terra-light)" }}
                        >
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {review.name}, {review.state}
                          </p>
                          <p className="text-xs text-white/40">{review.occasion}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-10 text-center"
                >
                  <Link
                    href="/community"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/65 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 hover:border-white"
                    style={{ color: "white" }}
                  >
                    Read all stories <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </section>

            {/* ── 7. Trust Grid — on cream background ── */}
            <section className="py-20 sm:py-28" style={{ backgroundColor: "var(--color-cream)" }}>
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center"
                >
                  <h2 className="font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-4xl">
                    Why Thousands Choose Keepsy
                  </h2>
                </motion.div>

                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {TRUST_BADGES.map((badge, index) => {
                    const Icon = badge.icon;
                    return (
                      <motion.div
                        key={badge.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
                        className="flex flex-col items-center gap-3 rounded-xl border border-charcoal/8 bg-white px-4 py-6 text-center"
                      >
                        <Icon size={26} style={{ color: "var(--color-terracotta)" }} />
                        <p className="text-xs font-semibold leading-snug text-charcoal">
                          {badge.label}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 8. Email capture — forest green ── */}
            <section
              className="py-20 sm:py-28"
              style={{ backgroundColor: "var(--color-forest)" }}
            >
              <div className={CONTAINER}>
                <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
                      Join the Keepsy Family
                    </p>
                    <h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                      Get 10% Off<br />Your First Order
                    </h2>
                    <p className="mt-4 max-w-sm text-base leading-7 text-white/65">
                      Plus gifting ideas, new designs &amp; seasonal inspiration — delivered to your inbox.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                    className="w-full lg:w-[400px]"
                  >
                    <AnimatePresence mode="wait">
                      {emailSubmitted ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-xl border border-white/15 bg-white/10 px-8 py-6 text-center text-lg font-semibold text-white"
                        >
                          🎉 You&apos;re in! Check your inbox for your code.
                        </motion.div>
                      ) : (
                        <motion.form
                          key="form"
                          onSubmit={handleEmailSubmit}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col gap-3 sm:flex-row"
                        >
                          <input
                            type="email"
                            required
                            value={emailValue}
                            onChange={(e) => setEmailValue(e.target.value)}
                            placeholder="Your email address"
                            className="flex-1 rounded-xl border-0 bg-white/10 px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                          <button
                            type="submit"
                            className="whitespace-nowrap rounded-xl px-6 py-3.5 font-semibold text-charcoal shadow-[0_10px_24px_-12px_rgba(201,168,76,0.6)] transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "var(--color-gold)" }}
                          >
                            Claim 10% Off
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                    <p className="mt-3 text-xs text-white/40">
                      Join women who love thoughtful gifting · Unsubscribe anytime
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>
          </main>

          {/* ── Footer ── */}
          <footer className="py-14" style={{ backgroundColor: "var(--color-charcoal)" }}>
            <div className={CONTAINER}>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="font-serif text-2xl font-bold text-white">Keepsy</p>
                  <p className="mt-2 text-sm text-white/50">
                    Beautiful personalised gifts, made simple.
                  </p>
                  <p className="mt-3 text-xs text-white/35">
                    🇬🇧 UK &amp; 🇺🇸 US shipping · Powered by AI
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-4">Shop</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { href: "/shop", label: "All Products" },
                      { href: "/gift-ideas", label: "Gift Ideas" },
                      { href: "/create", label: "Create Your Own" },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-sm text-white/55 transition hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-4">Company</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { href: "/community", label: "Customer Stories" },
                      { href: "/terms", label: "Terms" },
                      { href: "/privacy", label: "Privacy" },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-sm text-white/55 transition hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-4">Help</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { href: "/shipping", label: "Shipping" },
                      { href: "/refunds", label: "Refunds" },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-sm text-white/55 transition hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsRegionSelectorOpen(true)}
                      className="text-left text-sm text-white/55 transition hover:text-white"
                    >
                      {activeRegion} shipping ↗
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-8"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs text-white/30">
                  © {new Date().getFullYear()} Keepsy Ltd. All rights reserved.
                </p>
                <p className="text-xs text-white/25">
                  Payments by Stripe · Printing by Printful
                </p>
              </div>
            </div>
          </footer>

          {/* ── Region Selector ── */}
          <RegionSelector
            open={isRegionSelectorOpen}
            onSelect={(nextRegion) => {
              handleSelectRegion(nextRegion);
              setIsRegionSelectorOpen(false);
            }}
            onClose={region ? () => setIsRegionSelectorOpen(false) : undefined}
            currentRegion={activeRegion}
          />
        </>
      )}
    </div>
  );
}
