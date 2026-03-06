"use client";

import React, { useState } from "react";
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
  { type: "tshirt" as const, Icon: Shirt, label: "T-shirt" },
  { type: "mug" as const, Icon: Coffee, label: "Mug" },
  { type: "card" as const, Icon: CreditCard, label: "Card" },
  { type: "hoodie" as const, Icon: Layout, label: "Hoodie" },
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
  checkoutStatus: "success" | "canceled" | null;
  isBusy: boolean;
  onGenerate: () => void;
  onUploadFile: (file: File) => void;
  onClearUploadedImage: (e: React.MouseEvent) => void;
  onProductSelect: (type: "tshirt" | "mug" | "card" | "hoodie") => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedProductType?: "tshirt" | "mug" | "card" | "hoodie";
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
  checkoutStatus,
  isBusy,
  onGenerate,
  onUploadFile,
  onClearUploadedImage,
  onProductSelect,
  fileInputRef,
  selectedProductType,
}: CreatePageLayoutLeanProps) {
  const [createMode, setCreateMode] = useState<"describe" | "upload">("describe");
  const [pendingReplace, setPendingReplace] = useState<string | null>(null);
  const activeProduct = PRODUCTS.find((product) => product.type === (selectedProductType ?? "tshirt")) ?? PRODUCTS[0];
  const ActiveProductIcon = activeProduct.Icon;

  const handleChipPrompt = (nextPrompt: string) => {
    if (!prompt.trim()) {
      setPrompt(nextPrompt);
      setPendingReplace(null);
      return;
    }
    setPendingReplace(nextPrompt);
  };

  const handleReplaceConfirm = () => {
    if (!pendingReplace) return;
    setPrompt(pendingReplace);
    setPendingReplace(null);
  };

  const handleUsePrompt = (nextPrompt: string) => {
    setPrompt(nextPrompt);
    setPendingReplace(null);
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
      className="mx-auto mt-6 flex max-w-6xl flex-col gap-8 px-1 sm:mt-8 sm:gap-10"
    >
      <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:gap-8">
        <motion.section variants={fadeInUp} className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7cabc] bg-white/80 px-3 py-1.5 text-sm font-medium text-[#665f58]">
            <Heart size={14} className="text-[#a06b55]" />
            Make a thoughtful personalised gift
          </div>
          <h1 className="mt-5 font-serif text-[clamp(2.2rem,4.6vw,4.4rem)] leading-[1.02] tracking-[-0.04em] text-[#1f1b18]">
            Create something personal in a way that feels easy.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#5c5650]">
            Tell us what you want to make, or upload a photo. We’ll turn it into a polished design and show you how it will look before you buy.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              "Write one simple sentence",
              "Preview your design on a product",
              "Only order if it looks right",
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-black/8 bg-white/76 p-4 text-sm leading-6 text-[#564f49] shadow-[0_18px_40px_-32px_rgba(0,0,0,0.3)]">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#efe4d7] text-[#8b6f47]">
                  <Check size={16} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="w-full">
          <MagicpathFrame enabled={isMagicpathSkin}>
            <div className="rounded-[28px] border border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72))] p-4 shadow-[0_30px_70px_-44px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5">
              <div className="inline-flex rounded-full border border-black/10 bg-[#f4ede6] p-1">
                <button
                  type="button"
                  onClick={() => setCreateMode("describe")}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${createMode === "describe" ? "bg-white text-[#1f1b18] shadow-sm" : "text-[#69615a]"}`}
                >
                  Describe a gift
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode("upload")}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${createMode === "upload" ? "bg-white text-[#1f1b18] shadow-sm" : "text-[#69615a]"}`}
                >
                  Use a photo
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5e5650]">
                    {createMode === "upload" ? "Describe how you want the photo changed" : "Describe the gift you want to make"}
                  </span>
                  <textarea
                    value={typeof prompt === "string" ? prompt : ""}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setHasUserTypedPrompt(true);
                    }}
                    placeholder={
                      createMode === "upload"
                        ? "Example: Turn this family photo into a soft watercolor birthday card"
                        : "Example: A warm floral mug design for Mum’s birthday"
                    }
                    rows={5}
                    className="min-h-[144px] w-full resize-none rounded-[22px] border border-black/10 bg-white px-4 py-4 text-base leading-7 text-[#282320] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none placeholder:text-[#9b938c] focus:border-[#c8b6a2]"
                  />
                </label>

                {createMode === "upload" ? (
                  <div className="rounded-[22px] border border-dashed border-[#d8c9b8] bg-[#fcf8f4] p-4">
                    <input
                      ref={fileInputRef}
                      id="create-upload-input"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {!uploadedImage ? (
                      <label htmlFor="create-upload-input" className="flex cursor-pointer flex-col items-center gap-2 py-5 text-center">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#8b6f47] shadow-sm">
                          <Upload size={18} />
                        </div>
                        <span className="text-base font-medium text-[#302a26]">Choose a photo</span>
                        <span className="text-sm text-[#726960]">PNG or JPG, up to 5MB</span>
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 rounded-[18px] bg-white p-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                          <Image src={uploadedImage} alt="Uploaded" fill className="object-cover" unoptimized sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#2d2724]">{uploadedFileName || "Photo selected"}</p>
                          <p className="mt-1 text-xs text-[#716960]">Ready to transform</p>
                        </div>
                        <button
                          type="button"
                          onClick={onClearUploadedImage}
                          className="rounded-full p-2 text-[#6a635c] hover:bg-black/5"
                          aria-label="Remove photo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                <MagneticButton
                  onClick={() => onGenerate()}
                  disabled={(!(typeof prompt === "string" ? prompt : "").trim() && !uploadedImage) || isBusy}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#1f2937] px-6 text-base font-semibold !text-white shadow-[0_20px_36px_-22px_rgba(17,24,39,0.6)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isBusy ? (
                    <>
                      <RefreshCcw className="animate-spin" size={18} />
                      Creating your design...
                    </>
                  ) : (
                    <>
                      Generate preview
                      <ArrowRight size={18} />
                    </>
                  )}
                </MagneticButton>

                <p className="text-sm text-[#736b64]">
                  Most designs are ready in 10 to 20 seconds. You can refine the result afterwards.
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
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                    >
                      Payment complete. Your order is confirmed.
                    </motion.p>
                  ) : null}
                  {checkoutStatus === "canceled" ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
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

      <motion.section variants={fadeInUp} className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[26px] border border-black/8 bg-white/82 p-4 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.3)] sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8b7f74]">Need ideas?</p>
          <PromptHelperCollapsible onUsePrompt={handleUsePrompt} />
        </div>
        <div className="rounded-[26px] border border-black/8 bg-white/82 p-4 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.3)] sm:p-5">
          <IdeasForYou
            region={region}
            onUsePrompt={handleChipPrompt}
            onReplaceConfirm={handleReplaceConfirm}
            onReplaceCancel={() => setPendingReplace(null)}
            pendingReplace={pendingReplace}
          />
        </div>
      </motion.section>

      <motion.section variants={fadeInUp}>
        <BeforeAfterCarousel region={region} />
      </motion.section>

      <motion.section variants={fadeInUp}>
        <div className="rounded-[26px] border border-black/8 bg-white/82 p-5 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.3)] sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8b7f74]">Choose your product</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map(({ type, Icon, label }) => (
              <motion.button
                key={type}
                type="button"
                onClick={() => onProductSelect(type)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className={`rounded-[22px] border p-4 text-left transition sm:p-5 ${
                  selectedProductType === type
                    ? "border-[#1f2937] bg-[#1f2937] text-white shadow-[0_16px_34px_-22px_rgba(17,24,39,0.55)]"
                    : "border-black/10 bg-[#fbf8f4] text-[#2b2521]"
                }`}
              >
                <div className="relative mb-4 overflow-hidden rounded-[1rem] border border-black/8 bg-white/80">
                  <Image
                    src={PRODUCT_PREVIEW_IMAGES[type]}
                    alt={`${label} preview`}
                    width={240}
                    height={160}
                    className="h-24 w-full object-contain p-2"
                  />
                </div>
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${selectedProductType === type ? "bg-white/12 text-white" : "bg-white/80 text-[#8b6f47]"}`}>
                  <Icon size={20} />
                </div>
                <p className={`mt-4 text-lg font-semibold ${selectedProductType === type ? "text-white" : "text-[#241f1c]"}`}>
                  {label}
                </p>
                <p className={`mt-1 text-sm ${selectedProductType === type ? "text-white/75" : "text-[#70675f]"}`}>
                  {selectedProductType === type ? "Selected for your preview" : "Choose this product for your preview"}
                </p>
              </motion.button>
            ))}
          </div>
          <motion.div
            key={activeProduct.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-5 grid gap-4 rounded-[24px] border border-black/8 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(247,242,235,0.92))] p-4 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.28)] sm:p-5 md:grid-cols-[0.8fr_1.2fr]"
          >
            <div className="flex flex-col justify-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe4d7] text-[#8b6f47]">
                <ActiveProductIcon size={20} />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#8b7f74]">Selected preview</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241f1c]">{activeProduct.label}</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#645c55]">
                Pick a different item above and the preview surface updates straight away.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[22px] border border-black/8 bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-4">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.9),transparent_42%),linear-gradient(180deg,rgba(249,244,238,0.1),rgba(232,226,219,0.28))]" />
              <Image
                src={PRODUCT_PREVIEW_IMAGES[activeProduct.type]}
                alt={`${activeProduct.label} large preview`}
                width={560}
                height={400}
                className="relative z-10 h-48 w-full object-contain sm:h-60"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section variants={fadeInUp} className="rounded-[26px] border border-black/8 bg-white/82 p-5 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.3)] sm:p-6">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8b7f74]">Customer feedback</p>
          <h2 className="font-serif text-3xl tracking-[-0.03em] text-[#1f1b18]">Designed to feel reassuring, not confusing.</h2>
        </div>
        <div className="mt-6">
          <Carousel showArrows showDots>
            {REVIEWS.map((review) => (
              <article key={review.name} className="rounded-[26px] bg-[#fbf7f2] p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#efe4d7] text-sm font-semibold text-[#7d6148]">
                  {review.initials}
                </div>
                <p className="mt-4 text-base leading-7 text-[#4d4742]">&quot;{review.quote}&quot;</p>
                <p className="mt-4 text-sm font-semibold text-[#7a7066]">{review.name}</p>
              </article>
            ))}
          </Carousel>
        </div>
      </motion.section>
    </motion.div>
  );
}
