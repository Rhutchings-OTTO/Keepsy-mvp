"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  CreditCard,
  Heart,
  Layout,
  RefreshCcw,
  Shirt,
  Upload,
  X,
  Coffee,
} from "lucide-react";
import { MagicpathFrame } from "@/components/skin/magicpath/MagicpathFrame";
import { PromptHelperCollapsible } from "./PromptHelperCollapsible";
import { IdeasForYou } from "./IdeasForYou";
import BeforeAfterCarousel from "@/components/BeforeAfterCarousel";
import { Carousel } from "@/components/ui/Carousel";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { GenerationSafetyNotice } from "@/components/safety/GenerationSafetyNotice";
import type { Region } from "@/lib/region";

const PRODUCTS = [
  { type: "tshirt" as const, Icon: Shirt, label: "T-shirt", description: "Heavyweight cotton tee with a relaxed fit. Pre-shrunk and built to last — a gift they'll actually wear." },
  { type: "mug" as const, Icon: Coffee, label: "Mug", description: "Classic ceramic mug with your design on both sides. Dishwasher safe and microwave friendly." },
  { type: "card" as const, Icon: CreditCard, label: "Card", description: "Fine art postcard or greeting card pack, printed on premium paper and ready to send." },
  { type: "hoodie" as const, Icon: Layout, label: "Hoodie", description: "Soft, cosy hoodie with a classic fit. A quality feel that makes it a go-to favourite." },
];

const PRODUCT_PREVIEW_IMAGES: Record<(typeof PRODUCTS)[number]["type"], string> = {
  tshirt: "/product-tiles/tee-white.png",
  mug: "/product-tiles/plain-mug-front.png",
  card: "/product-tiles/plain-card.png",
  hoodie: "/product-tiles/hoodie-white.png",
};

const REVIEWS = [
  { name: "Helen", quote: "It felt simple and clear from the first screen.", initials: "H" },
  { name: "Rachel", quote: "The preview made it much easier to trust the final gift.", initials: "R" },
  { name: "Louise", quote: "I liked that it guided me without overwhelming me.", initials: "L" },
];

export type CreatePageLayoutLeanProps = {
  region: Region;
  isMagicpathSkin: boolean;
  prompt: string;
  setPrompt: (v: string) => void;
  setHasUserTypedPrompt: (v: boolean) => void;
  uploadedImage: string | null;
  uploadedFileName: string | null;
  generationError: string | null;
  generationContentBlock: {
    title: string;
    message: string;
    suggestions: string[];
    suggestedPrompt?: string;
    appliedPatches?: Array<{ from: string; to: string }>;
  } | null;
  generationRewriteApplied?: {
    originalPreview: string;
    safePreview: string;
    appliedPatches?: Array<{ from: string; to: string }>;
  } | null;
  onSuggestionClick?: (suggestion: string) => void;
  onUseSuggestedPromptClick?: (prompt: string) => void;
  dailyGenerationsLeft?: number;
  checkoutStatus: "success" | "canceled" | null;
  isBusy: boolean;
  isCompressingImage?: boolean;
  onGenerate: (promptOverride?: string) => void;
  onUploadFile: (file: File) => void;
  onClearUploadedImage: (e: React.MouseEvent) => void;
  onProductSelect: (type: "tshirt" | "mug" | "card" | "hoodie") => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedProductType?: "tshirt" | "mug" | "card" | "hoodie";
  selectedCardSubtype?: string;
  onCardSubtypeSelect?: (subtype: string) => void;
};

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] as const } },
};

