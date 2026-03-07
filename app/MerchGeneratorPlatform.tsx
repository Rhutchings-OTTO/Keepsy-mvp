"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import useSWR from "swr";
import { flushSync } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MagneticCard } from "@/components/ui/MagneticCard";
import { MockupRenderer } from "@/components/MockupRenderer";
import dynamic from "next/dynamic";
import { GenerationLoadingOverlay } from "@/components/GenerationLoadingOverlay";
import TrustBar from "@/components/TrustBar";
import GiftingStep from "@/components/GiftingStep";
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
import { MagicpathFrame } from "@/components/skin/magicpath/MagicpathFrame";
import { useConversionFlow } from "@/context/ConversionFlowContext";
import { useGeneration } from "@/context/GenerationContext";
import { FF } from "@/lib/featureFlags";
import { getProductPreviewHref } from "@/lib/routes";
import { motionTransition, softScaleIn } from "@/lib/motion";
import { getRegion, type Region } from "@/lib/region";
import {
  setInitialGeneration,
  applyRefinementResult,
  applyVaultDesign,
  canRefine,
  getRefinementsLeft,
  hasActiveSession,
} from "@/lib/store/createSession";
import { addToDesignVault } from "@/lib/store/designVault";
import { DesignVaultSidebar } from "@/components/DesignVaultSidebar";
import { useCreateSession } from "@/lib/store/useCreateSession";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";
import {
  PRODUCT_LIST,
  PRODUCT_CATALOG_IDS,
  getProductByCatalogId,
  getColorName,
  type Product,
  type ProductType,
  type ApparelSize,
} from "@/lib/products";
import {
  Sparkles,
  ShoppingCart,
  X,
  ArrowRight,
  ChevronLeft,
  Plus,
  Heart,
  Check,
  Star,
} from "lucide-react";

/** Types */
interface CartItem {
  id: string;
  productId: string;
  name: string;
  color?: string;
  size?: ApparelSize;
  imageUrl: string;
  designUrl?: string;
  unitPrice: number;
  quantity: number;
}

type PersistedCartItem = {
  id: string;
  productId: string;
  name: string;
  color?: string;
  size?: ApparelSize;
  imageUrl: string;
  designUrl?: string;
  unitPrice: number;
  quantity: number;
};

type InitialCreateQuery = {
  product?: string;
  prompt?: string;
  style?: string;
  occasion?: string;
  success?: boolean;
  canceled?: boolean;
};

type DesignShape = "square" | "portrait" | "landscape";

const COMMUNITY_DESIGNS_FALLBACK = [
  "/occasion-tiles/christmas-scene.png",
  "/occasion-tiles/thanksgiving-cartoon.png",
  "/occasion-tiles/fourth-july-photo.png",
  "/occasion-tiles/anniversary-watercolor.png",
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GBP_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const CART_STORAGE_KEY = "keepsy_cart_v2";

function gbp(n: number) {
  return GBP_FORMATTER.format(n);
}

function getCatalogId(product: Product): string {
  return PRODUCT_CATALOG_IDS[product.id];
}

function toPersistedCart(cartItems: CartItem[]): PersistedCartItem[] {
  return cartItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    color: item.color,
    size: item.size,
    imageUrl: item.imageUrl,
    designUrl: item.designUrl,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }));
}

function fromPersistedCart(raw: string): CartItem[] {
  const parsed = JSON.parse(raw) as PersistedCartItem[];
  if (!Array.isArray(parsed)) return [];
  const items: CartItem[] = [];
    for (const item of parsed) {
      const catalogProduct = getProductByCatalogId(item.productId);
      if (!catalogProduct) continue;
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) continue;
      const imageUrl = typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : "";
      if (!imageUrl) continue;
      items.push({
        id: item.id,
        productId: item.productId,
        name: item.name,
        ...(item.color && { color: item.color }),
        ...(item.size && { size: item.size }),
        imageUrl,
        ...(typeof item.designUrl === "string" && item.designUrl && { designUrl: item.designUrl }),
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      });
    }
    return items;
}

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

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const storageKey = "keepsy_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = window.crypto?.randomUUID?.() || `visitor-${Date.now()}`;
  window.localStorage.setItem(storageKey, created);
  return created;
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

  if (
    lower.includes("circular") ||
    lower.includes("htmlbuttonelement") ||
    lower.includes("converting circular structure")
  ) {
    return "We couldn't send that prompt. Please try again.";
  }

  return message;
}

