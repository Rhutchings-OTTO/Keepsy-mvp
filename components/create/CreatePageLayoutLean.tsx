"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Zap, Upload, X, RefreshCcw, ArrowRight, Shirt, Coffee, CreditCard, Layout, Star } from "lucide-react";
import { MagicpathFrame } from "@/components/skin/magicpath/MagicpathFrame";
import { PromptHelperCollapsible } from "./PromptHelperCollapsible";
import { IdeasForYou } from "./IdeasForYou";
import { Carousel } from "@/components/ui/Carousel";
import { GenerationSafetyNotice } from "@/components/safety/GenerationSafetyNotice";
import { SizeAndMeasurements } from "@/components/products/SizeAndMeasurements";
import { revealUp } from "@/lib/motion";
import type { Region } from "@/lib/region";

const PRODUCTS = [
  { type: "tshirt" as const, Icon: Shirt, label: "T-Shirts" },
  { type: "mug" as const, Icon: Coffee, label: "Mugs" },
  { type: "card" as const, Icon: CreditCard, label: "Cards" },
  { type: "hoodie" as const, Icon: Layout, label: "Hoodies" },
];

const CREATOR_TESTIMONIALS = [
  { name: "Sarah J.", quote: "The AI generated exactly what I was looking for! The t-shirt quality is superb.", initials: "SJ" },
  { name: "Marcus L.", quote: "Uploaded a photo of my dog and the AI turned it into a masterpiece on a mug.", initials: "ML" },
  { name: "Elena R.", quote: "Fast shipping and beautiful packaging. Will definitely order again.", initials: "ER" },
];

const fadeInUp = revealUp;

