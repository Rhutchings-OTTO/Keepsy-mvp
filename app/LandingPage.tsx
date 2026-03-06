"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Gift,
  ImageIcon,
  Sparkles,
  ShoppingBag,
  Star,
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
import { CREATE_EXAMPLES } from "@/content/createExamples";

const PremiumGateway = dynamic(
  () => import("@/components/PremiumGateway").then((mod) => mod.PremiumGateway),
  { ssr: false }
);

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-6";

// ─── Data ────────────────────────────────────────────────────────────────────

const HERO_BULLETS = [
  "See it on the product before you buy",
  "Gift-wrapped free with every order",
  "Shipped to US & UK",
];

const PRODUCT_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
    alt: "Custom personalised mug",
    label: "Mugs",
  },
  {
    src: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400",
    alt: "Personalised greeting card",
    label: "Cards",
  },
  {
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    alt: "Custom printed tee",
    label: "Tees",
  },
  {
    src: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400",
    alt: "Custom hoodie",
    label: "Hoodies",
  },
];

const SOCIAL_PROOF_ITEMS = [
  "★★★★★  2,847 Happy Customers",
  "🎁  Free Gift Wrapping",
  "🇺🇸  Made & Shipped with Love",
  "↩️  30-Day Returns",
];

const FEATURED_PRODUCTS = [
  {
    name: "Best Mom Ever Mug",
    price: "$24.99",
    rating: "★★★★★",
    reviews: 847,
    src: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
    alt: "Best Mom Ever custom mug",
  },
  {
    name: "Custom Photo Card Pack",
    price: "$18.99",
    rating: "★★★★★",
    reviews: 1203,
    src: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400",
    alt: "Custom photo greeting card",
  },
  {
    name: "The Cozy Custom Hoodie",
    price: "$54.99",
    rating: "★★★★★",
    reviews: 276,
    src: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400",
    alt: "Custom personalised hoodie",
  },
  {
    name: "Personalised Family Tee",
    price: "$32.99",
    rating: "★★★★★",
    reviews: 328,
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
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
  {
    quote:
      "I was skeptical ordering custom stuff online but the preview feature totally won me over. I could see exactly what the hoodie would look like before I bought it. Zero surprises, all good ones.",
    name: "Patricia W.",
    state: "Illinois",
    occasion: "Birthday Gift",
  },
  {
    quote:
      "Ordered mugs for our whole book club with our group photo. Everyone went crazy for them. The turnaround was fast and the packaging was so pretty — it honestly felt like a luxury brand.",
    name: "Nancy G.",
    state: "Georgia",
    occasion: "Group Gift",
  },
];

const TRUST_BADGES = [
  { icon: Package, label: "Premium Materials", color: "text-terracotta" },
  { icon: Printer, label: "Vivid Lasting Prints", color: "text-forest" },
  { icon: BadgeCheck, label: "Gift-Ready Packaging", color: "text-terracotta" },
  { icon: Truck, label: "Fast US & UK Shipping", color: "text-forest" },
  { icon: RotateCcw, label: "Easy 30-Day Returns", color: "text-terracotta" },
  { icon: Lock, label: "Secure Checkout", color: "text-forest" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductImageCard({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-[#F5EDE0] shadow-md">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 50vw, 300px"
        onError={() => setVisible(false)}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/90">{label}</span>
      </div>
    </div>
  );
}

function FeaturedProductCard({
  product,
  index,
}: {
  product: (typeof FEATURED_PRODUCTS)[0];
  index: number;
}) {
  const [imgVisible, setImgVisible] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-black/8 bg-white/90 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.25)] transition-shadow duration-300 hover:shadow-[0_28px_56px_-24px_rgba(0,0,0,0.32)] backdrop-blur-md"
    >
      {/* Bestseller badge */}
      <div className="absolute left-3 top-3 z-10 rounded-full bg-[#C9A84C] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
        Bestseller
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#F5EDE0]">
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
            <ShoppingBag size={40} className="text-[#C4714A]/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-serif text-base font-semibold leading-tight text-charcoal sm:text-lg">
          {product.name}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-sm text-[#C9A84C]">{product.rating}</span>
          <span className="text-xs text-[#8b7f74]">({product.reviews.toLocaleString()})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-charcoal">{product.price}</span>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 rounded-full bg-[#C4714A] px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Shop Now
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewCard({ review }: { review: (typeof REVIEWS)[0] }) {
  return (
    <div className="w-[280px] flex-shrink-0 snap-start rounded-[1.5rem] border border-black/8 bg-white/90 p-5 shadow-[0_16px_38px_-24px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#C9A84C]">★★★★★</span>
        <span className="rounded-full border border-[#d8cdc0] bg-[#FDF6EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b7468]">
          Verified Purchase
        </span>
      </div>
      <p className="mt-3 text-[14px] leading-6 text-[#47413c]">&quot;{review.quote}&quot;</p>
      <p className="mt-3 text-sm font-semibold text-[#2D2926]">
        — {review.name}, {review.state}
      </p>
      <p className="mt-0.5 text-xs text-[#8b7f74]">{review.occasion}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const router = useRouter();
  const [region, setCurrentRegion] = useState<Region | null>(() => initialRegion ?? getRegion());
  const [showGateway, setShowGateway] = useState<boolean>(() => {
    const resolvedRegion = initialRegion ?? getRegion();
    return !resolvedRegion;
  });
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Mouse-move parallax glow
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(28);
  const heroGlow = useMotionTemplate`radial-gradient(560px circle at ${glowX}% ${glowY}%, rgba(196, 113, 74, 0.18), transparent 60%)`;

  const activeRegion = region ?? "US";
  const showcase = CREATE_EXAMPLES[activeRegion];

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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValue.trim()) {
      setEmailSubmitted(true);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-transparent text-charcoal ${
        showGateway ? "fixed inset-0 h-screen" : ""
      }`}
    >
      {showGateway ? (
        <PremiumGateway onComplete={handleGatewayComplete} />
      ) : (
        <>
          {/* ── Header ── */}
          <header className="relative z-30">
            <div className={`${CONTAINER} flex items-center justify-between py-5`}>
              <DynamicLogo href="/" width={148} className="text-charcoal" />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegionSelectorOpen(true)}
                  className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-[#4f4944] shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-md"
                >
                  {activeRegion} shipping
                </button>
                <Link
                  href="/shop"
                  className="hidden rounded-full bg-[#C4714A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(196,113,74,0.55)] sm:inline-flex"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </header>

          <main className="relative z-20">
            {/* ── 1. Hero ── */}
            <section className="pb-10 pt-4 sm:pb-14 sm:pt-6">
              <div className={CONTAINER}>
                <motion.div
                  className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,243,236,0.78))] p-4 shadow-[0_40px_110px_-56px_rgba(31,24,18,0.50)] backdrop-blur-xl sm:p-8"
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    glowX.set(((event.clientX - rect.left) / rect.width) * 100);
                    glowY.set(((event.clientY - rect.top) / rect.height) * 100);
                  }}
                  onMouseLeave={() => {
                    glowX.set(50);
                    glowY.set(28);
                  }}
                >
                  {/* Glow layer */}
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: heroGlow }}
                  />
                  {/* Shimmer */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.34),transparent_40%,rgba(255,255,255,0.18)_75%,transparent)]" />

                  <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
                    {/* Left */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="flex flex-col justify-center"
                    >
                      {/* Star badge */}
                      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#d8cdc0] bg-white/78 px-3 py-1.5 text-sm font-medium text-[#62584e]">
                        <span className="text-[#C9A84C]">★★★★★</span>
                        2,847 Happy Customers
                      </div>

                      <h1
                        className="mt-5 font-serif leading-[1.0] tracking-[-0.04em] text-charcoal"
                        style={{ fontSize: "clamp(2.8rem, 5.5vw, 5rem)" }}
                      >
                        Gifts They&apos;ll Never Forget
                      </h1>

                      <p className="mt-4 max-w-lg text-[17px] leading-8 text-[#5e5852]">
                        Turn your favourite photos and memories into beautiful, personalised
                        keepsakes. Mugs, cards, tees, hoodies — all custom made.
                      </p>

                      {/* CTAs */}
                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                          href="/shop"
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#C4714A] px-6 text-base font-semibold text-white shadow-[0_18px_34px_-18px_rgba(196,113,74,0.6)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
                        >
                          Shop Our Collection
                          <ShoppingBag size={17} />
                        </Link>
                        <Link
                          href="/create"
                          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-charcoal bg-transparent px-6 text-base font-semibold text-charcoal transition-transform duration-200 ease-out hover:-translate-y-0.5"
                        >
                          Create Your Own
                        </Link>
                      </div>

                      {/* Trust bullets */}
                      <ul className="mt-7 space-y-2.5">
                        {HERO_BULLETS.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-3 text-[15px] text-[#514b46]"
                          >
                            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#C4714A]/15 text-[#C4714A]">
                              <Check size={13} strokeWidth={3} />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* Right: 2x2 product image grid */}
                    <motion.div
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {PRODUCT_IMAGES.map((img) => (
                        <ProductImageCard key={img.label} {...img} />
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ── 2. Social proof bar ── */}
            <section className="overflow-hidden bg-[#F5EDE0] py-4">
              {/* Desktop: flex row */}
              <div className="hidden sm:block">
                <div className={`${CONTAINER} flex items-center justify-center gap-6`}>
                  {SOCIAL_PROOF_ITEMS.map((item, i) => (
                    <div key={item} className="flex items-center gap-6">
                      <span className="text-sm font-semibold text-[#5e4a3a]">{item}</span>
                      {i < SOCIAL_PROOF_ITEMS.length - 1 && (
                        <span className="text-[#c4a882]">·</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* Mobile: scrolling marquee */}
              <div className="sm:hidden">
                <style>{`
                  @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .marquee-track {
                    display: flex;
                    width: max-content;
                    animation: marquee-scroll 18s linear infinite;
                  }
                  .marquee-track:hover {
                    animation-play-state: paused;
                  }
                `}</style>
                <div className="marquee-track">
                  {[...SOCIAL_PROOF_ITEMS, ...SOCIAL_PROOF_ITEMS].map((item, i) => (
                    <span key={i} className="px-6 text-sm font-semibold text-[#5e4a3a]">
                      {item}
                      <span className="ml-6 text-[#c4a882]">·</span>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 3. Featured Products ── */}
            <section className="py-16 sm:py-24">
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center"
                >
                  <h2 className="font-serif text-4xl tracking-[-0.03em] text-charcoal sm:text-5xl">
                    Most Loved This Month
                  </h2>
                  <p className="mt-3 text-[17px] text-[#5e5852]">
                    Bestsellers our customers keep coming back for
                  </p>
                </motion.div>

                <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {FEATURED_PRODUCTS.map((product, i) => (
                    <FeaturedProductCard key={product.name} product={product} index={i} />
                  ))}
                </div>
              </div>
            </section>

            {/* ── 4. Emotional Storytelling ── */}
            <section className="py-16 sm:py-24">
              <div className={CONTAINER}>
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center">
                  {/* Image */}
                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#F5EDE0] shadow-[0_32px_72px_-40px_rgba(0,0,0,0.28)]"
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1536010305525-f7aa0834e2c7?w=800"
                      alt="Woman smiling while receiving a gift"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    {/* Warm terracotta overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#C4714A]/60 to-transparent" />
                  </motion.div>

                  {/* Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#C4714A]">
                      Our Story
                    </p>
                    <h2 className="mt-4 font-serif text-4xl leading-[1.1] tracking-[-0.03em] text-charcoal sm:text-5xl">
                      Every Keepsake Tells a Story
                    </h2>
                    <p className="mt-5 text-[17px] leading-8 text-[#5e5852]">
                      We built Keepsy because the most meaningful gifts aren&apos;t expensive —
                      they&apos;re personal. A photo turned into art. A memory preserved on
                      something beautiful. Something she&apos;ll look at every day and think of
                      you.
                    </p>
                    <div className="mt-8">
                      <Link
                        href="/create"
                        className="inline-flex items-center gap-2 rounded-full bg-[#C4714A] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_34px_-18px_rgba(196,113,74,0.55)] transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        Create Your First Keepsake
                        <ArrowRight size={17} />
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ── 5. How It Works ── */}
            <section className="py-16 sm:py-24">
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center"
                >
                  <h2 className="font-serif text-4xl tracking-[-0.03em] text-charcoal sm:text-5xl">
                    Three Simple Steps
                  </h2>
                </motion.div>

                <div className="mt-10 grid gap-5 sm:grid-cols-3">
                  {HOW_IT_WORKS_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.15,
                          ease: "easeOut",
                        }}
                        className="rounded-[1.75rem] border border-black/8 bg-white/90 p-6 shadow-[0_20px_46px_-32px_rgba(0,0,0,0.28)] backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C4714A]/15 text-[#C4714A]">
                            <Icon size={22} />
                          </div>
                          <span className="font-serif text-2xl font-bold text-[#C9A84C]">
                            {step.step}
                          </span>
                        </div>
                        <h3 className="mt-5 text-xl font-bold text-charcoal">{step.title}</h3>
                        <p className="mt-2.5 text-[15px] leading-7 text-[#5e5852]">{step.body}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 6. Reviews Carousel ── */}
            <section className="py-16 sm:py-24">
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <h2 className="font-serif text-4xl tracking-[-0.03em] text-charcoal sm:text-5xl">
                    What Our Customers Are Saying
                  </h2>
                </motion.div>

                {/* Auto-scroll marquee */}
                <div className="mt-8 overflow-hidden">
                  <style>{`
                    @keyframes review-scroll {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                    .review-track {
                      display: flex;
                      gap: 1rem;
                      width: max-content;
                      animation: review-scroll 38s linear infinite;
                    }
                    .review-track:hover {
                      animation-play-state: paused;
                    }
                  `}</style>
                  <div className="review-track">
                    {[...REVIEWS, ...REVIEWS].map((review, i) => (
                      <ReviewCard key={i} review={review} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 7. Trust & Quality grid ── */}
            <section className="bg-[#F5EDE0] py-16 sm:py-24">
              <div className={CONTAINER}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center"
                >
                  <h2 className="font-serif text-3xl tracking-[-0.03em] text-charcoal sm:text-4xl">
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
                        className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-black/8 bg-white/80 px-4 py-5 text-center shadow-sm backdrop-blur-md"
                      >
                        <Icon size={28} className={badge.color} />
                        <p className="text-sm font-semibold leading-snug text-charcoal">
                          {badge.label}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 8. Email capture ── */}
            <section className="bg-[#2C4A3E] py-16 sm:py-24">
              <div className={`${CONTAINER} text-center`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                >
                  <h2 className="font-serif text-4xl tracking-[-0.03em] text-white sm:text-5xl">
                    Join the Keepsy Family
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-[17px] leading-7 text-[#FDF6EE]/80">
                    Get 10% off your first order — plus gifting ideas, new designs & seasonal
                    inspiration.
                  </p>

                  <AnimatePresence mode="wait">
                    {emailSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-8 inline-block rounded-2xl bg-white/15 px-8 py-5 text-lg font-semibold text-white"
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
                        className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                      >
                        <input
                          type="email"
                          required
                          value={emailValue}
                          onChange={(e) => setEmailValue(e.target.value)}
                          placeholder="Your email address"
                          className="w-full max-w-sm rounded-full border-0 bg-[#FDF6EE] px-5 py-3.5 text-charcoal placeholder-[#9c8b7e] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] sm:w-72"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full bg-[#C9A84C] px-7 py-3.5 font-semibold text-charcoal shadow-[0_14px_28px_-16px_rgba(201,168,76,0.6)] transition-opacity hover:opacity-90 sm:w-auto"
                        >
                          Claim My 10% Off
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <p className="mt-5 text-sm text-[#FDF6EE]/55">
                    Join 15,000+ women who love thoughtful gifting · Unsubscribe anytime
                  </p>
                </motion.div>
              </div>
            </section>
          </main>

          {/* ── Footer ── */}
          <footer className="relative z-20 border-t border-black/8 bg-white/65 py-10 backdrop-blur-md">
            <div
              className={`${CONTAINER} flex flex-col gap-5 text-sm text-[#5d5650] sm:flex-row sm:items-center sm:justify-between`}
            >
              <div>
                <p className="font-semibold text-charcoal">Keepsy</p>
                <p className="mt-1">Beautiful personalised gifts, made simple.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/shop" className="hover:text-charcoal">
                  Shop
                </Link>
                <Link href="/gift-ideas" className="hover:text-charcoal">
                  Gift ideas
                </Link>
                <Link href="/create" className="hover:text-charcoal">
                  Create
                </Link>
                <Link href="/terms" className="hover:text-charcoal">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-charcoal">
                  Privacy
                </Link>
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