/** Uses YOUR real API route. Ensures only serializable primitives in payload. */
async function generateViaKeepsyAPI(args: {
  prompt: string;
  sourceImageDataUrl?: string | null;
  designShape: DesignShape;
  signal?: AbortSignal;
}) {
  const payloadPrompt = typeof args.prompt === "string" ? args.prompt : "";
  const payloadImage =
    typeof args.sourceImageDataUrl === "string" ? args.sourceImageDataUrl : args.sourceImageDataUrl ?? null;
  const payload: { prompt: string; sourceImageDataUrl: string | null; designShape: DesignShape } = {
    prompt: payloadPrompt,
    sourceImageDataUrl: payloadImage,
    designShape: args.designShape,
  };

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
  return {
    imageDataUrl: data.imageDataUrl as string,
    designUrl: typeof data.designUrl === "string" && data.designUrl ? data.designUrl : undefined,
    appliedRewrite: Boolean(data.appliedRewrite),
    appliedPatches: (data.appliedPatches ?? []) as Array<{ from: string; to: string }>,
    patchedPrompt: data.patchedPrompt as string | undefined,
    originalPreview: data.originalPreview as string | undefined,
    safePreview: data.safePreview as string | undefined,
  };
}

/** Uses YOUR real Stripe session route. Passes designUrl and productType for OrderSuccess handshake. */
async function checkoutViaKeepsyAPI(args: {
  cart: CartItem[];
  imageDataUrl: string;
  designUrl?: string | null;
  productType?: string;
}): Promise<string> {
  const primaryDesignUrl = args.designUrl ?? args.cart[0]?.designUrl ?? "";
  const primaryProduct = args.cart[0]?.name ?? args.productType ?? "";

  const payload = {
    currency: "gbp" as const,
    imageDataUrl: args.imageDataUrl ? "1" : undefined,
    designUrl: primaryDesignUrl || undefined,
    productType: primaryProduct,
    cart: args.cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      color: item.color,
      size: item.size,
      imageUrl: item.imageUrl ? "1" : undefined,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
  };

  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: { url?: string; error?: string; message?: string };
  try {
    data = JSON.parse(text);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.error("[checkout] Non-JSON response:", text.slice(0, 200));
    }
    throw new Error("Checkout couldn't start. Please try again.");
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || "Failed to create checkout session";
    throw new Error(typeof msg === "string" ? msg : "Checkout couldn't start. Please try again.");
  }

  const url = data?.url;
  if (!url || typeof url !== "string") {
    throw new Error("Checkout couldn't start. Please try again.");
  }
  return url;
}

