"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLenis } from "lenis/react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MockupRenderer } from "@/components/MockupRenderer";
import dynamic from "next/dynamic";
import { GenerationLoadingOverlay } from "@/components/GenerationLoadingOverlay";
import TrustBar from "@/components/TrustBar";
const CheckoutSummaryEnhancer = dynamic(
  () => import("@/components/CheckoutSummaryEnhancer"),
  { ssr: false }
);
import UpsellDrawer from "@/components/UpsellDrawer";
import GiftAssistantWidget from "@/components/GiftAssistantWidget";
import { CreatePageLayoutLean } from "@/components/create/CreatePageLayoutLean";
import { DesignConfirmation } from "@/components/generation/DesignConfirmation";
import { SizeGuideDrawer } from "@/components/products/SizeGuideDrawer";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Reveal } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { KineticHeading } from "@/components/motion/KineticHeading";
import PersonalisedStoryCopy from "@/components/PersonalisedStoryCopy";
import MagicpathBackground from "@/components/skin/magicpath/MagicpathBackground";
import { useGeneration } from "@/context/GenerationContext";
import { FF } from "@/lib/featureFlags";
import { getProductPreviewHref } from "@/lib/routes";
import { motionTransition, softScaleIn } from "@/lib/motion";
import { getRegion, type Region } from "@/lib/region";
import {
  setInitialGeneration,
  applyRefinementResult,
  addOriginalPhoto,
  selectNode,
  canRefine,
  getRefinementsLeft,
  hasActiveSession,
  getCreateSessionSnapshot,
} from "@/lib/store/createSession";
import { addToDesignVault } from "@/lib/store/designVault";
import { useCreateSession } from "@/lib/store/useCreateSession";
import { DesignHistoryPanel } from "@/components/create/DesignHistoryPanel";
import { SizeQuantityPicker, totalQuantity, type SizeQuantities } from "@/components/create/SizeQuantityPicker";
import { PrintQualityBadge } from "@/components/create/PrintQualityBadge";
import { useCart } from "@/lib/cart/useCart";
import {
  addLines,
  computeTotals,
  linePrice,
  removeFromCart,
  updateQuantity,
  type CartLine,
  type SourceKind,
} from "@/lib/cart/store";
import { startCheckout } from "@/lib/cart/checkoutClient";
import { currencyForRegion, formatMoney, getUnitPrice } from "@/lib/commerce/pricing";
import { getSupportedSizes } from "@/lib/commerce/variants";
import { uploadOriginalPhoto } from "@/lib/uploads/uploadOriginalClient";
import { validateOriginalFile } from "@/lib/uploads/originalPhoto";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";
import {
  PRODUCT_LIST,
  PRODUCT_CATALOG_IDS,
  getColorName,
  type Product,
  type ProductType,
  type ApparelSize,
} from "@/lib/products";
import { CanvasMockup } from "@/components/canvas/CanvasMockup";
import { GreetingCardMockup } from "@/components/mockups/GreetingCardMockup";
import { CanvasSizeSelector } from "@/components/canvas/CanvasSizeSelector";
import { CanvasCropTool } from "@/components/canvas/CanvasCropTool";
import {
  DEFAULT_CANVAS_SIZE,
  type CanvasSize,
} from "@/lib/canvas/sizes";
import {
  Sparkles,
  X,
  ArrowRight,
  ChevronLeft,
  Plus,
  Heart,
  Check,
  Star,
  Users,
} from "lucide-react";

/** Resize and compress an image file client-side before sending it to the AI.
 *  Max dimension 4096px on the longest side, JPEG quality 0.85.
 *  Used ONLY for the AI path — the "print as it is" path uploads the untouched file. */
function compressImageFile(file: File): Promise<string> {
  const MAX_DIM = 4096;
  const QUALITY = 0.85;
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

type InitialCreateQuery = {
  product?: string;
  prompt?: string;
  style?: string;
  occasion?: string;
  success?: boolean;
  canceled?: boolean;
};

type DesignShape = "square" | "portrait" | "landscape";

type CardSubtype = "postcard" | "cardpack" | "uscard_1" | "uscard_10" | "uscard_30" | "uscard_50";

const US_CARD_NAMES: Record<string, string> = {
  uscard_1: "Greeting Card (1 card)", uscard_10: "Greeting Cards (10 pack)",
  uscard_30: "Greeting Cards (30 pack)", uscard_50: "Greeting Cards (50 pack)",
};

function cardSubtypeName(subtype: CardSubtype): string {
  if (subtype.startsWith("uscard")) return US_CARD_NAMES[subtype] ?? "Greeting Card";
  return subtype === "cardpack" ? "Greeting Cards (7 pack)" : "Fine Art Postcard";
}

function getCatalogId(product: Product): string {
  return PRODUCT_CATALOG_IDS[product.id];
}

function getMockupProductType(type: ProductType): MockupProductType {
  if (type === "tshirt") return "tshirt";
  if (type === "hoodie") return "hoodie";
  if (type === "mug") return "mug";
  if (type === "canvas") return "card"; // canvas uses its own component, this is just a fallback
  return "card";
}

function getMockupColor(hex: string): MockupColor {
  if (hex === "#111827") return "black";
  if (hex === "#2563EB" || hex === "#1e3a8a") return "blue";
  return "white";
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const storageKey = "keepsy_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = window.crypto?.randomUUID?.() || `visitor-${Date.now()}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

const DAILY_GEN_STORAGE_KEY = "keepsy_daily_gens_v1";
const MAX_DAILY_GENS = 2;

function getDailyGensUsed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = window.localStorage.getItem(DAILY_GEN_STORAGE_KEY);
    if (!stored) return 0;
    const parsed = JSON.parse(stored) as { date: string; count: number };
    const today = new Date().toISOString().slice(0, 10);
    return parsed.date === today ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function incrementDailyGens(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().slice(0, 10);
  const current = getDailyGensUsed();
  const next = current + 1;
  window.localStorage.setItem(DAILY_GEN_STORAGE_KEY, JSON.stringify({ date: today, count: next }));
  return next;
}

function getFriendlyGenerationError(error: unknown): string {
  if (!(error instanceof Error)) return "Failed to generate. Please try again.";
  const message = error.message || "Failed to generate. Please try again.";
  const lower = message.toLowerCase();

  if (lower.includes("safety system") || lower.includes("content policy")) {
    return "That image or prompt was blocked by safety checks. Please try a different photo or wording.";
  }
  if (lower.includes("daily generation limit")) {
    return "You reached today's generation limit. Please try again tomorrow.";
  }
  if (lower.includes("circular") || lower.includes("htmlbuttonelement") || lower.includes("converting circular structure")) {
    return "We couldn't send that prompt. Please try again.";
  }
  return message;
}

/** Uses YOUR real API route. Ensures only serializable primitives in payload. */
async function generateViaKeepsyAPI(args: {
  prompt: string;
  sourceImageDataUrl?: string | null;
  sourceImageUrl?: string | null;
  designShape: DesignShape;
  isRefinement?: boolean;
  signal?: AbortSignal;
}) {
  const payloadPrompt = typeof args.prompt === "string" ? args.prompt : "";
  const payload: {
    prompt: string;
    sourceImageDataUrl?: string | null;
    sourceImageUrl?: string | null;
    designShape: DesignShape;
    isRefinement?: boolean;
  } = {
    prompt: payloadPrompt,
    designShape: args.designShape,
    ...(args.isRefinement && { isRefinement: true }),
  };
  if (typeof args.sourceImageUrl === "string" && args.sourceImageUrl.startsWith("https://")) {
    payload.sourceImageUrl = args.sourceImageUrl;
  } else if (typeof args.sourceImageDataUrl === "string" && args.sourceImageDataUrl) {
    payload.sourceImageDataUrl = args.sourceImageDataUrl;
  }

  let body: string;
  try {
    body = JSON.stringify(payload);
  } catch (stringifyErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[gen] Payload stringify failed:", stringifyErr);
    }
    throw new Error("We couldn't send that prompt. Please try again.");
  }

  const res = await fetch("/api/generate-image", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-visitor-id": getVisitorId(),
    },
    signal: args.signal,
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    const errMsg =
      typeof data?.error === "string"
        ? data.error
        : data?.error?.message ?? data?.userMessage ?? "Failed to generate image";
    const error = new Error(errMsg) as Error & {
      status?: number;
      contentBlock?: {
        title: string;
        message: string;
        suggestions: string[];
        suggestedPrompt?: string;
        appliedPatches?: Array<{ from: string; to: string }>;
      };
    };
    error.status = res.status;
    if (data?.suggestions || data?.code) {
      error.contentBlock = {
        title: data.title || "Let's tweak that slightly",
        message: data.userMessage || data.message || data.error,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        suggestedPrompt: data.suggestedPrompt,
        appliedPatches: Array.isArray(data.appliedPatches) ? data.appliedPatches : [],
      };
    }
    throw error;
  }
  const designUrl = typeof data.designUrl === "string" && data.designUrl.startsWith("https://") ? data.designUrl : undefined;
  return {
    imageDataUrl: data.imageDataUrl as string,
    designUrl,
    width: typeof data.width === "number" ? data.width : undefined,
    height: typeof data.height === "number" ? data.height : undefined,
    appliedRewrite: Boolean(data.appliedRewrite),
    appliedPatches: (data.appliedPatches ?? []) as Array<{ from: string; to: string }>,
    patchedPrompt: data.patchedPrompt as string | undefined,
    originalPreview: data.originalPreview as string | undefined,
    safePreview: data.safePreview as string | undefined,
  };
}

