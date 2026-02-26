"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { STYLE_OPTIONS, type ProductType, type StyleOption } from "@/lib/siteConfig";
import { ProductGrid, PRODUCT_CARDS } from "@/components/ProductGrid";
import { PriceSummary } from "@/components/PriceSummary";

type WizardProps = {
  initialStyle?: StyleOption;
  initialProduct?: ProductType;
};

type Draft = {
  photoDataUrl: string | null;
  style: StyleOption | null;
  product: ProductType | null;
  advancedPrompt: string;
  quantity: number;
};

const DRAFT_KEY = "keepsy_create_draft_v1";

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const storageKey = "keepsy_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = window.crypto?.randomUUID?.() || `visitor-${Date.now()}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

export function Wizard({ initialStyle, initialProduct }: WizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleOption | null>(initialStyle ?? null);
  const [product, setProduct] = useState<ProductType | null>(initialProduct ?? null);
  const [advancedPrompt, setAdvancedPrompt] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [includeUpsell, setIncludeUpsell] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Draft;
      if (draft.photoDataUrl) setPhotoDataUrl(draft.photoDataUrl);
      if (draft.style) setStyle(draft.style);
      if (draft.product) setProduct(draft.product);
      if (draft.advancedPrompt) setAdvancedPrompt(draft.advancedPrompt);
      if (draft.quantity) setQuantity(draft.quantity);
    } catch {
      // ignore broken draft JSON
    }
  }, []);

  useEffect(() => {
    const draft: Draft = { photoDataUrl, style, product, advancedPrompt, quantity };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [photoDataUrl, style, product, advancedPrompt, quantity]);

  const productMeta = useMemo(() => PRODUCT_CARDS.find((p) => p.type === product) ?? null, [product]);
  const upsellLabel = product === "mug" ? "Add matching card (+£6)" : "Add matching mug (+£12)";

  const onSelectFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      window.alert("Please upload a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Please upload an image under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoDataUrl(reader.result as string);
      trackEvent("UploadPhoto");
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const generatePreview = async () => {
    if (!style) return;
    setIsGenerating(true);
    try {
      const prompt = `${style}. ${advancedPrompt || "Gift-ready, warm, family-friendly."}`;
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-visitor-id": getVisitorId(),
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not generate your preview right now.");
      setGeneratedImage(data.imageDataUrl as string);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startCheckout = async () => {
    if (!productMeta || !generatedImage) return;
    setIsCheckingOut(true);
    trackEvent("CheckoutStart", { product: productMeta.type });
    try {
      const cartBase = [{ id: productMeta.type, name: productMeta.name, priceGBP: productMeta.price * quantity }];
      const cart = includeUpsell ? [...cartBase, { id: "upsell", name: "Matching add-on", priceGBP: 12 }] : cartBase;
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: { id: productMeta.type, name: productMeta.name, priceGBP: productMeta.price * quantity },
          prompt: `${style ?? ""} ${advancedPrompt}`.trim(),
          imageDataUrl: generatedImage,
          cart,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Checkout failed.");
      window.location.href = data.url as string;
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Checkout failed.");
      setIsCheckingOut(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <h1 className="text-3xl font-black sm:text-4xl">Create your gift</h1>
      <p className="mt-2 text-black/65">Upload photo → Pick a style → Choose product → Delivered</p>

      <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
        {[1, 2, 3, 4].map((s) => (
          <span key={s} className={`rounded-full px-3 py-1 ${step >= s ? "bg-black text-white" : "bg-white text-black/60 border border-black/10"}`}>
            Step {s}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-6 rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
        {step === 1 && (
          <div>
            <label
              htmlFor="photo-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onSelectFile(e.dataTransfer.files?.[0]);
              }}
              className="flex min-h-52 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-black/20 bg-[#F7F1EB] text-center hover:border-black/35"
            >
              <div>
                <p className="font-bold">Drag and drop your photo here</p>
                <p className="text-sm text-black/60">or tap to upload JPG/PNG up to 5MB</p>
              </div>
            </label>
            <input id="photo-upload" type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => onSelectFile(e.target.files?.[0])} />
          </div>
        )}

        {step >= 2 && (
          <div>
            <h2 className="text-xl font-black">Choose a style</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setStyle(option);
                    setStep(3);
                    trackEvent("SelectStyle", { style: option });
                  }}
                  className={`min-h-12 rounded-xl border px-3 py-3 text-left font-semibold ${
                    style === option ? "border-black bg-black text-white" : "border-black/10 bg-[#F7F1EB] text-black/80"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25`}
                >
                  {option}
                </button>
              ))}
            </div>
            {style && (
              <details className="mt-3 rounded-xl border border-black/10 p-3">
                <summary className="cursor-pointer font-semibold">Advanced prompt (optional)</summary>
                <textarea
                  aria-label="Advanced prompt optional"
                  value={advancedPrompt}
                  onChange={(e) => setAdvancedPrompt(e.target.value)}
                  className="mt-2 min-h-20 w-full rounded-lg border border-black/10 p-2"
                  placeholder="Optional: add specific colors, background, mood..."
                />
              </details>
            )}
          </div>
        )}

        {step >= 3 && (
          <div>
            <h2 className="text-xl font-black">Choose product</h2>
            <div className="mt-3">
              <ProductGrid
                selected={product ?? undefined}
                onSelect={(value) => {
                  setProduct(value);
                  setStep(4);
                  trackEvent("SelectProduct", { product: value });
                }}
              />
            </div>
          </div>
        )}

        {step === 4 && productMeta && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#F7F1EB] p-3">
              <h3 className="font-bold">{productMeta.name} preview</h3>
              <div className="mt-3 relative h-64 rounded-xl bg-white">
                {isGenerating ? (
                  <div className="h-full w-full animate-pulse rounded-xl bg-black/5" />
                ) : generatedImage ? (
                  <Image src={generatedImage} alt="Generated gift design preview" fill className="rounded-xl object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-black/55">
                    Preview will appear here.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  trackEvent("StartCreate", { step: 4 });
                  void generatePreview();
                }}
                className="mt-3 min-h-12 w-full rounded-xl bg-black px-4 py-3 font-bold text-white shadow-sm disabled:opacity-50"
                disabled={isGenerating || !style}
              >
                {isGenerating ? "Generating preview..." : "Generate preview"}
              </button>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <label htmlFor="quantity" className="text-sm font-semibold">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded-lg border border-black/10 p-2"
                />
                <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" checked={includeUpsell} onChange={(e) => setIncludeUpsell(e.target.checked)} />
                  {upsellLabel}
                </label>
                <button
                  type="button"
                  onClick={() => window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ photoDataUrl, style, product, advancedPrompt, quantity }))}
                  className="mt-3 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold"
                >
                  Save for later
                </button>
              </div>
              <PriceSummary unitPrice={productMeta.price} quantity={quantity} productLabel={productMeta.name} />
              <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
                <p className="font-bold">4.8/5 rating · 120,000+ gifts created</p>
                <p className="mt-1 text-black/65">Secure checkout · Fast delivery · Satisfaction guarantee · US/UK support</p>
                <p className="mt-2 text-black/65">
                  Need details? <Link href="/shipping" className="underline">Shipping</Link> ·{" "}
                  <Link href="/refunds" className="underline">Refund policy</Link>
                </p>
              </div>
              <button
                type="button"
                onClick={() => void startCheckout()}
                disabled={!generatedImage || isCheckingOut}
                className="min-h-12 w-full rounded-2xl bg-black px-4 py-3 text-lg font-bold text-white shadow-sm disabled:opacity-50"
              >
                {isCheckingOut ? "Redirecting to secure checkout..." : "Checkout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