export default function MerchGeneratorPlatform({ initialQuery }: { initialQuery?: InitialCreateQuery }) {
  const { state: conversionFlow, updateState: updateConversionFlow } = useConversionFlow();
  const createSession = useCreateSession();
  const generationCtx = useGeneration();
  const generatedImage = createSession.currentImageUrl;
  const lastGenerationPrompt = createSession.currentPrompt;

  const [view, setView] = useState<"home" | "catalog" | "community" | "legal">("home");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [region] = useState<Region>(() => getRegion() ?? "UK");
  const fmt = (n: number) => region === "US" ? USD_FORMATTER.format(n) : GBP_FORMATTER.format(n);

  const [prompt, setPromptState] = useState<string>("");

  const setPrompt = (value: unknown) => {
    const s = typeof value === "string" ? value : "";
    setPromptState(s);
  };
  const [isBusy, setIsBusy] = useState(false);
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

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [, setHasUserTypedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateAbortRef = useRef<AbortController | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCT_LIST[2]); // default: card
  const [selectedColor, setSelectedColor] = useState(PRODUCT_LIST[2].colors?.[0]?.hex ?? "#FFFFFF");
  const [selectedSize, setSelectedSize] = useState<ApparelSize | null>(null);
  const [addToCartConfirmation, setAddToCartConfirmation] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGiftingSkipped, setIsGiftingSkipped] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [pendingCheckoutMode, setPendingCheckoutMode] = useState<"single" | "cart" | null>(null);
  const [isSecuring, setIsSecuring] = useState(false);
  const [checkoutSuccess] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"success" | "canceled" | null>(null);
  const didApplyInitialQuery = useRef(false);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );
  const hasCartItems = cartItems.length > 0;
  const checkoutTotal = hasCartItems ? cartSubtotal : selectedProduct.basePrice;
  const checkoutItemDescription = hasCartItems
    ? `${cartCount} item${cartCount === 1 ? "" : "s"}`
    : selectedProduct.name;
  const checkoutPreviewImage = hasCartItems ? cartItems[0]?.imageUrl ?? null : generatedImage;
  const canProceedToCheckout = hasCartItems
    ? cartItems.length > 0 && cartItems.every((item) => Boolean(item.imageUrl))
    : Boolean(generatedImage) && !(selectedProduct.hasSize && !selectedSize);
  const selectedMockupProductType = getMockupProductType(selectedProduct.id);
  const selectedMockupColor = getMockupColor(selectedColor);
  const isMagicpathSkin = FF.magicpathSkin;

  const { data: communityData } = useSWR<{ designs: string[] }>(
    "/api/community-designs",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600_000 }
  );
  const communityDesigns = communityData?.designs ?? COMMUNITY_DESIGNS_FALLBACK;

  useEffect(() => {
    return () => {
      generateAbortRef.current?.abort();
      generateAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const restored = fromPersistedCart(raw);
      if (restored.length > 0) {
        setCartItems(restored);
      }
    } catch {
      // ignore malformed local cart snapshots
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(toPersistedCart(cartItems)));
    } catch {
      // ignore storage write failures in restricted environments
    }
  }, [cartItems]);

  useEffect(() => {
    if (step === 2 && !generatedImage) setStep(1);
  }, [step, generatedImage]);

  const didRestoreSession = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || didRestoreSession.current) return;
    didRestoreSession.current = true;
    if (hasActiveSession()) setStep(2);
  }, []);

  useEffect(() => {
    if (!selectedProduct.hasSize) {
      setSelectedSize(null);
      setIsSizeGuideOpen(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!addToCartConfirmation) return;
    const t = setTimeout(() => setAddToCartConfirmation(null), 3000);
    return () => clearTimeout(t);
  }, [addToCartConfirmation]);

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
      hoodie: "hoodie",
    };
    const productType = normalizedProduct ? catalogToProduct[normalizedProduct] : null;
    const mappedProduct = productType ? PRODUCT_LIST.find((p) => p.id === productType) ?? null : null;

    if (mappedProduct) {
      setSelectedProduct(mappedProduct);
      setSelectedColor(mappedProduct.colors?.[0]?.hex ?? "#FFFFFF");
    }

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
      let result: {
        imageDataUrl: string;
        designUrl?: string;
        appliedRewrite?: boolean;
        originalPreview?: string;
        safePreview?: string;
        patchedPrompt?: string;
        appliedPatches?: Array<{ from: string; to: string }>;
      } | null = null;
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
      setInitialGeneration({
        prompt: basePrompt,
        imageUrl: result.imageDataUrl,
        designUrl: result.designUrl,
      });
      addToDesignVault({
        imageUrl: result.imageDataUrl,
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

  const handleRefine = async (refinementText: string) => {
    const trimmed = typeof refinementText === "string" ? refinementText.trim() : "";
    if (!trimmed) return;
    if (!generatedImage) return;
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

    const nextPrompt = `${lastGenerationPrompt}\n\nRefinement request: ${trimmed}`;

    try {
      const result = await generateViaKeepsyAPI({
        prompt: nextPrompt,
        sourceImageDataUrl: null,
        designShape: "square",
        signal: controller.signal,
      });

      applyRefinementResult({
        imageUrl: result.imageDataUrl,
        prompt: nextPrompt,
        designUrl: result.designUrl,
      });
      addToDesignVault({
        imageUrl: result.imageDataUrl,
        designUrl: result.designUrl,
        prompt: nextPrompt,
      });
      setGenerationRewriteApplied(null);
      setRefinementSuccess(true);
      setGenerationError(null);
    } catch (e) {
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

  const handleAddToCart = () => {
    if (!generatedImage) {
      setGenerationContentBlock(null);
      setGenerationError("Generate a design before adding an item to cart.");
      setStep(1);
      return;
    }
    const colorName = getColorName(selectedProduct, selectedColor);
    if (selectedProduct.hasSize && !selectedSize) {
      setAddToCartConfirmation(null);
      return;
    }
    const catalogId = getCatalogId(selectedProduct);
    const variantKey = `${catalogId}-${selectedColor}-${selectedSize ?? "na"}-${Date.now()}`;
    const itemId = `item-${variantKey}`;
    const newItem: CartItem = {
      id: itemId,
      productId: catalogId,
      name: selectedProduct.name,
      color: selectedProduct.colors?.length ? colorName : undefined,
      size: selectedProduct.hasSize ? selectedSize ?? undefined : undefined,
      imageUrl: generatedImage,
      designUrl: createSession.currentDesignUrl ?? undefined,
      unitPrice: selectedProduct.basePrice,
      quantity: 1,
    };
    setCartItems((prev) => {
      const sameVariant = prev.find(
        (i) =>
          i.productId === newItem.productId &&
          i.color === newItem.color &&
          i.size === newItem.size &&
          i.imageUrl === newItem.imageUrl
      );
      if (sameVariant) {
        return prev.map((item) =>
          item.id === sameVariant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...newItem, id: `item-${catalogId}-${selectedColor}-${selectedSize ?? "na"}-${Date.now()}` }];
    });
    const sizeStr = selectedProduct.hasSize && selectedSize ? ` – ${selectedSize}` : "";
    setAddToCartConfirmation(`Added ${selectedProduct.name}${sizeStr} – ${colorName} to your cart`);
    setIsCartOpen(true);
    setStep(4);
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAdjustQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const buildSingleCheckoutCart = (): CartItem[] | null => {
    if (!generatedImage) return null;
    if (selectedProduct.hasSize && !selectedSize) return null;
    const catalogId = getCatalogId(selectedProduct);
    const colorName = getColorName(selectedProduct, selectedColor);
    return [
      {
        id: `single-${Date.now()}`,
        productId: catalogId,
        name: selectedProduct.name,
        color: selectedProduct.colors?.length ? colorName : undefined,
        size: selectedProduct.hasSize ? selectedSize ?? undefined : undefined,
        imageUrl: generatedImage,
        designUrl: createSession.currentDesignUrl ?? undefined,
        unitPrice: selectedProduct.basePrice,
        quantity: 1,
      },
    ];
  };

  const handleCheckout = async () => {
    const cart = buildSingleCheckoutCart();
    if (!cart) return;
    setIsSecuring(true);
    setIsBusy(true);
    try {
      const url = await checkoutViaKeepsyAPI({
        cart,
        imageDataUrl: generatedImage!,
        designUrl: createSession.currentDesignUrl,
        productType: selectedProduct.name,
      });
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Checkout failed");
      setIsSecuring(false);
      setIsBusy(false);
    }
  };

  const handleCartCheckout = async () => {
    if (cartItems.length === 0) return;
    if (cartItems.some((item) => !item.imageUrl)) {
      alert("Please remove items missing generated designs before checking out.");
      return;
    }
    const checkoutImage = cartItems[0]?.imageUrl;
    if (!checkoutImage) return;
    setIsSecuring(true);
    setIsBusy(true);
    try {
      const url = await checkoutViaKeepsyAPI({
        cart: cartItems,
        imageDataUrl: checkoutImage,
        designUrl: cartItems[0]?.designUrl,
        productType: cartItems[0]?.name,
      });
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Checkout failed");
      setIsSecuring(false);
      setIsBusy(false);
    }
  };

  const runCheckout = async (mode: "single" | "cart") => {
    if (mode === "cart") {
      await handleCartCheckout();
      return;
    }
    await handleCheckout();
  };

  const requestCheckout = (mode: "single" | "cart") => {
    if (!FF.upsells) {
      void runCheckout(mode);
      return;
    }
    setPendingCheckoutMode(mode);
    setIsUpsellOpen(true);
  };

  const handleUploadFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png"];
    const maxFileSizeBytes = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPG or PNG image.");
      return;
    }
    if (file.size > maxFileSizeBytes) {
      alert("Please upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setUploadedFileName(file.name);
      setGenerationError(null);
      setGenerationContentBlock(null);
    };
    reader.readAsDataURL(file);
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
    setUploadedFileName(null);
    setGenerationError(null);
    setGenerationContentBlock(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


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
                    <button
                      onClick={() => setView("community")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${currentView === "community" ? "border-terracotta bg-terracotta text-white" : "border-charcoal/15 bg-white text-charcoal"}`}
                    >
                      Community
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
                  checkoutStatus={checkoutStatus}
                  isBusy={isBusy}
                  onGenerate={handleGenerate}
                  onUploadFile={handleUploadFile}
                  onClearUploadedImage={clearUploadedImage}
                  onProductSelect={(type) => {
                    const product = PRODUCT_LIST.find((p) => p.id === type);
                    if (!product) return;
                    setSelectedProduct(product);
                    setSelectedColor(product.colors?.[0]?.hex ?? "#FFFFFF");
                  }}
                  fileInputRef={fileInputRef}
                  selectedProductType={selectedProduct.id}
                />
              )}

              {/* STEP 2 — Design confirmation */}
              {step === 2 && generatedImage && (
                <DesignConfirmation
                  generatedImage={generatedImage}
                  region={region}
                  onContinue={() => setStep(3)}
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
                  <div className="sticky top-24 flex gap-0">
                    <DesignVaultSidebar
                      currentImageUrl={generatedImage}
                      onSelectDesign={(entry) => {
                        const src = entry.designUrl || entry.imageUrl;
                        applyVaultDesign({
                          imageUrl: src,
                          designUrl: entry.designUrl ?? null,
                        });
                      }}
                      className="self-start shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl bg-white border border-charcoal/8 p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.15)]">
                        <motion.div
                          key={generatedImage ?? "empty-reveal"}
                          initial={FF.dynamicReveal ? "initial" : false}
                          animate={FF.dynamicReveal ? "animate" : false}
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
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <div className="inline-flex rounded-lg border border-charcoal/10 bg-[#F5EDE0] px-3 py-2 text-xs font-extrabold">
                            <span className="inline-flex items-center gap-2 text-charcoal/70"><Sparkles size={14} /> Real product preview</span>
                          </div>
                          <button
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 text-xs font-extrabold text-charcoal/55 hover:text-charcoal"
                          >
                            <ChevronLeft size={16} />
                            Back
                          </button>
                        </div>
                      </div>
                      {FF.beforeAfter ? (
                        <div className="mt-4">
                          <BeforeAfterSlider beforeSrc={uploadedImage} afterSrc={generatedImage} />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl bg-white border border-charcoal/8 p-6 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.15)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/40">Configure your gift</p>
                      <KineticHeading as="h2" className="mb-2 mt-3 text-4xl font-black">{selectedProduct.name}</KineticHeading>
                      <p className="font-semibold text-charcoal/55">{selectedProduct.description}</p>
                    </div>
                    {FF.personalisedStory ? (
                      <PersonalisedStoryCopy region={region} productType={selectedProduct.id} />
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
                                {fmt(prod.basePrice)}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      </section>

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

                      {selectedProduct.hasSize && selectedProduct.sizes && (
                        <section>
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">Size</h3>
                          <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                            {selectedProduct.sizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(size)}
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
                          <button
                            type="button"
                            onClick={() => setIsSizeGuideOpen(true)}
                            className="mt-2 text-sm font-semibold text-charcoal/60 hover:text-charcoal underline underline-offset-2"
                          >
                            View size guide
                          </button>
                          {selectedProduct.hasSize && !selectedSize && (
                            <p className="mt-1 text-xs font-medium text-terracotta">Please select a size</p>
                          )}
                        </section>
                      )}

                      <section className="border-t border-charcoal/10 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-charcoal/55 font-semibold">Subtotal</span>
                          <span className="text-2xl font-black">{fmt(selectedProduct.basePrice)}</span>
                        </div>
                        {FF.giftingFlow && generatedImage ? (
                          <div className="mb-4">
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">
                              Optional Gifting Details
                            </h3>
                            <GiftingStep
                              value={conversionFlow}
                              hidden={isGiftingSkipped}
                              onChange={(patch) => updateConversionFlow(patch)}
                              onSkip={() => setIsGiftingSkipped(true)}
                              onReopen={() => setIsGiftingSkipped(false)}
                            />
                          </div>
                        ) : null}
                        <section>
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-charcoal/45 mb-3">
                            Add to Cart
                          </h3>
                          {addToCartConfirmation && (
                            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-forest)" }}>{addToCartConfirmation}</p>
                          )}
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddToCart}
                              disabled={!generatedImage || (selectedProduct.hasSize && !selectedSize)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta py-4 font-black !text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Add <Plus size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal/10 bg-white py-4 font-black text-charcoal"
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
                      productType={selectedProduct.id}
                      region={region}
                    />
                  )}
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
                    <KineticHeading as="h2" className="text-3xl font-black mb-4">Checkout</KineticHeading>
                    <p className="text-charcoal/55 font-semibold mb-6">
                      You&apos;re about to buy: <span className="text-charcoal">{checkoutItemDescription}</span>
                    </p>

                    <MagneticButton
                      onClick={() => requestCheckout(hasCartItems ? "cart" : "single")}
                      disabled={isBusy || !canProceedToCheckout}
                      className="relative w-full overflow-hidden rounded-2xl bg-terracotta py-5 text-lg font-black text-white shadow-terra-glow disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <AnimatePresence mode="wait">
                        {checkoutSuccess ? (
                          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                            Order Confirmed! <Check />
                          </motion.div>
                        ) : (
                          <motion.div key="default" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                            {isBusy ? "Securing your Masterpiece…" : `Pay ${fmt(checkoutTotal)}`} <ArrowRight />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </MagneticButton>

                    <button onClick={() => setStep(3)} className="mt-4 text-sm font-extrabold text-charcoal/55 hover:text-charcoal inline-flex items-center gap-2">
                      <ChevronLeft size={16} /> Back
                    </button>
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
                          <Image src={checkoutPreviewImage} className="h-full w-full object-contain p-1.5" alt="thumb" fill />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-extrabold">{checkoutItemDescription}</div>
                        <div className="text-sm text-charcoal/55 font-semibold">
                          {hasCartItems ? "Mixed cart with custom AI-generated designs" : "Custom AI-generated design"}
                      </div>
                      </div>
                      <div className="ml-auto font-black">{fmt(checkoutTotal)}</div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-charcoal/10 space-y-2 text-sm font-semibold text-charcoal/60">
                      <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                      <div className="flex justify-between text-charcoal font-black text-base pt-2"><span>Total</span><span>{fmt(checkoutTotal)}</span></div>
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
                    <div className="text-sm font-black mt-3">{fmt(p.basePrice)}</div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {view === "community" && (
            <motion.div key="community" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="text-center max-w-2xl mx-auto">
                <KineticHeading className="text-5xl font-black mb-3">Community Showcase</KineticHeading>
                <p className="text-charcoal/55 font-semibold">
                  See what other creators are making and get inspiration for your next keepsake.
                </p>
              </div>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {communityDesigns.map((img, idx) => (
                  <MagneticCard
                    key={`${img}-${idx}`}
                    maxTilt={8}
                    hoverScale={1.02}
                    className="break-inside-avoid rounded-2xl overflow-hidden border border-charcoal/8 bg-white shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]"
                  >
                    <Image src={img} alt="Community design" width={400} height={500} className="w-full h-auto" />
                    <div className="p-3 text-sm font-semibold text-charcoal/55">@creator_{idx + 1}</div>
                  </MagneticCard>
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
                  AI-generated designs created on Keepsy remain the property of the creator. By placing an order, you grant Keepsy
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
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-charcoal/50 hover:text-charcoal">
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
                    <div key={item.id} className="rounded-2xl border border-charcoal/8 bg-white p-3 shadow-[0_8px_20px_-12px_rgba(45,41,38,0.12)]">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F5EDE0] border border-charcoal/10">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1.5" />
                          ) : (
                            <Image src="/keepsy-logo-transparent.png" alt={item.name} fill className="object-contain p-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">{item.name}</div>
                          {(item.size || item.color) && (
                            <div className="text-charcoal/55 text-xs mt-0.5">
                              {[item.size, item.color].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          <div className="text-charcoal/55 text-sm">{fmt(item.unitPrice)}</div>
                        </div>
                        <button onClick={() => handleRemoveCartItem(item.id)} className="text-charcoal/40 hover:text-terracotta shrink-0">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAdjustQuantity(item.id, -1)} className="px-2 py-1 border border-charcoal/10 rounded-md">
                            -
                          </button>
                          <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => handleAdjustQuantity(item.id, 1)} className="px-2 py-1 border border-charcoal/10 rounded-md">
                            +
                          </button>
                        </div>
                        <div className="font-bold">{fmt(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t border-charcoal/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-charcoal/55 font-semibold">Subtotal</span>
                  <span className="text-xl font-black">{fmt(cartSubtotal)}</span>
                </div>
                <MagneticButton
                  onClick={() => requestCheckout("cart")}
                  disabled={isBusy || cartItems.length === 0}
                  className="w-full py-3 rounded-xl bg-terracotta !text-white font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isBusy ? "Securing…" : "Checkout"}
                </MagneticButton>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {FF.upsells ? (
        <UpsellDrawer
          open={isUpsellOpen}
          selectedUpsells={conversionFlow.selectedUpsells}
          bundleChoice={conversionFlow.bundleChoice}
          onChange={(patch) => updateConversionFlow(patch)}
          onNoThanks={() => {
            setIsUpsellOpen(false);
            const mode = pendingCheckoutMode;
            setPendingCheckoutMode(null);
            if (mode) void runCheckout(mode);
          }}
          onContinue={() => {
            setIsUpsellOpen(false);
            const mode = pendingCheckoutMode;
            setPendingCheckoutMode(null);
            if (mode) void runCheckout(mode);
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
        productType={selectedProduct.id}
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