type OriginalUploadState = { status: "idle" | "uploading" | "error"; progress: number; error: string | null };

export default function MerchGeneratorPlatform({ initialQuery }: { initialQuery?: InitialCreateQuery }) {
  const createSession = useCreateSession();
  const generationCtx = useGeneration();
  const generatedImage = createSession.currentImageUrl;
  const currentNode = createSession.currentNode;
  const lastGenerationPrompt = createSession.currentPrompt;

  const [view, setView] = useState<"home" | "catalog" | "legal">("home");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [region] = useState<Region>(() => getRegion() ?? "UK");
  const currency = currencyForRegion(region);
  const fmt = useCallback((n: number) => formatMoney(n, currency), [currency]);
  const lenis = useLenis();
  const scrollToTop = useCallback(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

  useEffect(() => {
    scrollToTop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const [prompt, setPromptState] = useState<string>("");

  const setPrompt = (value: unknown) => {
    const s = typeof value === "string" ? value : "";
    setPromptState(s);
  };
  const [isBusy, setIsBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationContentBlock, setGenerationContentBlock] = useState<{
    title: string;
    message: string;
    suggestions: string[];
    suggestedPrompt?: string;
    appliedPatches?: Array<{ from: string; to: string }>;
  } | null>(null);
  const [generationRewriteApplied, setGenerationRewriteApplied] = useState<{
    originalPreview: string;
    safePreview: string;
    appliedPatches?: Array<{ from: string; to: string }>;
  } | null>(null);
  const [refinementSuccess, setRefinementSuccess] = useState(false);
  const [dailyGensUsed, setDailyGensUsed] = useState<number>(0);

  useEffect(() => {
    setDailyGensUsed(getDailyGensUsed());
  }, []);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [originalUpload, setOriginalUpload] = useState<OriginalUploadState>({ status: "idle", progress: 0, error: null });
  const [, setHasUserTypedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateAbortRef = useRef<AbortController | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCT_LIST[2]); // default: mug (unchanged behaviour; ?product= overrides)
  const [selectedColor, setSelectedColor] = useState(PRODUCT_LIST[2].colors?.[0]?.hex ?? "#FFFFFF");
  const [selectedSize, setSelectedSize] = useState<ApparelSize | null>(null);
  const [sizeMode, setSizeMode] = useState<"single" | "multi">("single");
  const [sizeQuantities, setSizeQuantities] = useState<SizeQuantities>({});
  const [selectedCardSubtype, setSelectedCardSubtype] = useState<CardSubtype>(
    region === "US" ? "uscard_1" : "postcard"
  );
  // Canvas-specific state
  const [selectedCanvasSize, setSelectedCanvasSize] = useState<CanvasSize>(DEFAULT_CANVAS_SIZE);
  const [croppedImageDataUrl, setCroppedImageDataUrl] = useState<string | null>(null);
  const [croppedImageHttpsUrl, setCroppedImageHttpsUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [addToCartConfirmation, setAddToCartConfirmation] = useState<string | null>(null);
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const cartItems = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isSecuring, setIsSecuring] = useState(false);
  const [checkoutSuccess] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"success" | "canceled" | null>(null);
  const didApplyInitialQuery = useRef(false);
  const isSecuringRef = useRef(false);

  const cartTotals = useMemo(() => computeTotals(cartItems, currency), [cartItems, currency]);
  const cartCount = cartTotals.itemCount;
  const hasCartItems = cartItems.length > 0;
  const isCanvasProduct = selectedProduct.id === "canvas";
  const isCardProduct   = selectedProduct.id === "card";
  const isApparelProduct = selectedProduct.id === "tshirt" || selectedProduct.id === "hoodie";
  const colorName = getColorName(selectedProduct, selectedColor);
  const supportedSizes = useMemo(
    () => (isApparelProduct ? getSupportedSizes(getCatalogId(selectedProduct), colorName) : []),
    [isApparelProduct, selectedProduct, colorName]
  );

  /** Catalogue id + unit price (region-aware, from the shared catalogue) for the current selection. */
  const currentCatalogId = isCanvasProduct
    ? selectedCanvasSize.catalogId
    : isCardProduct
    ? selectedCardSubtype
    : getCatalogId(selectedProduct);
  const currentUnitPrice = getUnitPrice(currentCatalogId, currency) ?? selectedProduct.basePrice;
  const productFromPrice = (prod: Product): string => {
    if (prod.id === "card") return `from ${fmt(getUnitPrice(region === "US" ? "uscard_1" : "postcard", currency) ?? 6.99)}`;
    if (prod.id === "canvas") return `from ${fmt(getUnitPrice("canvas_10x8", currency) ?? 29.99)}`;
    return fmt(getUnitPrice(getCatalogId(prod), currency) ?? prod.basePrice);
  };

  const currentSourceKind: SourceKind = currentNode?.kind === "original" ? "original" : "ai";
  const currentSourceWidth = currentNode?.width ?? null;
  const currentSourceHeight = currentNode?.height ?? null;

  const multiTotal = totalQuantity(sizeQuantities);
  const sizeSatisfied = !selectedProduct.hasSize || (sizeMode === "multi" ? multiTotal > 0 : Boolean(selectedSize));
  const canAddToCart = Boolean(generatedImage) && sizeSatisfied && !(isCanvasProduct && !croppedImageDataUrl);

  const checkoutTotal = hasCartItems ? cartTotals.subtotal : currentUnitPrice;
  const checkoutShipping = hasCartItems ? cartTotals.shipping : computeTotals([], currency).shipping;
  const checkoutGrandTotal = hasCartItems ? cartTotals.total : currentUnitPrice;
  const checkoutItemDescription = hasCartItems
    ? `${cartCount} item${cartCount === 1 ? "" : "s"}`
    : selectedProduct.name;
  const checkoutPreviewImage = hasCartItems ? cartItems[0]?.imageUrl ?? null : generatedImage;
  const canProceedToCheckout = hasCartItems
    ? cartItems.every((item) => Boolean(item.imageUrl || item.designUrl))
    : canAddToCart;
  const selectedMockupProductType = getMockupProductType(selectedProduct.id);
  const selectedMockupColor = getMockupColor(selectedColor);
  const isMagicpathSkin = FF.magicpathSkin;

  useEffect(() => {
    return () => {
      generateAbortRef.current?.abort();
      generateAbortRef.current = null;
    };
  }, []);

  // Disable browser scroll restoration for this SPA — we control scroll position.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (step === 2 && !generatedImage) setStep(1);
  }, [step, generatedImage]);

  const didRestoreSession = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || didRestoreSession.current) return;
    didRestoreSession.current = true;
    if (hasActiveSession()) setStep(getCreateSessionSnapshot().currentNode?.kind === "original" ? 3 : 2);
  }, []);

  useEffect(() => {
    if (!selectedProduct.hasSize) {
      setSelectedSize(null);
      setSizeQuantities({});
      setSizeMode("single");
      setIsSizeGuideOpen(false);
    }
    // Reset canvas crop when switching away from canvas
    if (selectedProduct.id !== "canvas") {
      setCroppedImageDataUrl(null);
      setCroppedImageHttpsUrl(null);
      setIsCropping(false);
    }
  }, [selectedProduct]);

  // Keep chosen sizes valid for the colour (every colour we sell supports the same sizes today,
  // but the blueprint maps are the source of truth).
  useEffect(() => {
    if (!isApparelProduct) return;
    if (selectedSize && !supportedSizes.includes(selectedSize)) setSelectedSize(null);
    setSizeQuantities((prev) => {
      const next: SizeQuantities = {};
      for (const [size, qty] of Object.entries(prev)) if (supportedSizes.includes(size)) next[size] = qty;
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [isApparelProduct, supportedSizes, selectedSize]);

  useEffect(() => {
    if (!addToCartConfirmation) return;
    const t = setTimeout(() => setAddToCartConfirmation(null), 3000);
    return () => clearTimeout(t);
  }, [addToCartConfirmation]);

  useEffect(() => {
    if (!saveConfirmation) return;
    const t = setTimeout(() => setSaveConfirmation(null), 3000);
    return () => clearTimeout(t);
  }, [saveConfirmation]);

  useEffect(() => {
    if (!initialQuery || didApplyInitialQuery.current) return;
    didApplyInitialQuery.current = true;

    const normalizedProduct = initialQuery.product?.toLowerCase();
    const catalogToProduct: Record<string, ProductType> = {
      tee: "tshirt",
      tshirt: "tshirt",
      "t-shirt": "tshirt",
      mug: "mug",
      card: "card",
      postcard: "card",
      cardpack: "card",
      uscard_1: "card",
      uscard_10: "card",
      uscard_30: "card",
      uscard_50: "card",
      hoodie: "hoodie",
      canvas: "canvas",
    };
    const productType = normalizedProduct ? catalogToProduct[normalizedProduct] : null;
    const mappedProduct = productType ? PRODUCT_LIST.find((p) => p.id === productType) ?? null : null;

    if (mappedProduct) {
      setSelectedProduct(mappedProduct);
      setSelectedColor(mappedProduct.colors?.[0]?.hex ?? "#FFFFFF");
    }
    if (normalizedProduct === "postcard") setSelectedCardSubtype("postcard");
    if (normalizedProduct === "cardpack") setSelectedCardSubtype("cardpack");
    if (normalizedProduct?.startsWith("uscard")) setSelectedCardSubtype(normalizedProduct as CardSubtype);

    const promptPrefill = initialQuery.prompt?.trim();
    const style = initialQuery.style?.trim();
    const occasion = initialQuery.occasion?.replace(/-/g, " ").trim();
    if (promptPrefill) {
      setPrompt(promptPrefill);
    } else if (style && occasion) {
      setPrompt(`${style} style artwork for ${occasion}.`);
    } else if (style) {
      setPrompt(`${style} style artwork, gift-ready and print-ready.`);
    }

    if (initialQuery.success) {
      setCheckoutStatus("success");
      setView("home");
      setStep(1);
      setIsCartOpen(false);
    } else if (initialQuery.canceled) {
      setCheckoutStatus("canceled");
    }
  }, [initialQuery]);

  const handleGenerate = async (promptOverride?: unknown) => {
    const safePromptFromState = typeof prompt === "string" ? prompt : "";
    const safeOverride = typeof promptOverride === "string" ? promptOverride : undefined;
    const effectivePrompt = safeOverride ?? safePromptFromState;
    if (!effectivePrompt && !uploadedImage) return;
    if (typeof effectivePrompt !== "string") {
      setPrompt("");
      setGenerationError("Something went wrong—please retype your prompt.");
      return;
    }
    if (safeOverride) setPrompt(safeOverride);
    const startedAt = Date.now();
    flushSync(() => {
      setIsGenerating(true);
      setGenerationStartedAt(startedAt);
      generationCtx?.startGeneration();
    });
    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    setGenerationError(null);
    setIsBusy(true);
    try {
      const basePrompt = effectivePrompt || "Create a design from this image.";
      let result: Awaited<ReturnType<typeof generateViaKeepsyAPI>> | null = null;
      const maxAttempts = 2;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          result = await generateViaKeepsyAPI({
            prompt: basePrompt,
            sourceImageDataUrl: uploadedImage,
            designShape: "square",
            signal: controller.signal,
          });
          break;
        } catch (error) {
          const status = (error as Error & { status?: number })?.status;
          const retryable = status === 429 || status === 503;
          const isLastAttempt = attempt === maxAttempts - 1;
          if (!retryable || isLastAttempt) throw error;
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        }
      }

      if (!result) throw new Error("Failed to generate image");
      setDailyGensUsed(incrementDailyGens());
      generationCtx?.markGenerated();
      // The history tree keeps every earlier image; this becomes a new root design.
      // Pixel size is recorded on the node for honest print-quality feedback.
      setInitialGeneration({
        prompt: basePrompt,
        imageUrl: result.imageDataUrl,
        designUrl: result.designUrl,
        width: result.width,
        height: result.height,
      });
      addToDesignVault({
        imageUrl: result.designUrl ?? result.imageDataUrl,
        designUrl: result.designUrl,
        prompt: basePrompt,
      });
      setGenerationError(null);
      setGenerationContentBlock(null);
      setGenerationRewriteApplied(
        result.appliedRewrite
          ? {
              originalPreview: result.originalPreview ?? "",
              safePreview: result.safePreview ?? result.patchedPrompt ?? "",
              appliedPatches: result.appliedPatches?.length ? result.appliedPatches : undefined,
            }
          : null
      );
      setRefinementSuccess(false);
      setStep(2);
      setView("home");
      scrollToTop();
    } catch (e) {
      console.error(e);
      const aborted = e instanceof Error && e.name === "AbortError";
      const err = e as Error & { contentBlock?: { title: string; message: string; suggestions: string[] } };
      setGenerationContentBlock(err.contentBlock ?? null);
      const errMsg = err.contentBlock?.message ?? getFriendlyGenerationError(e);
      setGenerationError(
        aborted ? "Generation timed out. Please try again." : (typeof errMsg === "string" ? errMsg : String(errMsg))
      );
    } finally {
      clearTimeout(timeout);
      if (generateAbortRef.current === controller) {
        generateAbortRef.current = null;
      }
      setIsGenerating(false);
      setGenerationStartedAt(null);
      generationCtx?.endGeneration();
      setIsBusy(false);
    }
  };

  /** Print the customer's photo exactly as uploaded. Never calls the AI. */
  const handlePrintOriginal = async () => {
    if (!uploadedFile) {
      setOriginalUpload({ status: "error", progress: 0, error: "Choose a photo first." });
      return;
    }
    const validation = validateOriginalFile(uploadedFile);
    if (!validation.ok) {
      setOriginalUpload({ status: "error", progress: 0, error: validation.message });
      return;
    }
    setOriginalUpload({ status: "uploading", progress: 0, error: null });
    setIsBusy(true);
    try {
      const result = await uploadOriginalPhoto(uploadedFile, {
        productId: currentCatalogId,
        size: isCanvasProduct ? selectedCanvasSize.code : selectedSize ?? undefined,
        onProgress: (fraction) => setOriginalUpload({ status: "uploading", progress: fraction, error: null }),
      });
      addOriginalPhoto({
        imageUrl: result.previewUrl,
        designUrl: result.url,
        width: result.width,
        height: result.height,
        fileName: uploadedFile.name,
      });
      addToDesignVault({ imageUrl: result.previewUrl, designUrl: result.url, prompt: `Your photo · ${uploadedFile.name}` });
      setOriginalUpload({ status: "idle", progress: 1, error: null });
      setGenerationError(null);
      setGenerationContentBlock(null);
      setRefinementSuccess(false);
      // No AI step to review — go straight to choosing the product.
      setStep(3);
      setView("home");
      scrollToTop();
    } catch (e) {
      setOriginalUpload({
        status: "error",
        progress: 0,
        error: e instanceof Error ? e.message : "We couldn't upload your photo. Please try again.",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefine = async (refinementText: string) => {
    const trimmed = typeof refinementText === "string" ? refinementText.trim() : "";
    if (!trimmed) return;
    if (!generatedImage || !currentNode) return;
    if (!canRefine()) return;

    const startedAt = Date.now();
    flushSync(() => {
      setIsGenerating(true);
      setGenerationStartedAt(startedAt);
      setGenerationError(null);
      setGenerationContentBlock(null);
      setRefinementSuccess(false);
      generationCtx?.startGeneration();
    });
    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;

    // Edit the CURRENT node's exact image (persisted https URL when available, otherwise the
    // fresh data URL). The prompt describes ONLY the change; the edit endpoint preserves the rest.
    const nextPrompt = `Apply only this change to the image: ${trimmed}. Preserve all other aspects exactly — the composition, style, colours, background, lighting, and all other elements must remain identical.`;
    const sourceUrl = currentNode.designUrl && currentNode.designUrl.startsWith("https://") ? currentNode.designUrl : null;
    const sourceDataUrl = !sourceUrl && currentNode.imageUrl.startsWith("data:") ? currentNode.imageUrl : null;
    if (!sourceUrl && !sourceDataUrl) {
      setGenerationError("This image can't be edited any more — please pick another one from your history or start fresh.");
      setIsGenerating(false);
      setGenerationStartedAt(null);
      generationCtx?.endGeneration();
      return;
    }

    try {
      const result = await generateViaKeepsyAPI({
        prompt: nextPrompt,
        sourceImageUrl: sourceUrl,
        sourceImageDataUrl: sourceDataUrl,
        designShape: "square",
        isRefinement: true,
        signal: controller.signal,
      });

      applyRefinementResult({
        imageUrl: result.imageDataUrl,
        prompt: nextPrompt,
        designUrl: result.designUrl,
        width: result.width,
        height: result.height,
      });
      addToDesignVault({
        imageUrl: result.designUrl ?? result.imageDataUrl,
        designUrl: result.designUrl,
        prompt: nextPrompt,
      });
      setGenerationRewriteApplied(null);
      setRefinementSuccess(true);
      setGenerationError(null);
      scrollToTop();
    } catch (e) {
      // Failure leaves the history untouched and the current selection in place.
      const aborted = e instanceof Error && e.name === "AbortError";
      const err = e as Error & { contentBlock?: { title: string; message: string; suggestions: string[] } };
      setGenerationContentBlock(err.contentBlock ?? null);
      const msg = err.contentBlock?.message ?? getFriendlyGenerationError(e);
      setGenerationError(aborted ? "Update was cancelled." : (typeof msg === "string" ? msg : String(msg)));
    } finally {
      generateAbortRef.current = null;
      setIsGenerating(false);
      setGenerationStartedAt(null);
      generationCtx?.endGeneration();
    }
  };

  const handleSelectHistoryNode = (id: string) => {
    if (isGenerating) return;
    if (selectNode(id)) {
      setGenerationError(null);
      setGenerationContentBlock(null);
      setRefinementSuccess(false);
      // A different image needs a fresh canvas crop.
      setCroppedImageDataUrl(null);
      setCroppedImageHttpsUrl(null);
      setIsCropping(false);
    }
  };

  /** Build the basket lines for the current selection (one per size in multi-size mode). */
  const buildLinesForSelection = (): Omit<CartLine, "id">[] | null => {
    if (!generatedImage || !currentNode) return null;
    if (isCanvasProduct && !croppedImageDataUrl) return null;
    if (!sizeSatisfied) return null;

    const catalogId = currentCatalogId;
    const effectiveImageUrl = isCanvasProduct ? (croppedImageDataUrl ?? generatedImage) : generatedImage;
    const previewUrl = effectiveImageUrl.startsWith("data:") && currentNode.designUrl && !isCanvasProduct
      ? currentNode.designUrl
      : effectiveImageUrl;
    const itemName = isCanvasProduct
      ? `Canvas Print (${selectedCanvasSize.width}×${selectedCanvasSize.height} in)`
      : isCardProduct
      ? cardSubtypeName(selectedCardSubtype)
      : selectedProduct.name;
    const base: Omit<CartLine, "id" | "size" | "quantity"> = {
      productId: catalogId,
      name: itemName,
      color: isApparelProduct ? colorName : undefined,
      imageUrl: previewUrl,
      designUrl: currentNode.designUrl ?? undefined,
      croppedImageUrl: isCanvasProduct ? (croppedImageHttpsUrl ?? undefined) : undefined,
      sourceKind: currentSourceKind,
      sourceWidth: currentSourceWidth ?? undefined,
      sourceHeight: currentSourceHeight ?? undefined,
      designId: currentNode.id,
      unitPrice: currentUnitPrice,
      currency,
    };

    if (isCanvasProduct) return [{ ...base, size: selectedCanvasSize.code, quantity: 1 }];
    if (!selectedProduct.hasSize) return [{ ...base, quantity: 1 }];
    if (sizeMode === "multi") {
      return Object.entries(sizeQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([size, qty]) => ({ ...base, size, quantity: qty }));
    }
    return [{ ...base, size: selectedSize ?? undefined, quantity: 1 }];
  };

  const handleAddToCart = () => {
    if (!generatedImage) {
      setGenerationContentBlock(null);
      setGenerationError("Generate a design or upload a photo before adding an item to cart.");
      setStep(1);
      return;
    }
    const lines = buildLinesForSelection();
    if (!lines || lines.length === 0) {
      setAddToCartConfirmation(null);
      return;
    }
    addLines(lines);
    const total = lines.reduce((s, l) => s + l.quantity, 0);
    const sizeStr = isCanvasProduct
      ? ` – ${selectedCanvasSize.width}×${selectedCanvasSize.height} in`
      : sizeMode === "multi" && selectedProduct.hasSize
      ? ` – ${lines.map((l) => `${l.size}×${l.quantity}`).join(", ")}`
      : (selectedProduct.hasSize && selectedSize ? ` – ${selectedSize}` : "");
    setAddToCartConfirmation(
      `Added ${total > 1 ? `${total} × ` : ""}${isCanvasProduct ? "Canvas Print" : selectedProduct.name}${sizeStr} to your cart`
    );
    setIsCartOpen(true);
    setStep(4);
  };

  const handleSaveDesign = async () => {
    if (!currentNode) return;
    addToDesignVault({
      imageUrl: currentNode.designUrl ?? currentNode.imageUrl,
      designUrl: currentNode.designUrl ?? undefined,
      prompt: currentNode.prompt,
    });
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setSaveConfirmation("Saved on this device. Sign in to keep designs in your account.");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setSaveConfirmation("Saved on this device. Sign in to keep designs in your account.");
      return;
    }
    if (!currentNode.designUrl) {
      setSaveConfirmation("Saved on this device (this image has no permanent copy yet).");
      return;
    }
    try {
      const res = await fetch("/api/account/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: currentNode.designUrl,
          designUrl: currentNode.designUrl,
          prompt: currentNode.prompt,
          sourceKind: currentSourceKind,
          width: currentSourceWidth ?? undefined,
          height: currentSourceHeight ?? undefined,
        }),
      });
      setSaveConfirmation(res.ok ? "Saved to your account." : "Saved on this device — couldn't reach your account just now.");
    } catch {
      setSaveConfirmation("Saved on this device — couldn't reach your account just now.");
    }
  };

  const runCartCheckout = async () => {
    if (cartItems.length === 0) return;
    setCheckoutError(null);
    setIsSecuring(true);
    setIsBusy(true);
    try {
      const { url } = await startCheckout(cartItems, region);
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setCheckoutError(e instanceof Error ? e.message : "Checkout failed. Please try again.");
      setIsSecuring(false);
      setIsBusy(false);
    }
  };

  const runCheckout = async () => {
    if (isSecuringRef.current) return;
    isSecuringRef.current = true;
    try {
      await runCartCheckout();
    } finally {
      isSecuringRef.current = false;
    }
  };

  /**
   * Checkout entry point. "single" mode (nothing in the basket yet) first adds the
   * current selection so add-ons and the server see one consistent basket.
   */
  const requestCheckout = (mode: "single" | "cart") => {
    setCheckoutError(null);
    if (mode === "single") {
      const lines = buildLinesForSelection();
      if (!lines || lines.length === 0) {
        setCheckoutError(selectedProduct.hasSize && !sizeSatisfied ? "Please choose a size first." : "Please finish your design first.");
        return;
      }
      addLines(lines);
    }
    if (!FF.upsells) {
      void runCheckout();
      return;
    }
    setIsCartOpen(false);
    setIsUpsellOpen(true);
  };

  const handleUploadFile = (file: File) => {
    const validation = validateOriginalFile(file);
    if (!validation.ok) {
      setGenerationError(validation.message);
      setOriginalUpload({ status: "idle", progress: 0, error: null });
      return;
    }
    setIsCompressingImage(true);
    setOriginalUpload({ status: "idle", progress: 0, error: null });
    compressImageFile(file)
      .then((dataUrl) => {
        setUploadedImage(dataUrl);
        setUploadedFile(file);
        setUploadedFileName(file.name);
        setGenerationError(null);
        setGenerationContentBlock(null);
      })
      .catch(() => {
        setGenerationError("Could not process this photo — please try a different one.");
      })
      .finally(() => setIsCompressingImage(false));
  };

  const handleDeleteMyData = async () => {
    const email = window.prompt("Optional: enter your email for the deletion confirmation");
    try {
      const response = await fetch("/api/delete-my-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-visitor-id": getVisitorId(),
        },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to submit request.");
      alert("Your delete request has been submitted.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to submit request.");
    }
  };

  const clearUploadedImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(null);
    setUploadedFile(null);
    setUploadedFileName(null);
    setOriginalUpload({ status: "idle", progress: 0, error: null });
    setGenerationError(null);
    setGenerationContentBlock(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const historyPanel = (
    <DesignHistoryPanel
      nodes={createSession.nodes}
      currentNodeId={createSession.currentNodeId}
      onSelect={handleSelectHistoryNode}
      disabled={isGenerating}
      className="self-start"
    />
  );

  return (
    <div
      className="text-charcoal selection:bg-terracotta/20 overflow-x-hidden"
      aria-busy={isGenerating}
    >
      <MagicpathBackground enabled={isMagicpathSkin} />

      <div className={`pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full pt-6`}>
        <AnimatePresence mode="wait">
          {view === "home" && (
            <div className="space-y-20">
              {(() => {
                const currentView: string = view;
                return (
                  <div className="flex gap-2 md:hidden">
                    <button
                      onClick={() => setView("home")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${currentView === "home" ? "border-terracotta bg-terracotta text-white" : "border-charcoal/15 bg-white text-charcoal"}`}
                    >
                      How it works
                    </button>
                    <button
                      onClick={() => setView("catalog")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${currentView === "catalog" ? "border-terracotta bg-terracotta text-white" : "border-charcoal/15 bg-white text-charcoal"}`}
                    >
                      Catalog
                    </button>
                  </div>
                );
              })()}
              {/* STEP 1 - Lean layout */}
              {step === 1 && (
                <CreatePageLayoutLean
                  region={region}
                  isMagicpathSkin={isMagicpathSkin}
                  prompt={prompt}
                  setPrompt={(v) => {
                    setPrompt(v);
                    setGenerationError(null);
                    setGenerationContentBlock(null);
                    setGenerationRewriteApplied(null);
                  }}
                  setHasUserTypedPrompt={setHasUserTypedPrompt}
                  uploadedImage={uploadedImage}
                  uploadedFileName={uploadedFileName}
                  generationError={generationError}
                  generationContentBlock={generationContentBlock}
                  generationRewriteApplied={generationRewriteApplied}
                  onSuggestionClick={(s) => {
                    setGenerationError(null);
                    setGenerationContentBlock(null);
                    handleGenerate(s);
                  }}
                  onUseSuggestedPromptClick={(suggestedPrompt) => {
                    setGenerationError(null);
                    setGenerationContentBlock(null);
                    handleGenerate(suggestedPrompt);
                  }}
                  dailyGenerationsLeft={Math.max(0, MAX_DAILY_GENS - dailyGensUsed)}
                  checkoutStatus={checkoutStatus}
                  isBusy={isBusy}
                  isCompressingImage={isCompressingImage}
                  onGenerate={handleGenerate}
                  onUploadFile={handleUploadFile}
                  onClearUploadedImage={clearUploadedImage}
                  onPrintOriginal={() => void handlePrintOriginal()}
                  originalUpload={originalUpload}
                  onProductSelect={(type) => {
                    const product = PRODUCT_LIST.find((p) => p.id === type);
                    if (!product) return;
                    setSelectedProduct(product);
                    setSelectedColor(product.colors?.[0]?.hex ?? "#FFFFFF");
                  }}
                  fileInputRef={fileInputRef}
                  selectedProductType={selectedProduct.id === "canvas" ? "card" : selectedProduct.id as "tshirt" | "mug" | "card" | "hoodie"}
                  selectedCardSubtype={selectedCardSubtype}
                  onCardSubtypeSelect={(v) => setSelectedCardSubtype(v as CardSubtype)}
                />
              )}

              {/* STEP 2 — Design confirmation (with the history on the left) */}
              {step === 2 && generatedImage && (
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                  {createSession.nodes.length > 1 ? (
                    <div className="md:sticky md:top-24">{historyPanel}</div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <DesignConfirmation
                      generatedImage={generatedImage}
                      isOriginal={currentSourceKind === "original"}
                      region={region}
                      onContinue={() => { setStep(3); scrollToTop(); }}
                      onRefine={handleRefine}
                      onBackToPrompt={() => setStep(1)}
                      onStartFresh={() => {
                        setPrompt(lastGenerationPrompt);
                        setStep(1);
                        setGenerationError(null);
                        setGenerationContentBlock(null);
                      }}
                      isRefining={isGenerating}
                      refinementError={typeof generationError === "string" ? generationError : generationError ? String(generationError) : null}
                      refinementContentBlock={generationContentBlock}
                      refinementRewriteApplied={generationRewriteApplied}
                      onRefinementSuggestionClick={(s) => {
                        setPrompt(s);
                        setStep(1);
                        setGenerationError(null);
                        setGenerationContentBlock(null);
                        void handleGenerate(s);
                      }}
                      refinementSuccess={refinementSuccess}
                      refinementsLeft={getRefinementsLeft()}
                      canRefine={canRefine()}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 — Mockup placement */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]"
                >
                  <div className="sticky top-24 flex flex-col gap-2 md:flex-row md:gap-0">
                    {historyPanel}
                    <div className="w-full min-w-0 md:w-auto md:mx-0 md:flex-1">
                      <div className="rounded-2xl bg-[#FAF9F7] border border-charcoal/8 p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.15)]">
                        {/* Canvas: show crop tool or canvas mockup */}
                        <AnimatePresence mode="sync" initial={false}>
                        {isCanvasProduct && isCropping && generatedImage ? (
                          <motion.div
                            key="crop-tool"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                          <CanvasCropTool
                            imageSrc={generatedImage}
                            canvasSize={selectedCanvasSize}
                            onConfirm={(dataUrl, httpsUrl) => {
                              setCroppedImageDataUrl(dataUrl);
                              setCroppedImageHttpsUrl(httpsUrl);
                              setIsCropping(false);
                            }}
                            onCancel={() => setIsCropping(false)}
                          />
                          </motion.div>
                        ) : isCanvasProduct ? (
                          <motion.div
                            key={`canvas-${selectedCanvasSize.code}-${croppedImageDataUrl ? "crop" : "nocrop"}-${currentNode?.id ?? ""}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <CanvasMockup
                              aspectRatio={selectedCanvasSize.width / selectedCanvasSize.height}
                              imageSrc={croppedImageDataUrl ?? generatedImage}
                            />
                          </motion.div>
                        ) : isCardProduct && region === "US" ? (
                          <motion.div
                            key={`uscard-${selectedCardSubtype}-${currentNode?.id ?? "empty"}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <GreetingCardMockup imageSrc={generatedImage} variant="us" />
                          </motion.div>
                        ) : isCardProduct && selectedCardSubtype === "cardpack" ? (
                          <motion.div
                            key={`cardpack-${currentNode?.id ?? "empty"}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <GreetingCardMockup imageSrc={generatedImage} variant="uk" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key={currentNode?.id ?? "empty-reveal"}
                            initial={FF.dynamicReveal ? "initial" : false}
                            animate={FF.dynamicReveal ? "animate" : false}
                            exit={{ opacity: 0 }}
                            variants={FF.dynamicReveal ? softScaleIn : undefined}
                            transition={motionTransition("slow")}
                          >
                            <MockupRenderer
                              productType={selectedMockupProductType}
                              color={selectedMockupColor}
                              generatedImage={generatedImage}
                              hasArtwork={Boolean(generatedImage || uploadedImage)}
                            />
                          </motion.div>
                        )}
                        </AnimatePresence>
                        {selectedProduct.id === "mug" && (
                          <p className="mt-2 text-center text-[11px] text-charcoal/45">
                            Your design will appear on both sides of the mug
                          </p>
                        )}
                        <div className="mt-3">
                          <PrintQualityBadge
                            productId={currentCatalogId}
                            size={isCanvasProduct ? selectedCanvasSize.code : selectedSize}
                            width={currentSourceWidth}
                            height={currentSourceHeight}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {isCanvasProduct && !isCropping && (
                            <button
                              type="button"
                              onClick={() => setIsCropping(true)}
                              className="flex-1 sm:flex-none min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-terracotta/30 bg-terracotta/8 px-3 py-2 text-xs font-extrabold text-terracotta hover:bg-terracotta/15 transition"
                            >
                              ✂ {croppedImageDataUrl ? "Recrop" : "Set crop"}
                            </button>
                          )}
                          {!isCanvasProduct && (
                            <div className="inline-flex min-h-[44px] items-center rounded-lg border border-charcoal/10 bg-[#F5EDE0] px-3 py-2 text-xs font-extrabold">
                              <span className="inline-flex items-center gap-2 text-charcoal/70">
                                <Sparkles size={14} /> {currentSourceKind === "original" ? "Your photo, printed as it is" : "Real product preview"}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => setStep(currentSourceKind === "original" ? 1 : 2)}
                            className="flex-1 sm:flex-none min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-xs font-extrabold text-charcoal/55 hover:text-charcoal transition"
                          >
                            <ChevronLeft size={16} />
                            Back
                          </button>
                        </div>
                      </div>
                      {FF.beforeAfter && currentSourceKind !== "original" ? (
                        <div className="mt-4">
                          <BeforeAfterSlider beforeSrc={uploadedImage} afterSrc={generatedImage} />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-6 pb-24 md:pb-0">
                    <div className="rounded-2xl bg-white border border-charcoal/8 p-6 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.15)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/40">Customise your gift</p>
                      <KineticHeading as="h2" className="mb-2 mt-3 text-4xl font-black">
                        {isCanvasProduct ? `Canvas Print` : selectedProduct.name}
                      </KineticHeading>
                      <p className="font-semibold text-charcoal/55">{selectedProduct.description}</p>
                    </div>
                    {FF.personalisedStory ? (
                      <PersonalisedStoryCopy region={region} productType={selectedProduct.id as "tshirt" | "hoodie"} />
                    ) : null}

                    <div className="space-y-5 rounded-2xl bg-white border border-charcoal/8 p-5 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
                      <section>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">
                        Select Product
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                          {PRODUCT_LIST.map((prod) => (
                          <motion.button
                            key={prod.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedProduct(prod);
                                setSelectedColor(prod.colors?.[0]?.hex ?? "#FFFFFF");
                            }}
                            className={`rounded-xl border-2 p-4 text-left transition-all ${
                              selectedProduct.id === prod.id
                                ? "bg-white shadow-[0_16px_34px_-24px_rgba(196,113,74,0.5)]"
                                : "border-charcoal/10 bg-[#F5EDE0]"
                            }`}
                            style={selectedProduct.id === prod.id ? { borderColor: "var(--color-terracotta)" } : undefined}
                          >
                            <div className="text-sm font-extrabold text-charcoal">{prod.name}</div>
                            <div className="text-xs mt-1 text-charcoal/55">
                              {prod.id === selectedProduct.id && (prod.id === "card" || prod.id === "canvas")
                                ? fmt(currentUnitPrice)
                                : productFromPrice(prod)}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      </section>

                      {/* Canvas size selector */}
                      {isCanvasProduct && (
                        <section>
                          <div className="mb-4 flex items-center gap-0 rounded-xl bg-[#F5EDE0] px-3 py-2.5 text-[11px] font-semibold text-charcoal/60">
                            <span className="font-extrabold text-charcoal/80">1&nbsp;</span><span>Choose size</span>
                            <span className="mx-1.5 text-charcoal/50">→</span>
                            <span className="font-extrabold text-charcoal/80">2&nbsp;</span><span>Position image</span>
                            <span className="mx-1.5 text-charcoal/50">→</span>
                            <span className="font-extrabold text-charcoal/80">3&nbsp;</span><span>Confirm &amp; preview</span>
                          </div>
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">Canvas Size</h3>
                          <CanvasSizeSelector
                            selected={selectedCanvasSize}
                            onChange={(size) => {
                              if (croppedImageDataUrl && size.code !== selectedCanvasSize.code) {
                                setCroppedImageDataUrl(null);
                                setCroppedImageHttpsUrl(null);
                              }
                              setSelectedCanvasSize(size);
                            }}
                            formatPrice={fmt}
                            region={region}
                          />
                          {generatedImage && !croppedImageDataUrl && (
                            <p className="mt-2 text-xs font-semibold text-terracotta">
                              ✂ Click &ldquo;Set crop&rdquo; on the preview to position your image
                            </p>
                          )}
                          {croppedImageDataUrl && (
                            <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-forest)" }}>
                              ✓ Image cropped — ready to add to cart
                            </p>
                          )}
                        </section>
                      )}

                      {selectedProduct.colors && selectedProduct.colors.length > 1 && (
                        <section>
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">Color</h3>
                          <div className="flex gap-3 flex-wrap">
                            {selectedProduct.colors.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setSelectedColor(c.hex)}
                                className={`w-10 h-10 rounded-full border-2 transition ${
                                  selectedColor === c.hex ? "border-terracotta ring-4 ring-terracotta/20" : "border-charcoal/10 hover:border-charcoal/30"
                                }`}
                                style={{ backgroundColor: c.hex }}
                                aria-pressed={selectedColor === c.hex}
                                aria-label={`${c.name}`}
                              />
                            ))}
                          </div>
                        </section>
                      )}

                      {selectedProduct.hasSize && supportedSizes.length > 0 && (
                        <section>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45">Size</h3>
                            <button
                              type="button"
                              onClick={() => {
                                setSizeMode((m) => (m === "single" ? "multi" : "single"));
                                if (sizeMode === "single" && selectedSize && !sizeQuantities[selectedSize]) {
                                  setSizeQuantities((prev) => ({ ...prev, [selectedSize]: 1 }));
                                }
                              }}
                              aria-pressed={sizeMode === "multi"}
                              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition ${
                                sizeMode === "multi"
                                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                                  : "border-charcoal/15 bg-white text-charcoal/70 hover:bg-charcoal/5"
                              }`}
                              data-size-mode-toggle
                            >
                              <Users size={14} />
                              {sizeMode === "multi" ? "Buying several sizes" : "Buying for several people?"}
                            </button>
                          </div>
                          {sizeMode === "multi" ? (
                            <>
                              <p className="mb-2 text-xs text-charcoal/55">Same design, same colour — choose how many of each size.</p>
                              <SizeQuantityPicker
                                sizes={supportedSizes}
                                quantities={sizeQuantities}
                                onChange={setSizeQuantities}
                                unitPrice={currentUnitPrice}
                                formatPrice={fmt}
                              />
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                              {supportedSizes.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setSelectedSize(size as ApparelSize)}
                                  className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-sm font-bold transition ${
                                    selectedSize === size
                                      ? "bg-terracotta text-white"
                                      : "bg-[#F5EDE0] text-charcoal/80 hover:bg-charcoal/5"
                                  }`}
                                  aria-pressed={selectedSize === size}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsSizeGuideOpen(true)}
                            className="mt-2 text-sm font-semibold text-charcoal/60 hover:text-charcoal underline underline-offset-2"
                          >
                            View size guide
                          </button>
                          {!sizeSatisfied && (
                            <p className="mt-1 text-xs font-medium text-terracotta">
                              {sizeMode === "multi" ? "Add at least one size" : "Please select a size"}
                            </p>
                          )}
                        </section>
                      )}

                      {/* Card sub-type selector */}
                      {isCardProduct && (
                        <section>
                          {region === "US" ? (
                            <>
                              <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">How Many Cards?</h3>
                              <div className="grid grid-cols-2 gap-3">
                                {(
                                  [
                                    { value: "uscard_1",  label: "1 card",   subtitle: "Perfect for sending to one special person." },
                                    { value: "uscard_10", label: "10 cards", subtitle: "Great for sharing with close friends and family." },
                                    { value: "uscard_30", label: "30 cards", subtitle: "Ideal for a larger celebration or event." },
                                    { value: "uscard_50", label: "50 cards", subtitle: "Best value — perfect for big occasions." },
                                  ] as const
                                ).map(({ value, label, subtitle }) => {
                                  const active = selectedCardSubtype === value;
                                  return (
                                    <motion.button
                                      key={value}
                                      type="button"
                                      whileHover={{ y: -1 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setSelectedCardSubtype(value)}
                                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                                        active
                                          ? "bg-white shadow-[0_8px_20px_-10px_rgba(196,113,74,0.4)]"
                                          : "border-charcoal/10 bg-[#F5EDE0]"
                                      }`}
                                      style={active ? { borderColor: "var(--color-terracotta)" } : undefined}
                                    >
                                      <p className="text-sm font-extrabold text-charcoal">{label}</p>
                                      <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-terracotta)" }}>{fmt(getUnitPrice(value, currency) ?? 0)}</p>
                                      <p className="mt-1 text-xs leading-4 text-charcoal/50">{subtitle}</p>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">Card Type</h3>
                              <div className="grid grid-cols-2 gap-3">
                                {(
                                  [
                                    {
                                      value: "postcard" as const,
                                      label: "Postcard",
                                      subtitle: "Premium fine art postcard on thick 280gsm giclée paper with a glossy finish.",
                                    },
                                    {
                                      value: "cardpack" as const,
                                      label: "Greeting Card Pack",
                                      subtitle: "7 beautifully printed portrait cards on bright white matte paper. Each one comes with a craft paper envelope.",
                                    },
                                  ] as const
                                ).map(({ value, label, subtitle }) => {
                                  const active = selectedCardSubtype === value;
                                  return (
                                    <motion.button
                                      key={value}
                                      type="button"
                                      whileHover={{ y: -1 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setSelectedCardSubtype(value)}
                                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                                        active
                                          ? "bg-white shadow-[0_8px_20px_-10px_rgba(196,113,74,0.4)]"
                                          : "border-charcoal/10 bg-[#F5EDE0]"
                                      }`}
                                      style={active ? { borderColor: "var(--color-terracotta)" } : undefined}
                                    >
                                      <p className="text-sm font-extrabold text-charcoal">{label}</p>
                                      <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-terracotta)" }}>{fmt(getUnitPrice(value, currency) ?? 0)}</p>
                                      <p className="mt-1 text-xs leading-4 text-charcoal/50">{subtitle}</p>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </section>
                      )}

                      <section className="border-t border-charcoal/10 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-charcoal/55 font-semibold">
                            {sizeMode === "multi" && selectedProduct.hasSize ? `Subtotal (${multiTotal} ${multiTotal === 1 ? "item" : "items"})` : "Subtotal"}
                          </span>
                          <span className="text-2xl font-black">
                            {fmt(sizeMode === "multi" && selectedProduct.hasSize ? currentUnitPrice * multiTotal : currentUnitPrice)}
                          </span>
                        </div>
                        <section>
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">
                            Add to Cart
                          </h3>
                          {addToCartConfirmation && (
                            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-forest)" }}>{addToCartConfirmation}</p>
                          )}
                          {saveConfirmation && (
                            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-forest)" }}>{saveConfirmation}</p>
                          )}
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddToCart}
                              disabled={!canAddToCart}
                              className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white shadow-[0_8px_20px_-10px_rgba(196,113,74,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ backgroundColor: "var(--color-terracotta)" }}
                              data-add-to-cart
                          >
                            Add to Cart <Plus size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => void handleSaveDesign()}
                            disabled={!currentNode}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal/10 bg-white py-4 font-black text-charcoal disabled:opacity-60"
                          >
                            Save <Heart size={18} className="text-terracotta/70" />
                          </motion.button>
                        </div>
                        </section>
                      </section>
                      </div>
                    </div>
                  {(selectedProduct.id === "tshirt" || selectedProduct.id === "hoodie") && (
                    <SizeGuideDrawer
                      open={isSizeGuideOpen}
                      onClose={() => setIsSizeGuideOpen(false)}
                      productType={selectedProduct.id as "tshirt" | "hoodie"}
                      region={region}
                    />
                  )}

                  {/* Mobile sticky add-to-cart bar */}
                  <div
                    className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-charcoal/10 bg-white px-4 pt-3 shadow-[0_-4px_20px_-8px_rgba(45,41,38,0.12)]"
                    style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
                  >
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      disabled={!canAddToCart}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white shadow-[0_8px_20px_-10px_rgba(196,113,74,0.45)] transition disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: "var(--color-terracotta)" }}
                    >
                      Add to Cart — {fmt(sizeMode === "multi" && selectedProduct.hasSize ? currentUnitPrice * multiTotal : currentUnitPrice)}
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — Checkout */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2"
                >
                  <div className="rounded-2xl bg-white border border-charcoal/8 p-7 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.15)]">
                    <div style={{ color: "var(--color-charcoal)" }}>
                      <KineticHeading as="h2" className="text-3xl font-black mb-4">Checkout</KineticHeading>
                    </div>
                    <p className="font-semibold mb-6" style={{ color: "rgba(45,41,38,0.55)" }}>
                      You&apos;re about to buy: <span style={{ color: "var(--color-charcoal)" }}>{checkoutItemDescription}</span>
                    </p>

                    <MagneticButton
                      onClick={() => requestCheckout(hasCartItems ? "cart" : "single")}
                      disabled={isBusy || !canProceedToCheckout}
                      className="relative w-full overflow-hidden rounded-2xl py-5 text-lg font-black shadow-terra-glow disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: "var(--color-terracotta)", color: "white" }}
                    >
                      <AnimatePresence mode="wait">
                        {checkoutSuccess ? (
                          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                            Order Confirmed! <Check />
                          </motion.div>
                        ) : (
                          <motion.div key="default" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                            {isBusy ? "Securing your Masterpiece…" : `Pay ${fmt(checkoutGrandTotal)}`} <ArrowRight />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </MagneticButton>

                    <p className="mt-3 text-center text-xs text-charcoal/50 font-medium">
                      No account required · Secure checkout
                    </p>
                    <button onClick={() => setStep(3)} className="mt-4 text-sm font-extrabold inline-flex items-center gap-2 hover:opacity-100" style={{ color: "rgba(45,41,38,0.55)" }}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    {checkoutError && (
                      <p role="alert" className="mt-3 rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(196,113,74,0.10)", color: "var(--color-terracotta)" }}>
                        {checkoutError}
                      </p>
                    )}
                    {FF.trustLayer ? (
                      <div className="mt-4">
                        <TrustBar />
                      </div>
                    ) : null}
                    <p className="mt-4 text-xs text-charcoal/45">
                      By placing your order, you agree to our{" "}
                      <button className="underline hover:text-charcoal" onClick={() => setView("legal")}>
                        Terms of Service
                      </button>
                      .
                    </p>
                  </div>

                  <Reveal variant="fadeUp" className="rounded-2xl border border-charcoal/8 bg-white p-7 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
                    <h3 className="text-xl font-black mb-4">Order Summary</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                        {checkoutPreviewImage ? (
                          <Image src={checkoutPreviewImage} className="h-full w-full object-contain p-1.5" alt="thumb" fill unoptimized={checkoutPreviewImage.startsWith("data:")} />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-extrabold">{checkoutItemDescription}</div>
                        <div className="text-sm text-charcoal/55 font-semibold">
                          {hasCartItems
                            ? cartItems.some((l) => l.sourceKind === "original") && cartItems.every((l) => l.sourceKind === "original")
                              ? "Your photos, printed as they are"
                              : "Custom designs made just for you"
                            : currentSourceKind === "original"
                            ? "Your photo, printed as it is"
                            : "Custom AI-generated design"}
                      </div>
                      </div>
                      <div className="ml-auto font-black">{fmt(checkoutTotal)}</div>
                    </div>

                    {hasCartItems ? (
                      <ul className="mt-4 divide-y divide-charcoal/8 text-sm">
                        {cartItems.map((line) => (
                          <li key={line.id} className="flex items-center justify-between gap-3 py-2">
                            <span className="min-w-0 truncate text-charcoal/75">
                              {line.name}
                              {line.size || line.color ? <span className="text-charcoal/45"> · {[line.size, line.color].filter(Boolean).join(" · ")}</span> : null}
                              <span className="text-charcoal/45"> × {line.quantity}</span>
                            </span>
                            <span className="font-semibold text-charcoal">{fmt(linePrice(line, currency) * line.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-6 pt-5 border-t border-charcoal/10 space-y-2 text-sm font-semibold text-charcoal/60">
                      <div className="flex justify-between"><span>Shipping</span><span>{checkoutShipping === 0 ? "FREE" : fmt(checkoutShipping)}</span></div>
                      <div className="flex justify-between text-charcoal font-black text-base pt-2"><span>Total</span><span>{fmt(hasCartItems ? checkoutGrandTotal : checkoutTotal + checkoutShipping)}</span></div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-xs text-charcoal/45 font-semibold">
                      <Star size={14} className="text-gold" /> Gift-ready print & packaging
                    </div>
                    {FF.checkoutUX ? (
                      <div className="mt-4">
                        <CheckoutSummaryEnhancer
                          productName={checkoutItemDescription}
                          priceText={fmt(checkoutTotal)}
                          thumbnailSrc={checkoutPreviewImage}
                        />
                  </div>
                    ) : null}
                  </Reveal>
                </motion.div>
              )}
            </div>
          )}

          {/* Optimistic: Securing overlay — shows immediately on Buy click */}
          <AnimatePresence>
            {isSecuring && (
              <motion.div
                key="securing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-[#FDF6EE]/95"
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-lg font-black text-charcoal">Securing your Masterpiece</p>
                  <p className="mt-2 text-sm font-semibold text-charcoal/60">Redirecting to checkout…</p>
                  <motion.div
                    className="mt-4 mx-auto h-1 w-32 rounded-full bg-terracotta/10 overflow-hidden"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <motion.div
                      className="h-full bg-terracotta/60 rounded-full"
                      animate={{ width: ["0%", "100%", "0%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Catalog */}
          {view === "catalog" && (
            <motion.div key="catalog" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="text-center max-w-2xl mx-auto">
                <KineticHeading className="text-5xl font-black mb-3">Catalog</KineticHeading>
                <p className="text-charcoal/55 font-semibold">Pick your base product, then generate a design.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PRODUCT_LIST.map((p) => (
                  <Link
                    key={p.id}
                    href={getProductPreviewHref(p.id)}
                    className="block text-left rounded-2xl border border-charcoal/8 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] transition hover:shadow-[0_20px_48px_-20px_rgba(45,41,38,0.18)] hover:-translate-y-1"
                  >
                    <div className="text-lg font-black">{p.name}</div>
                    <div className="text-sm text-charcoal/55 font-semibold mt-1">{p.description}</div>
                    <div className="text-sm font-black mt-3">{productFromPrice(p)}</div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {view === "legal" && (
            <motion.div key="legal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
              <KineticHeading className="text-4xl font-black">Terms & Conditions</KineticHeading>
              <section className="space-y-2 text-charcoal/70">
                <KineticHeading as="h2" className="text-xl font-bold text-charcoal">1. Intellectual Property</KineticHeading>
                <p>
                  Designs created on Keepsy remain the property of the creator. By placing an order, you grant Keepsy
                  permission to produce and ship products featuring that design.
                </p>
              </section>
              <section className="space-y-2 text-charcoal/70">
                <KineticHeading as="h2" className="text-xl font-bold text-charcoal">2. Usage Policy</KineticHeading>
                <p>
                  Users are responsible for uploaded and generated content. Content must not violate copyright, trademark, or contain
                  illegal or harmful material.
                </p>
              </section>
              <section className="space-y-2 text-charcoal/70">
                <KineticHeading as="h2" className="text-xl font-bold text-charcoal">3. Payments & Refunds</KineticHeading>
                <p>
                  Payments are processed securely by Stripe. Because products are custom-made, refunds are only offered for damaged or
                  defective items.
                </p>
              </section>
              <button onClick={() => setView("home")} className="inline-flex items-center gap-2 font-bold text-charcoal/70 hover:text-charcoal">
                <ChevronLeft size={16} /> Back to creation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-charcoal/8 bg-white p-6 shadow-[0_0_80px_-26px_rgba(45,41,38,0.25)]"
              aria-label="Your cart"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-charcoal/50 hover:text-charcoal" aria-label="Close cart">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto space-y-4 pr-1">
                {cartItems.length === 0 ? (
                  <div className="rounded-2xl border border-charcoal/8 bg-[#F5EDE0] p-6 text-center">
                    <p className="font-semibold text-charcoal">Your cart is empty</p>
                    <p className="mt-1 text-sm text-charcoal/60">Curating your first design? Add one to get started.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-charcoal/8 bg-white p-3 shadow-[0_8px_20px_-12px_rgba(45,41,38,0.12)]" data-cart-line={item.id}>
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F5EDE0] border border-charcoal/10">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1.5" unoptimized={item.imageUrl.startsWith("data:")} />
                          ) : (
                            <Image src="/keepsy-logo-transparent.png" alt={item.name} fill className="object-contain p-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">{item.name}</div>
                          {(item.size || item.color || item.addonId || item.sourceKind === "original") && (
                            <div className="text-charcoal/55 text-xs mt-0.5">
                              {[item.size, item.color, item.sourceKind === "original" ? "Your photo" : null, item.addonId ? "Add-on" : null].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          <div className="text-charcoal/55 text-sm">{fmt(linePrice(item, currency))}</div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-charcoal/40 hover:text-terracotta shrink-0" aria-label={`Remove ${item.name}`}>
                          <X size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 border border-charcoal/10 rounded-md" aria-label="Decrease quantity">
                            -
                          </button>
                          <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 border border-charcoal/10 rounded-md" aria-label="Increase quantity">
                            +
                          </button>
                        </div>
                        <div className="font-bold">{fmt(linePrice(item, currency) * item.quantity)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t border-charcoal/10">
                <div className="space-y-1 mb-3 text-sm font-semibold">
                  <div className="flex items-center justify-between text-charcoal/55">
                    <span>Subtotal</span>
                    <span>{fmt(cartTotals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-charcoal/55">
                    <span>Shipping</span>
                    <span className={cartTotals.shipping === 0 ? "text-green-600" : ""}>{cartTotals.shipping === 0 ? "FREE" : fmt(cartTotals.shipping)}</span>
                  </div>
                  {cartTotals.amountToFreeShipping > 0 && hasCartItems && (
                    <p className="text-xs text-charcoal/40 text-right">
                      Spend {fmt(cartTotals.amountToFreeShipping)} more for free shipping
                    </p>
                  )}
                  <div className="flex items-center justify-between text-charcoal font-black text-base pt-1 border-t border-charcoal/10">
                    <span>Total</span>
                    <span>{fmt(cartTotals.total)}</span>
                  </div>
                </div>
                <button
                  onClick={() => requestCheckout("cart")}
                  disabled={isBusy || cartItems.length === 0}
                  className="block w-full rounded-xl py-3 text-base font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  {isBusy ? "Securing…" : "Checkout"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {FF.upsells ? (
        <UpsellDrawer
          open={isUpsellOpen}
          region={region}
          onClose={() => {
            setIsUpsellOpen(false);
            setIsCartOpen(true);
          }}
          onNoThanks={() => {
            setIsUpsellOpen(false);
            void runCheckout();
          }}
          onContinue={() => {
            setIsUpsellOpen(false);
            void runCheckout();
          }}
        />
      ) : null}

      {/* Delete My Data — accessible per privacy policy */}
      <div className="px-6 py-4 text-center">
        <button
          type="button"
          onClick={handleDeleteMyData}
          className="text-xs text-charcoal/40 underline underline-offset-2 hover:text-charcoal/70 transition"
        >
          Delete My Data
        </button>
      </div>
      <GenerationLoadingOverlay
        isOpen={isGenerating}
        startedAt={generationStartedAt}
        productType={selectedProduct.id as "tshirt" | "hoodie"}
        hasSourceImage={Boolean(uploadedImage)}
        region={region}
        prompt={prompt}
      />
      {FF.giftAssistant && view === "home" ? (
        <GiftAssistantWidget
          onApplyPrompt={(nextPrompt) => {
            setPrompt(nextPrompt);
            setStep(1);
          }}
        />
      ) : null}
    </div>
  );
}