export type CreatePageLayoutLeanProps = {
  region: Region;
  isMagicpathSkin: boolean;
  prompt: string;
  setPrompt: (v: string) => void;
  setHasUserTypedPrompt: (v: boolean) => void;
  uploadedImage: string | null;
  uploadedFileName: string | null;
  generationError: string | null;
  generationContentBlock: { title: string; message: string; suggestions: string[] } | null;
  generationRewriteApplied?: { originalPreview: string; safePreview: string } | null;
  onSuggestionClick?: (suggestion: string) => void;
  checkoutStatus: "success" | "canceled" | null;
  isBusy: boolean;
  onGenerate: () => void;
  onUploadFile: (file: File) => void;
  onClearUploadedImage: (e: React.MouseEvent) => void;
  onProductSelect: (type: "tshirt" | "mug" | "card" | "hoodie") => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedProductType?: "tshirt" | "mug" | "card" | "hoodie";
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

  const handleChipPrompt = (nextPrompt: string) => {
    if (!prompt.trim()) {
      setPrompt(nextPrompt);
      setPendingReplace(null);
      return;
    }
    setPendingReplace(nextPrompt);
  };

  const handleReplaceConfirm = () => {
    if (pendingReplace) {
      setPrompt(pendingReplace);
      setPendingReplace(null);
    }
  };

  const handleReplaceCancel = () => setPendingReplace(null);

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
      className="flex flex-col items-center text-center mt-10 max-w-3xl mx-auto"
    >
      <motion.div
        variants={fadeInUp}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 text-black/70 text-xs font-extrabold uppercase tracking-wider mb-6"
      >
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
          <Zap size={14} />
        </motion.div>
        AI Gift Maker
      </motion.div>

      <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black mb-6 leading-[1.05]">
        Imagine it. Generate it.
        <br />
        <motion.span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)", backgroundSize: "200% auto" }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          Cherish it.
        </motion.span>
      </motion.h1>

      <motion.p variants={fadeInUp} className="text-lg text-black/55 mb-8 max-w-2xl leading-relaxed">
        Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
      </motion.p>

      {/* B) PRIMARY CREATION PANEL - TOP */}
      <motion.div variants={fadeInUp} className="w-full">
        <MagicpathFrame enabled={isMagicpathSkin}>
          <div
            className={`relative p-4 flex flex-col gap-4 border ${
              isMagicpathSkin
                ? "rounded-[2rem] border-white/60 bg-white/35 shadow-[0_16px_48px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
                : "rounded-2xl border-black/5 bg-white shadow-xl"
            }`}
          >
            <div className="inline-flex rounded-2xl border border-black/10 bg-[#F9F4EE] p-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={createMode === "describe"}
                onClick={() => setCreateMode("describe")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition min-h-[44px] ${
                  createMode === "describe" ? "bg-white text-black shadow-sm" : "text-black/60"
                }`}
              >
                Describe
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={createMode === "upload"}
                onClick={() => setCreateMode("upload")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition min-h-[44px] ${
                  createMode === "upload" ? "bg-white text-black shadow-sm" : "text-black/60"
                }`}
              >
                Upload a photo
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setHasUserTypedPrompt(true);
                }}
                placeholder={uploadedImage ? "Describe how you'd like to transform this photo…" : "Describe your gift image…"}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-base font-semibold text-black placeholder:text-black/40"
                aria-label="Describe your gift idea"
              />

              {createMode === "upload" && (
                <div className="rounded-2xl border-2 border-dashed border-black/15 bg-[#FBF8F4] p-4">
                  <input
                    ref={fileInputRef as React.RefObject<HTMLInputElement>}
                    id="create-upload-input"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload photo"
                  />
                  <label
                    htmlFor="create-upload-input"
                    className="flex cursor-pointer flex-col items-center gap-2 py-2"
                  >
                    <Upload size={24} className="text-black/50" />
                    <span className="text-sm font-semibold text-black/70">Choose a photo to transform</span>
                    <span className="text-xs text-black/50">PNG or JPG, max 5MB</span>
                  </label>
                  {uploadedImage && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                        <Image src={uploadedImage} alt="Uploaded" fill className="object-cover" unoptimized sizes="48px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-black/70">{uploadedFileName || "Photo selected"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={onClearUploadedImage}
                        className="rounded-full p-1.5 text-black/50 hover:bg-black/5 hover:text-red-600"
                        aria-label="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <motion.button
                onClick={onGenerate}
                disabled={(!prompt && !uploadedImage) || isBusy}
                className={`w-full min-h-[52px] rounded-xl px-6 py-4 font-extrabold text-lg text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                  isBusy ? "bg-black/35 cursor-not-allowed" : "bg-black hover:bg-black/90"
                }`}
              >
                {isBusy ? (
                  <>
                    <RefreshCcw className="animate-spin" size={22} />
                    Generating…
                  </>
                ) : (
                  <>
                    Generate design <ArrowRight size={22} />
                  </>
                )}
              </motion.button>
            </div>

            <p className="text-xs font-semibold text-black/50">Takes ~10–20 seconds. You can edit after.</p>

            <GenerationSafetyNotice
              hardBlock={generationContentBlock ? { type: "block", ...generationContentBlock } : null}
              rewriteApplied={generationRewriteApplied ? { type: "rewrite", ...generationRewriteApplied } : null}
              error={generationContentBlock ? null : generationError}
              onSuggestionClick={onSuggestionClick}
            />
            <AnimatePresence>
              {checkoutStatus === "success" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  Payment complete. Your order is confirmed.
                </motion.p>
              )}
              {checkoutStatus === "canceled" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                >
                  Checkout canceled. Your design is saved here so you can continue anytime.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </MagicpathFrame>
      </motion.div>

      {/* C) PROMPT HELPER - COLLAPSIBLE */}
      <motion.div variants={fadeInUp} className="w-full">
        <PromptHelperCollapsible onUsePrompt={handleUsePrompt} />
      </motion.div>

      {/* D) IDEAS FOR YOU - REGION-AWARE */}
      <motion.div variants={fadeInUp} className="w-full">
        <IdeasForYou
          region={region}
          onUsePrompt={handleChipPrompt}
          onReplaceConfirm={handleReplaceConfirm}
          onReplaceCancel={handleReplaceCancel}
          pendingReplace={pendingReplace}
        />
      </motion.div>

      {/* E) PRODUCT PICKER */}
      <motion.div variants={fadeInUp} className="mt-10 w-full">
        <p className="text-sm font-black uppercase tracking-wider text-black/55 mb-4">Choose your item</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PRODUCTS.map(({ type, Icon, label }) => (
            <motion.button
              key={type}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm min-h-[100px]"
              onClick={() => onProductSelect(type)}
            >
              <Icon size={28} className="text-black/70" />
              <span className="font-extrabold text-xs uppercase tracking-widest text-black/80">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* F) SIZE & MEASUREMENTS — when T-shirt or Hoodie selected (before artwork) */}
      {(selectedProductType === "tshirt" || selectedProductType === "hoodie") && (
        <motion.div variants={fadeInUp} className="mt-6 w-full max-w-xl">
          <SizeAndMeasurements
            productType={selectedProductType}
            region={region}
            initialSize="M"
          />
        </motion.div>
      )}

      {/* G) TESTIMONIALS - SINGLE COMPACT */}
      <motion.section variants={fadeInUp} className="mt-14 w-full">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-6">What our creators say</h2>
        <Carousel showArrows showDots>
          {CREATOR_TESTIMONIALS.map((t) => (
            <article key={t.name} className="rounded-2xl border border-black/10 bg-white/80 p-5 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[#7DB9E8]/80 to-[#F8C8DC]/80 text-white font-black flex items-center justify-center border border-white text-sm">
                {t.initials}
              </div>
              <div className="mt-3 flex justify-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="mt-3 text-sm italic text-black/70">&quot;{t.quote}&quot;</p>
              <p className="mt-2 text-lg font-black">{t.name}</p>
            </article>
          ))}
        </Carousel>
      </motion.section>
    </motion.div>
  );
}
