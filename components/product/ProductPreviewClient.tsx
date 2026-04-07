"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
    canvas: "canvas",
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
  canvas: [
    {
      name: "Jennifer M.",
      location: "California",
      text: "Absolutely stunning. The colours are so vibrant and the gallery wrap looks incredibly professional.",
      rating: 5,
    },
    {
      name: "Patricia L.",
      location: "Florida",
      text: "Hung it in our living room and every visitor asks where we got it. Perfect wedding gift.",
      rating: 5,
    },
    {
      name: "Susan T.",
      location: "Texas",
      text: "The 1.25\" depth makes it look like a real gallery piece. Could not be happier.",
      rating: 5,
    },
    {
      name: "Karen W.",
      location: "Georgia",
      text: "Ordered the 20×16 for my mum's birthday — she cried. The quality is unreal for the price.",
      rating: 5,
    },
  ],
};


// ─── Product content (About / How It Works / FAQ) ────────────────────────────

const PRODUCT_CONTENT: Record<string, {
  aboutTitle: string;
  about: string;
  howItWorks: Array<{ title: string; description: string }>;
  perfectFor: string[];
  faqs: Array<{ q: string; a: string }>;
}> = {
  hoodie: {
    aboutTitle: "About Our Personalised Hoodies",
    about: "Our personalised hoodies are soft, cosy, and built to last. Classic fit with a double-lined hood and front pouch pocket — the kind of hoodie that becomes a favourite from the first wear. Every design is unique — created from your description or photo and previewed before you order, so you know exactly what you're getting. Whether it's a gift for Mum, a hen party keepsake, or a birthday surprise, a personalised hoodie from Keepsy makes gifting genuinely memorable.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us what you'd like on your personalised hoodie, or upload a photo. Our AI creates a unique design in seconds." },
      { title: "Preview your design", description: "See exactly how your custom hoodie design will look before you commit to ordering. Refine it until it's perfect." },
      { title: "We print and ship", description: "Your personalised hoodie is printed on demand and shipped to your door in the UK or US." },
    ],
    perfectFor: ["Mother's Day", "Father's Day", "Birthdays", "Hen parties", "Christmas gifts", "Anniversaries", "Just because"],
    faqs: [
      { q: "What sizes are personalised hoodies available in?", a: "Our personalised hoodies come in sizes XS through to 3XL. Full size measurements are available on the product page." },
      { q: "How do I wash my personalised hoodie?", a: "Turn inside out and machine wash on a gentle cool cycle (30°C or below). Tumble dry on low or air dry. Do not iron directly on the print." },
      { q: "How long does a personalised hoodie take to arrive?", a: "UK orders typically arrive in 5–8 business days. US orders take 7–12 business days. Express options are available at checkout." },
      { q: "Can I see the hoodie design before I pay?", a: "Yes — that's what makes Keepsy different. You see your personalised design applied to the hoodie before you place your order." },
      { q: "Are personalised hoodies good gifts?", a: "Personalised hoodies are consistently one of the most-loved gifts because they combine practicality with a deeply personal touch. A hoodie with a design made just for someone shows real thought and effort." },
    ],
  },
  mug: {
    aboutTitle: "About Our Personalised Mugs",
    about: "Our personalised mugs are made from quality white ceramic with a glossy finish that holds vivid colour beautifully. Your design is printed on both sides, so it looks great from every angle. Every custom mug is unique — you describe your design or upload a photo, see it on the mug before ordering, and receive a one-of-a-kind gift that will make someone smile every morning. Personalised mugs from Keepsy are dishwasher safe and microwave friendly, making them practical as well as meaningful.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us what you'd like on your personalised mug — a pet portrait, a family photo, a meaningful design — or upload a photo directly." },
      { title: "Preview your design", description: "See how your custom mug design looks in real life before you order. Make changes until it's exactly right." },
      { title: "We print and ship", description: "Your personalised ceramic mug is printed with a durable, dishwasher-safe process and shipped to the UK or US." },
    ],
    perfectFor: ["Mother's Day", "Father's Day", "Birthdays", "Christmas", "Teacher gifts", "Office gifts", "Baby showers", "Anniversaries"],
    faqs: [
      { q: "Are personalised mugs dishwasher safe?", a: "Yes, our personalised mugs are dishwasher safe. We recommend placing them on the top rack to extend the life of the print." },
      { q: "What size are your personalised mugs?", a: "Our personalised mugs are the standard 11oz size — the most popular mug size in the UK and US." },
      { q: "Can I put a photo on a mug?", a: "Yes — you can upload a photo and our AI will turn it into a personalised design for your mug. You preview the result before ordering." },
      { q: "How quickly does a personalised mug arrive?", a: "UK personalised mugs typically arrive in 5–8 business days. US orders take 7–12 business days." },
      { q: "What makes a good personalised mug gift?", a: "The best personalised mugs feature something the recipient loves — their pet, a favourite place, a meaningful date, or a family photo. Because Keepsy lets you preview the design, you can make sure it's perfect before ordering." },
    ],
  },
  tshirt: {
    aboutTitle: "About Our Personalised T-Shirts",
    about: "Our personalised t-shirts are made from heavyweight 100% cotton with a relaxed, lived-in feel that gets better with every wash. Pre-shrunk so it stays true to size. Every design starts with your description or photo — our AI creates a unique artwork, you preview it on the actual shirt, then we print and ship it. Unlike anything you'd find in a shop, a personalised tee from Keepsy is a one-of-a-kind piece that exists nowhere else in the world.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us the design you want on your personalised t-shirt, or upload a photo. Our AI generates a unique design in seconds." },
      { title: "Preview on the tee", description: "See your custom design on the actual t-shirt before ordering. Adjust it until you're completely happy." },
      { title: "Printed and shipped", description: "Your personalised tee is printed using premium direct-to-garment (DTG) technology and shipped to your door." },
    ],
    perfectFor: ["Birthdays", "Hen parties", "Stag dos", "Sports teams", "Christmas gifts", "Father's Day", "Family reunions"],
    faqs: [
      { q: "How do I wash a personalised t-shirt?", a: "Wash inside out on a gentle cool cycle (30°C). Avoid tumble drying at high heat. This preserves the print and keeps colours vivid." },
      { q: "What sizes do personalised t-shirts come in?", a: "Our personalised t-shirts are available in sizes XS to 3XL. Size guides are available on the product page." },
      { q: "How long does a personalised t-shirt take to arrive?", a: "UK orders arrive in 5–8 business days. US orders take 7–12 business days. Express shipping is available at checkout." },
      { q: "Is the print on personalised t-shirts long lasting?", a: "Yes — we use premium direct-to-garment (DTG) printing which produces soft, breathable prints that are designed to last for years with proper care." },
      { q: "Can I get matching personalised t-shirts for a group?", a: "Yes — you can order multiple sizes of the same design for hen parties, stag dos, sports teams, or family events. Each person can get the same custom design in their size." },
    ],
  },
  card: {
    aboutTitle: "About Our Personalised Greeting Cards",
    about: "A personalised card from Keepsy is far from an ordinary card from the shops. Choose a fine art postcard on thick 280gsm giclée paper with a glossy finish, or a pack of 7 beautifully printed portrait cards on bright white matte paper — each with a craft envelope included. You describe your design or upload a photo, our AI creates a bespoke illustration, and you see it on the card before ordering. Perfect for birthdays, Mother's Day, Father's Day, weddings, anniversaries, and any occasion where you want to say something truly meaningful.",
    howItWorks: [
      { title: "Describe your card", description: "Tell us what you'd like on your personalised greeting card — an illustration, a portrait, a meaningful scene — or upload a photo." },
      { title: "See it before you send", description: "Preview your bespoke card design before ordering. Make it exactly right." },
      { title: "Printed and posted", description: "Your personalised card is printed on premium cardstock and shipped to you in the UK or US." },
    ],
    perfectFor: ["Birthdays", "Mother's Day", "Father's Day", "Weddings", "Baby showers", "Anniversaries", "Christmas", "Thank you cards", "Valentine's Day"],
    faqs: [
      { q: "What size are your personalised greeting cards?", a: "Our personalised greeting cards are A5 size (148mm × 210mm), printed on premium heavyweight cardstock with a high-quality finish." },
      { q: "Do personalised cards come with envelopes?", a: "Yes, all our personalised greeting cards include a matching envelope." },
      { q: "How quickly can I get a personalised birthday card?", a: "UK orders typically arrive in 5–8 business days. For urgent orders, express shipping is available at checkout." },
      { q: "Can I write a message inside the card?", a: "The card is printed with your design on the front. The inside is blank so you can write your personal message by hand — making it even more special." },
      { q: "Are personalised cards better than shop-bought cards?", a: "A personalised card from Keepsy features a completely unique design created just for the recipient — it's not something you could find in any shop. That makes it significantly more meaningful than a generic card, and at £6.99, it's still very affordable." },
    ],
  },
  canvas: {
    aboutTitle: "About Our Personalised Canvas Prints",
    about: "A personalised canvas print from Keepsy transforms a photo, a memory, or a meaningful idea into gallery-quality wall art made to last a lifetime. Every canvas is printed on premium artist-grade canvas with vivid, UV-resistant inks and hand-stretched over a solid pine wood frame with a 1.25\" gallery depth — ready to hang straight out of the box. You describe your vision or upload a photo, our AI creates a stunning design, and you see it on the canvas before ordering. With rich, true-to-life colours and a professional gallery wrap, our canvas prints are a gift that genuinely takes someone's breath away. The perfect choice for weddings, anniversaries, new homes, and milestone birthdays. Ships to the UK and US from £29.99.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us what you want on your personalised canvas — a favourite place, a pet portrait, a wedding venue, a family scene — or upload a photo." },
      { title: "Preview before you order", description: "See exactly how your design will look on the canvas print before committing to purchase. Refine it until it's perfect." },
      { title: "Gallery quality, delivered", description: "Your personalised canvas is printed on premium artist-grade canvas, hand-stretched over a solid pine frame, and shipped ready to hang." },
    ],
    perfectFor: ["Weddings", "Anniversaries", "New homes", "Milestone birthdays", "Mother's Day", "Father's Day", "Christmas", "Memorial gifts"],
    faqs: [
      { q: "What size are your personalised canvas prints?", a: "Our personalised canvas prints are stretched on a solid pine wood frame with a 1.25\" gallery depth and arrive ready to hang — no framing needed." },
      { q: "How long do canvas prints last?", a: "Our personalised canvas prints are made with UV-resistant inks on artist-grade canvas, designed to maintain vivid colour for 75+ years without fading when kept out of direct sunlight." },
      { q: "Are personalised canvas prints a good wedding gift?", a: "Personalised canvas prints are one of the most popular wedding gifts — a bespoke design of the couple's favourite place, wedding venue, or a meaningful illustration makes a gift they'll display for a lifetime." },
      { q: "How is the canvas shipped?", a: "Canvas prints are carefully packaged to prevent damage during transit and shipped with a tracking number. UK delivery takes 5–8 business days, US delivery 7–12 business days." },
      { q: "Can I upload a photo for a canvas print?", a: "Yes — you can upload a photo and our AI will create a unique artistic interpretation for your canvas, or use the photo directly. You preview the result before ordering." },
    ],
  },
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

  const isApparel = selectedProduct.id === "tshirt" || selectedProduct.id === "hoodie";

  return (
    <>
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* ── Left: Mockup ── */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <motion.div
            key={`${mockupProductType}-${mockupColor}`}
            initial={{ opacity: 0.92, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            {selectedProduct.id === "canvas" ? (
              <div className="relative w-full overflow-hidden rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)]" style={{ aspectRatio: "3 / 2" }}>
                <Image
                  src="/product-tiles/plain-canvas.png"
                  alt="Personalised canvas print"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 600px"
                  priority
                />
              </div>
            ) : mockupProductType === "mug" ? (
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
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    selectedProduct.id === prod.id
                      ? "bg-terracotta border-terracotta text-white shadow-warm-sm"
                      : "bg-cream border-charcoal/15 text-charcoal hover:bg-[#F5EDE0] hover:border-terracotta/40"
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


        </div>
      </div>
    </section>

    {/* ── Reactive content sections ── */}
    {(() => {
      const content = PRODUCT_CONTENT[selectedProduct.id];
      if (!content) return null;
      return (
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">
          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-charcoal mb-6">How It Works</h2>
            <ol className="space-y-4">
              {content.howItWorks.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5EDE0] flex items-center justify-center text-sm font-black text-charcoal">{i + 1}</span>
                  <div>
                    <p className="font-bold text-charcoal">{step.title}</p>
                    <p className="text-charcoal/60 text-sm mt-0.5">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* About */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-charcoal mb-4">{content.aboutTitle}</h2>
            <p className="text-charcoal/70 leading-relaxed">{content.about}</p>
          </section>

          {/* Perfect For */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-charcoal mb-4">Perfect For</h2>
            <ul className="flex flex-wrap gap-2">
              {content.perfectFor.map((occasion) => (
                <li key={occasion} className="rounded-full border border-charcoal/15 px-4 py-1.5 text-sm font-semibold text-charcoal/70">{occasion}</li>
              ))}
            </ul>
          </section>

          {/* Delivery */}
          <section className="mb-12 rounded-2xl bg-[#F5EDE0] p-4 sm:p-6">
            <h2 className="text-xl font-black text-charcoal mb-3">Delivery Information</h2>
            <ul className="space-y-2 text-sm text-charcoal/70">
              <li>✓ UK standard delivery: 5–8 business days</li>
              <li>✓ US delivery: 7–12 business days</li>
              <li>✓ Free shipping on orders over £75 (UK) / $75 (US)</li>
              <li>✓ 30-day returns on all orders</li>
              <li>✓ Order tracking included with every shipment</li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-black text-charcoal mb-6">Common Questions</h2>
            <div className="space-y-6">
              {content.faqs.map((faq, i) => (
                <div key={i} className="border-b border-charcoal/10 pb-6">
                  <h3 className="font-bold text-charcoal mb-2">{faq.q}</h3>
                  <p className="text-charcoal/65 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related links */}
          <section>
            <h2 className="text-xl font-black text-charcoal mb-4">Explore More</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/create" className="w-full rounded-xl px-5 py-2.5 text-center text-sm font-bold text-white sm:w-auto btn-primary-sheen">Design yours now</Link>
              <Link href="/shop" className="w-full rounded-xl border border-charcoal/15 px-5 py-2.5 text-center text-sm font-bold text-charcoal hover:bg-[#F5EDE0] sm:w-auto">Browse all products</Link>
              <Link href="/gift-ideas" className="w-full rounded-xl border border-charcoal/15 px-5 py-2.5 text-center text-sm font-bold text-charcoal hover:bg-[#F5EDE0] sm:w-auto">Gift ideas by occasion</Link>
            </div>
          </section>
        </div>
      );
    })()}
  </>
  );
}