export function CreatePageLayoutLean({
  region,
  isMagicpathSkin,
  prompt,
  setPrompt,
  setHasUserTypedPrompt,
  uploadedImage,
  uploadedFileName,
  generationError,
  generationContentBlock,
  generationRewriteApplied,
  onSuggestionClick,
  onUseSuggestedPromptClick,
  dailyGenerationsLeft,
  checkoutStatus,
  isBusy,
  isCompressingImage = false,
  onGenerate,
  onUploadFile,
  onClearUploadedImage,
  onProductSelect,
  fileInputRef,
  selectedProductType,
  selectedCardSubtype = "postcard",
  onCardSubtypeSelect,
}: CreatePageLayoutLeanProps) {
  const [createMode, setCreateMode] = useState<"describe" | "upload">("describe");
  const [pendingReplace, setPendingReplace] = useState<string | null>(null);

  // Local textarea state — isolates keystrokes from parent re-renders.
  // The parent's `prompt` is only updated on blur or on generate.
  const [localPrompt, setLocalPrompt] = useState<string>(
    typeof prompt === "string" ? prompt : ""
  );
  const localPromptRef = useRef(localPrompt);
  localPromptRef.current = localPrompt;

  // Sync inbound prop changes (chips, suggestions, initial query) into local state.
  useEffect(() => {
    setLocalPrompt(typeof prompt === "string" ? prompt : "");
  }, [prompt]);


  // Flush local prompt to parent and pass it as override to onGenerate so
  // the parent handler always has the latest value even before the setState
  // from setPrompt has committed (avoids stale closure on prompt state).
  const handleGenerate = () => {
    const latest = localPromptRef.current;
    setPrompt(latest);
    onGenerate(latest);
  };

  const handleChipPrompt = (nextPrompt: string) => {
    if (!localPrompt.trim()) {
      setLocalPrompt(nextPrompt);
      setPrompt(nextPrompt);
      setPendingReplace(null);
      return;
    }
    setPendingReplace(nextPrompt);
  };

  const handleReplaceConfirm = () => {
    if (!pendingReplace) return;
    setLocalPrompt(pendingReplace);
    setPrompt(pendingReplace);
    setPendingReplace(null);
  };

  const handleUsePrompt = (nextPrompt: string) => {
    setLocalPrompt(nextPrompt);
    setPrompt(nextPrompt);
    setPendingReplace(null);
  };

  const handleAppendStyle = (style: string) => {
    const current = (typeof localPrompt === "string" ? localPrompt : "").trim();
    const next = current ? `${current}, ${style.toLowerCase()} style` : `${style.toLowerCase()} style`;
    setLocalPrompt(next);
    setPrompt(next);
    setHasUserTypedPrompt(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
  };

  return (
    <motion.div
      key="step1"
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, scale: 0.98 }}
      variants={fadeInUp}
      className="mx-auto mt-4 flex max-w-6xl flex-col gap-6 px-4 sm:mt-8 sm:gap-10 sm:px-1"
    >
      <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:gap-8">
        <motion.section variants={fadeInUp} className="max-w-2xl">
          <div
            className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/65"
          >
            <Heart size={14} style={{ color: "var(--color-terracotta)" }} />
            Make a thoughtful personalised gift
          </div>
          <h1 className="mt-4 font-serif text-[clamp(1.9rem,4.6vw,4.4rem)] leading-[1.05] tracking-[-0.04em] text-charcoal sm:mt-5 sm:leading-[1.02]">
            Create something personal in a way that feels easy.
          </h1>
          <p className="mt-4 hidden max-w-xl text-lg leading-8 text-charcoal/60 sm:block">
            Tell us what you want to make, or upload a photo. We&apos;ll turn it into a polished design and show you how it will look before you buy.
          </p>

          <div className="mt-6 hidden gap-3 sm:mt-8 sm:grid sm:grid-cols-3">
            {[
              "Write one simple sentence",
              "Preview your design on a product",
              "Only order if it looks right",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-charcoal/8 bg-white p-4 text-sm leading-6 text-charcoal/65 shadow-[0_8px_20px_-12px_rgba(45,41,38,0.12)]"
              >
                <div
                  className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(196,113,74,0.12)", color: "var(--color-terracotta)" }}
                >
                  <Check size={16} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="w-full">
          <MagicpathFrame enabled={isMagicpathSkin}>
            <div className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-5">
              <div className="inline-flex rounded-lg border border-charcoal/10 bg-[#F5EDE0] p-1">
                <button
                  type="button"
                  onClick={() => setCreateMode("describe")}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${createMode === "describe" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/55"}`}
                >
                  Describe a gift
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode("upload")}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${createMode === "upload" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/55"}`}
                >
                  Use a photo
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-charcoal/60">
                    {createMode === "upload" ? "Describe how you want the photo changed" : "Describe the picture you'd like on your gift"}
                  </span>
                  {createMode !== "upload" && (
                    <>
                      <span className="mb-1 block text-xs text-charcoal/45">
                        This will be the image printed on your hoodie, mug, t-shirt or card. Describe the picture, not the product.
                      </span>
                      <span className="mb-2 block text-xs text-charcoal/45">
                        Add as much or as little detail as you'd like — even a few words is enough to get started.
                      </span>
                    </>
                  )}
                  <textarea
                    value={localPrompt}
                    onChange={(e) => {
                      setLocalPrompt(e.target.value);
                      setHasUserTypedPrompt(true);
                    }}
                    onBlur={() => setPrompt(localPromptRef.current)}
                    placeholder={
                      createMode === "upload"
                        ? "Example: Turn this family photo into a soft watercolor birthday card"
                        : "Example: A golden retriever sitting in a field of sunflowers"
                    }
                    rows={5}
                    className="min-h-[144px] w-full resize-none rounded-xl border border-charcoal/10 bg-white px-4 py-4 text-[16px] leading-7 text-charcoal outline-none placeholder:text-charcoal/35 focus:border-terracotta/40 focus:ring-2 focus:ring-terracotta/15"
                  />
                </label>

                <details className="group rounded-xl border border-charcoal/8 bg-charcoal/[0.02] px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-charcoal/45 select-none">
                    <span>Tips for best results</span>
                    <svg
                      className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </summary>
                  <ul className="mt-3 space-y-1.5 text-xs text-charcoal/40">
                    <li>Avoid brand names &amp; logos (Nike, Disney, etc.)</li>
                    <li>No copyrighted characters (Mickey Mouse, Spider-Man, etc.)</li>
                    <li>Skip celebrity names &amp; likenesses</li>
                    <li>Avoid explicit or offensive content</li>
                    <li>Simple descriptions work best — the more specific you are, the better</li>
                  </ul>
                </details>

                {createMode === "upload" ? (
                  <div
                    className="rounded-xl border border-dashed border-charcoal/20 p-4"
                    style={{ backgroundColor: "#F5EDE0" }}
                  >
                    <input
                      ref={fileInputRef}
                      id="create-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isCompressingImage ? (
                      <div className="flex flex-col items-center gap-2 py-5 text-center">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm animate-pulse" style={{ color: "var(--color-terracotta)" }}>
                          <Upload size={18} />
                        </div>
                        <span className="text-sm font-semibold text-charcoal/70">Optimising your photo…</span>
                      </div>
                    ) : !uploadedImage ? (
                      <label htmlFor="create-upload-input" className="flex cursor-pointer flex-col items-center gap-2 py-5 text-center">
                        <div
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"
                          style={{ color: "var(--color-terracotta)" }}
                        >
                          <Upload size={18} />
                        </div>
                        <span className="text-base font-medium text-charcoal">Choose a photo</span>
                        <span className="text-sm text-charcoal/55">PNG, JPG or WebP — up to 25MB</span>
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl bg-white p-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                          <Image src={uploadedImage} alt="Uploaded" fill className="object-cover" unoptimized sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-charcoal">{uploadedFileName || "Photo selected"}</p>
                          <p className="mt-1 text-xs text-charcoal/55">Ready to transform</p>
                        </div>
                        <button
                          type="button"
                          onClick={onClearUploadedImage}
                          className="rounded-lg p-2 text-charcoal/55 hover:bg-charcoal/5"
                          aria-label="Remove photo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                <MagneticButton
                  onClick={handleGenerate}
                  disabled={(!localPrompt.trim() && !uploadedImage) || isBusy}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold text-white shadow-[0_16px_32px_-20px_rgba(196,113,74,0.45)] disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  {isBusy ? (
                    <>
                      <RefreshCcw className="animate-spin" size={18} />
                      Creating your design...
                    </>
                  ) : (
                    <>
                      Create my design
                      <ArrowRight size={18} />
                    </>
                  )}
                </MagneticButton>

                <p className="text-sm text-charcoal/55">
                  {dailyGenerationsLeft !== undefined
                    ? `${dailyGenerationsLeft} free design${dailyGenerationsLeft === 1 ? "" : "s"} remaining today · 3 edits per design`
                    : "2 free designs per day · 3 edits each to get it just right"}
                </p>

                <GenerationSafetyNotice
                  hardBlock={generationContentBlock ? { type: "block", ...generationContentBlock } : null}
                  rewriteApplied={generationRewriteApplied ? { type: "rewrite", ...generationRewriteApplied } : null}
                  error={generationContentBlock ? null : generationError}
                  onSuggestionClick={onSuggestionClick}
                  onUseSuggestedPromptClick={onUseSuggestedPromptClick}
                />

                <AnimatePresence>
                  {checkoutStatus === "success" ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="rounded-xl border border-charcoal/10 px-4 py-3 text-sm font-medium text-charcoal"
                      style={{ backgroundColor: "#F5EDE0" }}
                    >
                      Payment complete. Your order is confirmed.
                    </motion.p>
                  ) : null}
                  {checkoutStatus === "canceled" ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="rounded-xl border border-charcoal/10 px-4 py-3 text-sm font-medium"
                      style={{ backgroundColor: "#FDF6EE", color: "var(--color-terracotta)" }}
                    >
                      Checkout canceled. Your design is still here whenever you want to continue.
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </MagicpathFrame>
        </motion.section>
      </div>

      <motion.section variants={fadeInUp}>
        {/* Gift ideas — always visible */}
        <div className="mt-3 grid gap-4 sm:mt-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/45">Need ideas?</p>
            <PromptHelperCollapsible onUsePrompt={handleUsePrompt} />
          </div>
          <div className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] sm:p-5">
            <IdeasForYou
              region={region}
              onUsePrompt={handleChipPrompt}
              onAppendStyle={handleAppendStyle}
              onReplaceConfirm={handleReplaceConfirm}
              onReplaceCancel={() => setPendingReplace(null)}
              pendingReplace={pendingReplace}
            />
          </div>
        </div>
      </motion.section>

      <motion.section variants={fadeInUp}>
        <BeforeAfterCarousel region={region} />
      </motion.section>

      <motion.section variants={fadeInUp}>
        <div className="rounded-2xl border border-charcoal/8 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/45">Choose your product</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map(({ type, Icon, label, description }) => (
              <motion.button
                key={type}
                type="button"
                onClick={() => onProductSelect(type)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="rounded-xl border border-charcoal/10 bg-[#F5EDE0] p-4 text-left text-charcoal transition sm:p-5 pointer-events-none md:pointer-events-auto"
              >
                <div className="relative mb-4 overflow-hidden rounded-xl border border-charcoal/8 bg-white">
                  <Image
                    src={PRODUCT_PREVIEW_IMAGES[type]}
                    alt={`${label} preview`}
                    width={240}
                    height={160}
                    className="h-24 w-full object-contain p-2"
                  />
                </div>
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(196,113,74,0.12)", color: "var(--color-terracotta)" }}
                >
                  <Icon size={20} />
                </div>
                <p className="mt-4 text-lg font-semibold text-charcoal">
                  {label}
                </p>
                <p className="mt-2 text-xs leading-snug text-charcoal/55">
                  {description}
                </p>
              </motion.button>
            ))}
          </div>
          {/* Card sub-type selector — shown when the Card product is selected */}
          <AnimatePresence>
            {selectedProductType === "card" && onCardSubtypeSelect && (
              <motion.div
                key="card-subtype"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-4 rounded-xl border border-terracotta/20 bg-terracotta/5 p-4"
              >
                {region === "US" ? (
                  <>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/50">
                      How many cards?
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          { value: "uscard_1",  label: "1 card",    price: "$9.99",  desc: "Perfect for sending to one special person." },
                          { value: "uscard_10", label: "10 cards",  price: "$29.99", desc: "Great for sharing with close friends and family." },
                          { value: "uscard_30", label: "30 cards",  price: "$59.99", desc: "Ideal for a larger celebration or event." },
                          { value: "uscard_50", label: "50 cards",  price: "$89.99", desc: "Best value — perfect for big occasions." },
                        ] as const
                      ).map(({ value, label, price, desc }) => {
                        const active = selectedCardSubtype === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onCardSubtypeSelect(value)}
                            className={`rounded-xl border p-3 text-left transition ${
                              active
                                ? "border-terracotta bg-terracotta text-white shadow-[0_8px_20px_-10px_rgba(196,113,74,0.4)]"
                                : "border-charcoal/10 bg-white text-charcoal hover:border-terracotta/40"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${active ? "text-white" : "text-charcoal"}`}>
                              {label}
                            </p>
                            <p className={`mt-0.5 text-xs font-medium ${active ? "text-white/80" : "text-terracotta"}`}>
                              {price}
                            </p>
                            <p className={`mt-1 text-xs leading-5 ${active ? "text-white/70" : "text-charcoal/50"}`}>
                              {desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/50">
                      Choose card type
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          {
                            value: "postcard",
                            label: "Postcard",
                            price: "£6.99",
                            desc: "Premium fine art postcard on thick 280gsm giclée paper with a glossy finish.",
                          },
                          {
                            value: "cardpack",
                            label: "Greeting Cards (7 pack)",
                            price: "£29.99",
                            desc: "7 beautifully printed portrait cards on bright white matte paper. Each one comes with a craft paper envelope.",
                          },
                        ] as const
                      ).map(({ value, label, price, desc }) => {
                        const active = selectedCardSubtype === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onCardSubtypeSelect(value)}
                            className={`rounded-xl border p-3 text-left transition ${
                              active
                                ? "border-terracotta bg-terracotta text-white shadow-[0_8px_20px_-10px_rgba(196,113,74,0.4)]"
                                : "border-charcoal/10 bg-white text-charcoal hover:border-terracotta/40"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${active ? "text-white" : "text-charcoal"}`}>
                              {label}
                            </p>
                            <p className={`mt-0.5 text-xs font-medium ${active ? "text-white/80" : "text-terracotta"}`}>
                              {price}
                            </p>
                            <p className={`mt-1 text-xs leading-5 ${active ? "text-white/70" : "text-charcoal/50"}`}>
                              {desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.section>

      <motion.section variants={fadeInUp} className="hidden md:block rounded-2xl border border-charcoal/8 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] sm:p-6">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/45">Customer feedback</p>
          <h2 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">Designed to feel reassuring, not confusing.</h2>
        </div>
        <div className="mt-6">
          <Carousel showArrows showDots>
            {REVIEWS.map((review) => (
              <article key={review.name} className="rounded-2xl bg-[#F5EDE0] p-6 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  {review.initials}
                </div>
                <p className="mt-4 text-base leading-7 text-charcoal/70">&quot;{review.quote}&quot;</p>
                <p className="mt-4 text-sm font-semibold text-charcoal/55">{review.name}</p>
              </article>
            ))}
          </Carousel>
        </div>
      </motion.section>
    </motion.div>
  );
}
