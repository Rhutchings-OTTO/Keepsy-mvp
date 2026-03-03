"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MockupRenderer } from "@/components/MockupRenderer";
import { GenerationLoadingOverlay } from "@/components/GenerationLoadingOverlay";
import TrustBar from "@/components/TrustBar";
import GiftingStep from "@/components/GiftingStep";
import CheckoutSummaryEnhancer from "@/components/CheckoutSummaryEnhancer";
import UpsellDrawer from "@/components/UpsellDrawer";
import GiftAssistantWidget from "@/components/GiftAssistantWidget";
import { CreatePageLayoutLean } from "@/components/create/CreatePageLayoutLean";
import { DesignConfirmation } from "@/components/generation/DesignConfirmation";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Reveal } from "@/components/motion/Reveal";
import PersonalisedStoryCopy from "@/components/PersonalisedStoryCopy";
import MagicpathBackground from "@/components/skin/magicpath/MagicpathBackground";
import { MagicpathFrame } from "@/components/skin/magicpath/MagicpathFrame";
import { useConversionFlow } from "@/context/ConversionFlowContext";
import { FF } from "@/lib/featureFlags";
import { motionTransition, revealUp, softScaleIn } from "@/lib/motion";
import { getRegion, type Region } from "@/lib/region";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";
import {
  Sparkles,
  ShoppingCart,
  X,
  RefreshCcw,
  ArrowRight,
  ChevronLeft,
  Plus,
  Heart,
  Check,
  Star,
} from "lucide-react";

/** Types */
type MerchType = "tshirt" | "mug" | "card" | "hoodie";
interface Product {
  id: string;
  type: MerchType;
  name: string;
  price: number; // GBP
  description: string;
  colors: string[];
}
interface CartItem {
  id: string;
  product: Product;
  imageDataUrl: string | null;
  prompt: string;
  quantity: number;
}

type PersistedCartItem = {
  id: string;
  productId: string;
  imageDataUrl: string | null;
  prompt: string;
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

/** Match your real products */
const PRODUCTS: Product[] = [
  {
    id: "tee",
    type: "tshirt",
    name: "Premium tee",
    price: 29,
    description: "Soft, heavyweight premium tee.",
    colors: ["#FFFFFF", "#111827", "#2563EB"],
  },
  {
    id: "mug",
    type: "mug",
    name: "Mug",
    price: 14,
    description: "11oz ceramic mug with glossy finish.",
    colors: ["#FFFFFF"],
  },
  {
    id: "card",
    type: "card",
    name: "Greeting card",
    price: 8,
    description: "Premium cardstock + envelope.",
    colors: ["#FFFFFF"],
  },
  {
    id: "hoodie",
    type: "hoodie",
    name: "Hoodie",
    price: 40,
    description: "Soft fleece hoodie, gift-ready print.",
    colors: ["#FFFFFF", "#111827", "#2563EB"],
  },
];

const COMMUNITY_DESIGNS = [
  "/occasion-tiles/christmas-scene.png",
  "/occasion-tiles/thanksgiving-cartoon.png",
  "/occasion-tiles/fourth-july-photo.png",
  "/occasion-tiles/anniversary-watercolor.png",
];

const fadeInUp = FF.motionSystem
  ? revealUp
  : {
      initial: { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45, ease: "easeOut" },
    };

const GBP_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});
const CART_STORAGE_KEY = "keepsy_cart_v1";

function gbp(n: number) {
  return GBP_FORMATTER.format(n);
}

function toPersistedCart(cartItems: CartItem[]): PersistedCartItem[] {
  return cartItems.map((item) => ({
    id: item.id,
    productId: item.product.id,
    imageDataUrl: item.imageDataUrl,
    prompt: item.prompt,
    quantity: item.quantity,
  }));
}

function fromPersistedCart(raw: string): CartItem[] {
  const parsed = JSON.parse(raw) as PersistedCartItem[];
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      const product = PRODUCTS.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) return null;
      return {
        id: item.id,
        product,
        imageDataUrl: typeof item.imageDataUrl === "string" ? item.imageDataUrl : null,
        prompt: typeof item.prompt === "string" ? item.prompt : "",
        quantity: item.quantity,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

function getMockupProductType(type: MerchType): MockupProductType {
  if (type === "tshirt") return "tshirt";
  if (type === "hoodie") return "hoodie";
  if (type === "mug") return "mug";
  return "card";
}

function getMockupColor(hex: string): MockupColor {
  if (hex === "#111827") return "black";
  if (hex === "#2563EB") return "blue";
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

  return message;
}

/** Uses YOUR real API route */
async function generateViaKeepsyAPI(args: {
  prompt: string;
  sourceImageDataUrl?: string | null;
  designShape: DesignShape;
  signal?: AbortSignal;
}) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-visitor-id": getVisitorId(),
    },
    signal: args.signal,
    body: JSON.stringify({
      prompt: args.prompt,
      sourceImageDataUrl: args.sourceImageDataUrl ?? null,
      designShape: args.designShape,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data?.error || "Failed to generate image") as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data.imageDataUrl as string; // IMPORTANT: this is a data URL
}

/** Uses YOUR real Stripe session route */
async function checkoutViaKeepsyAPI(args: {
  selectedProduct: Product;
  prompt: string;
  imageDataUrl: string;
  cart?: Array<{ id: string; name: string; quantity: number }>;
}) {
  const normalizedCart =
    args.cart && args.cart.length > 0
      ? args.cart
      : [{ id: args.selectedProduct.id, name: args.selectedProduct.name, quantity: 1 }];

  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: {
        id: args.selectedProduct.id,
        name: args.selectedProduct.name,
      },
      currency: "gbp",
      prompt: args.prompt,
      imageDataUrl: args.imageDataUrl,
      cart: normalizedCart,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to create checkout session");
  return data.url as string;
}

export default function MerchGeneratorPlatform({ initialQuery }: { initialQuery?: InitialCreateQuery }) {
  const { state: conversionFlow, updateState: updateConversionFlow } = useConversionFlow();
  const [view, setView] = useState<"home" | "catalog" | "community" | "legal">("home");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [region] = useState<Region>(() => getRegion() ?? "UK");

  const [prompt, setPrompt] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastGenerationPrompt, setLastGenerationPrompt] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [refinementSuccess, setRefinementSuccess] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [, setHasUserTypedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateAbortRef = useRef<AbortController | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[2]); // default: card
  const [selectedColor, setSelectedColor] = useState(PRODUCTS[2].colors[0]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGiftingSkipped, setIsGiftingSkipped] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [pendingCheckoutMode, setPendingCheckoutMode] = useState<"single" | "cart" | null>(null);
  const [checkoutSuccess] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"success" | "canceled" | null>(null);
  const didApplyInitialQuery = useRef(false);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const hasCartItems = cartItems.length > 0;
  const checkoutTotal = hasCartItems ? cartSubtotal : selectedProduct.price;
  const checkoutItemDescription = hasCartItems
    ? `${cartCount} item${cartCount === 1 ? "" : "s"}`
    : selectedProduct.name;
  const checkoutPreviewImage = hasCartItems ? cartItems[0]?.imageDataUrl ?? null : generatedImage;
  const canProceedToCheckout = hasCartItems
    ? cartItems.length > 0 && cartItems.every((item) => Boolean(item.imageDataUrl))
    : Boolean(generatedImage);
  const selectedMockupProductType = getMockupProductType(selectedProduct.type);
  const selectedMockupColor = getMockupColor(selectedColor);
  const isMagicpathSkin = FF.magicpathSkin;

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

  useEffect(() => {
    if (!initialQuery || didApplyInitialQuery.current) return;
    didApplyInitialQuery.current = true;

    const normalizedProduct = initialQuery.product?.toLowerCase();
    const productAliasToId: Record<string, Product["id"]> = {
      tee: "tee",
      tshirt: "tee",
      "t-shirt": "tee",
      mug: "mug",
      card: "card",
      hoodie: "hoodie",
    };
    const mappedProductId = normalizedProduct ? productAliasToId[normalizedProduct] : null;
    const mappedProduct = mappedProductId
      ? PRODUCTS.find((product) => product.id === mappedProductId)
      : null;

    if (mappedProduct) {
      setSelectedProduct(mappedProduct);
      setSelectedColor(mappedProduct.colors[0]);
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

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) return;
    setIsGenerating(true);
    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    setGenerationError(null);
    setIsBusy(true);
    try {
      const basePrompt = prompt || "Create a polished lifelike keepsake design from this uploaded image.";
      const shapeGuide = "Use a square composition.";
      const promptWithQualityGuide = `${basePrompt}. ${shapeGuide} High-quality production-ready design image. Avoid words, letters, logos, and typographic word-art unless explicitly requested. Use realistic lighting, depth, and texture.`;
      let imageDataUrl: string | null = null;
      const maxAttempts = 2;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          imageDataUrl = await generateViaKeepsyAPI({
            prompt: promptWithQualityGuide,
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

      if (!imageDataUrl) throw new Error("Failed to generate image");
      setGeneratedImage(imageDataUrl);
      setLastGenerationPrompt(promptWithQualityGuide);
      setGenerationError(null);
      setRefinementSuccess(false);
      setStep(2);
      setView("home");
    } catch (e) {
      console.error(e);
      const aborted = e instanceof Error && e.name === "AbortError";
      setGenerationError(aborted ? "Generation timed out. Please try again." : getFriendlyGenerationError(e));
    } finally {
      clearTimeout(timeout);
      if (generateAbortRef.current === controller) {
        generateAbortRef.current = null;
      }
      setIsGenerating(false);
      setIsBusy(false);
    }
  };

  const handleRefine = async (refinementText: string) => {
    if (!generatedImage || !refinementText.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    setRefinementSuccess(false);
    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;
    try {
      const instruction = `${lastGenerationPrompt}\n\nRefinement request: ${refinementText.trim()}`;
      const imageDataUrl = await generateViaKeepsyAPI({
        prompt: instruction,
        sourceImageDataUrl: generatedImage,
        designShape: "square",
        signal: controller.signal,
      });
      setGeneratedImage(imageDataUrl);
      setLastGenerationPrompt(instruction);
      setRefinementSuccess(true);
      setGenerationError(null);
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      setGenerationError(aborted ? "Update was cancelled." : getFriendlyGenerationError(e));
    } finally {
      generateAbortRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleAddToCart = () => {
    if (!generatedImage) {
      setGenerationError("Generate a design before adding an item to cart.");
      setStep(1);
      return;
    }
    const nextItemId = `${selectedProduct.id}-${generatedImage ?? "no-image"}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === nextItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === nextItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: nextItemId,
          product: selectedProduct,
          imageDataUrl: generatedImage,
          prompt,
          quantity: 1,
        },
      ];
    });
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

  const handleCheckout = async () => {
    if (!generatedImage) return;
    setIsBusy(true);
    try {
      const url = await checkoutViaKeepsyAPI({
        selectedProduct,
        prompt,
        imageDataUrl: generatedImage,
      });
      // redirect to Stripe Checkout
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Checkout failed");
      setIsBusy(false);
    }
  };

  const handleCartCheckout = async () => {
    if (cartItems.length === 0) return;
    if (cartItems.some((item) => !item.imageDataUrl)) {
      alert("Please remove items missing generated designs before checking out.");
      return;
    }
    const firstItem = cartItems[0];
    const checkoutImage = firstItem.imageDataUrl;
    if (!checkoutImage) return;
    setIsBusy(true);
    try {
      const url = await checkoutViaKeepsyAPI({
        selectedProduct: firstItem.product,
        prompt: firstItem.prompt,
        imageDataUrl: checkoutImage,
        cart: cartItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
        })),
      });
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Checkout failed");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  return (
    <div
      className={`min-h-screen flex flex-col text-[#23211F] selection:bg-indigo-100 overflow-x-hidden ${
        isMagicpathSkin ? "bg-[#FDFCFB]" : "bg-[#F7F1EB]"
      }`}
      aria-busy={isGenerating}
    >
      <MagicpathBackground enabled={isMagicpathSkin} />
      {!isMagicpathSkin ? (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <motion.div
            animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7DB9E8]/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{ x: [0, -60, 0], y: [0, 80, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#F8C8DC]/20 blur-[120px] rounded-full"
          />
        </div>
      ) : null}

      {/* NAV */}
      <nav className={`fixed z-40 w-full px-6 ${isMagicpathSkin ? "top-5" : "top-0 py-4"}`}>
        <MagicpathFrame enabled={isMagicpathSkin} className={isMagicpathSkin ? "mx-auto flex w-full max-w-5xl items-center justify-between px-7 py-5" : ""}>
          <div className={`flex w-full items-center justify-between ${isMagicpathSkin ? "" : "border-b border-black/10 bg-[#F7F1EB]/78 px-0 backdrop-blur-md"}`}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setView("home");
                setStep(1);
              }}
            >
              <Image
                src="/keepsy-logo-transparent.png"
                alt="Keepsy"
                width={640}
                height={190}
                className="h-16 w-auto object-contain sm:h-20"
              />
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-black/60">
                <button onClick={() => setView("home")} className={view === "home" ? "text-black" : ""}>
                  How it works
                </button>
                <button onClick={() => setView("catalog")} className={view === "catalog" ? "text-black" : ""}>
                  Catalog
                </button>
                <button onClick={() => setView("community")} className={view === "community" ? "text-black" : ""}>
                  Community
                </button>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className={`flex items-center gap-2 transition-all px-4 py-2 rounded-full ${
                  isMagicpathSkin ? "bg-black text-white shadow-xl" : "bg-black/5 hover:bg-black/10"
                }`}
              >
                <ShoppingCart size={18} className={isMagicpathSkin ? "text-white" : "text-black/70"} />
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1.35 }}
                  animate={{ scale: 1 }}
                  className="font-extrabold text-sm"
                >
                  {cartCount}
                </motion.span>
              </button>
            </div>
          </div>
        </MagicpathFrame>
      </nav>

      <main className={`flex-1 pb-16 px-6 max-w-7xl mx-auto w-full ${isMagicpathSkin ? "pt-40" : "pt-32"}`}>
        <AnimatePresence mode="wait">
          {view === "home" && (
            <div className="space-y-20">
              <div className="flex gap-2 md:hidden">
                <button onClick={() => setView("home")} className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-bold">
                  How it works
                </button>
                <button onClick={() => setView("catalog")} className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-bold">
                  Catalog
                </button>
                <button onClick={() => setView("community")} className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-bold">
                  Community
                </button>
              </div>
              {/* STEP 1 - Lean layout */}
              {step === 1 && (
                <CreatePageLayoutLean
                  region={region}
                  isMagicpathSkin={isMagicpathSkin}
                  prompt={prompt}
                  setPrompt={(v) => {
                    setPrompt(v);
                    setGenerationError(null);
                  }}
                  setHasUserTypedPrompt={setHasUserTypedPrompt}
                  uploadedImage={uploadedImage}
                  uploadedFileName={uploadedFileName}
                  generationError={generationError}
                  checkoutStatus={checkoutStatus}
                  isBusy={isBusy}
                  onGenerate={handleGenerate}
                  onUploadFile={handleUploadFile}
                  onClearUploadedImage={clearUploadedImage}
                  onProductSelect={(type) => {
                    const product = PRODUCTS.find((p) => p.type === type);
                    if (!product) return;
                    setSelectedProduct(product);
                    setSelectedColor(product.colors[0]);
                  }}
                  fileInputRef={fileInputRef}
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
                  isRefining={isGenerating}
                  refinementError={generationError}
                  refinementSuccess={refinementSuccess}
                />
              )}

              {/* STEP 3 — Mockup placement */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
                >
                  <div className="lg:col-span-7 sticky top-24">
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
                    <div className="mt-6 flex gap-3 items-center">
                      <div className="px-3 py-2 rounded-full bg-white/70 border border-black/10 text-xs font-extrabold flex items-center gap-2">
                        <Sparkles size={14} /> Applied to real mockups
                      </div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs font-extrabold text-black/55 hover:text-black inline-flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    </div>
                    {FF.beforeAfter ? (
                      <div className="mt-4">
                        <BeforeAfterSlider beforeSrc={uploadedImage} afterSrc={generatedImage} />
                      </div>
                    ) : null}
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <h2 className="text-4xl font-black mb-2">{selectedProduct.name}</h2>
                      <p className="text-black/55 font-semibold">{selectedProduct.description}</p>
                    </div>
                    {FF.personalisedStory ? (
                      <PersonalisedStoryCopy region={region} productType={selectedProduct.type} />
                    ) : null}

                    <div className="bg-white/80 border border-black/10 rounded-3xl p-5 shadow-sm">
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-4">
                        Select Product
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {PRODUCTS.map((prod) => (
                          <motion.button
                            key={prod.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedProduct(prod);
                              setSelectedColor(prod.colors[0]);
                            }}
                            className={`p-4 rounded-2xl border transition-all text-left ${
                              selectedProduct.id === prod.id ? "border-black bg-black text-white" : "border-black/10 bg-white"
                            }`}
                          >
                            <div className="text-sm font-extrabold">{prod.name}</div>
                            <div className={`text-xs mt-1 ${selectedProduct.id === prod.id ? "text-white/70" : "text-black/55"}`}>
                              {gbp(prod.price)}
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {selectedProduct.colors.length > 1 && (
                        <div className="mt-5">
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-3">Color</h3>
                          <div className="flex gap-3">
                            {selectedProduct.colors.map((c) => (
                              <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`w-10 h-10 rounded-full border ${
                                  selectedColor === c ? "border-black ring-4 ring-black/5" : "border-black/10"
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 pt-5 border-t border-black/10">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-black/55 font-semibold">Subtotal</span>
                          <span className="text-2xl font-black">{gbp(selectedProduct.price)}</span>
                        </div>
                        {FF.giftingFlow && generatedImage ? (
                          <div className="mb-4">
                            <GiftingStep
                              value={conversionFlow}
                              hidden={isGiftingSkipped}
                              onChange={(patch) => updateConversionFlow(patch)}
                              onSkip={() => setIsGiftingSkipped(true)}
                              onReopen={() => setIsGiftingSkipped(false)}
                            />
                          </div>
                        ) : null}
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddToCart}
                            disabled={!generatedImage}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Add <Plus size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-white border border-black/10 text-black rounded-2xl font-black flex items-center justify-center gap-2"
                          >
                            Save <Heart size={18} className="text-pink-400" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
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
                  className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <div className="bg-white/80 border border-black/10 rounded-[32px] p-7 shadow-sm">
                    <h2 className="text-3xl font-black mb-4">Checkout</h2>
                    <p className="text-black/55 font-semibold mb-6">
                      You&apos;re about to buy: <span className="text-black">{checkoutItemDescription}</span>
                    </p>

                    <motion.button
                      onClick={() => requestCheckout(hasCartItems ? "cart" : "single")}
                      disabled={isBusy || !canProceedToCheckout}
                      className="w-full py-5 rounded-2xl font-black text-lg text-white shadow-xl relative overflow-hidden"
                      style={{ backgroundImage: "linear-gradient(90deg,#7DB9E8,#B19CD9)" }}
                    >
                      <AnimatePresence mode="wait">
                        {checkoutSuccess ? (
                          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                            Order Confirmed! <Check />
                          </motion.div>
                        ) : (
                          <motion.div key="default" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                            {isBusy ? "Redirecting…" : `Pay ${gbp(checkoutTotal)}`} <ArrowRight />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <button onClick={() => setStep(3)} className="mt-4 text-sm font-extrabold text-black/55 hover:text-black inline-flex items-center gap-2">
                      <ChevronLeft size={16} /> Back
                    </button>
                    {FF.trustLayer ? (
                      <div className="mt-4">
                        <TrustBar />
                      </div>
                    ) : null}
                    <p className="mt-4 text-xs text-black/45">
                      By placing your order, you agree to our{" "}
                      <button className="underline hover:text-black" onClick={() => setView("legal")}>
                        Terms of Service
                      </button>
                      .
                    </p>
                  </div>

                  <Reveal variant="fadeUp" className="bg-white/70 border border-black/10 rounded-[32px] p-7 shadow-sm">
                    <h3 className="text-xl font-black mb-4">Order Summary</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-black/10 bg-white">
                        {checkoutPreviewImage ? (
                          <Image src={checkoutPreviewImage} className="w-full h-full object-cover" alt="thumb" fill />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-extrabold">{checkoutItemDescription}</div>
                        <div className="text-sm text-black/55 font-semibold">
                          {hasCartItems ? "Mixed cart with custom AI-generated designs" : "Custom AI-generated design"}
                        </div>
                      </div>
                      <div className="ml-auto font-black">{gbp(checkoutTotal)}</div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-black/10 space-y-2 text-sm font-semibold text-black/60">
                      <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                      <div className="flex justify-between text-black font-black text-base pt-2"><span>Total</span><span>{gbp(checkoutTotal)}</span></div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-xs text-black/45 font-semibold">
                      <Star size={14} className="text-yellow-500" /> Gift-ready print & packaging
                    </div>
                    {FF.checkoutUX ? (
                      <div className="mt-4">
                        <CheckoutSummaryEnhancer
                          productName={checkoutItemDescription}
                          priceText={gbp(checkoutTotal)}
                          thumbnailSrc={checkoutPreviewImage}
                        />
                      </div>
                    ) : null}
                  </Reveal>
                </motion.div>
              )}
            </div>
          )}

          {/* Catalog */}
          {view === "catalog" && (
            <motion.div key="catalog" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-5xl font-black mb-3">Catalog</h1>
                <p className="text-black/55 font-semibold">Pick your base product, then generate a design.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PRODUCTS.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.99 }}
                    className="text-left bg-white/80 border border-black/10 rounded-3xl p-5 shadow-sm"
                    onClick={() => {
                      setSelectedProduct(p);
                      setView("home");
                      setStep(1);
                    }}
                  >
                    <div className="text-lg font-black">{p.name}</div>
                    <div className="text-sm text-black/55 font-semibold mt-1">{p.description}</div>
                    <div className="text-sm font-black mt-3">{gbp(p.price)}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {view === "community" && (
            <motion.div key="community" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-5xl font-black mb-3">Community Showcase</h1>
                <p className="text-black/55 font-semibold">
                  See what other creators are making and get inspiration for your next keepsake.
                </p>
              </div>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {COMMUNITY_DESIGNS.map((img, idx) => (
                  <motion.div key={`${img}-${idx}`} whileHover={{ scale: 1.01 }} className="break-inside-avoid rounded-2xl overflow-hidden bg-white border border-black/10">
                    <Image src={img} alt="Community design" width={400} height={500} className="w-full h-auto" />
                    <div className="p-3 text-sm font-semibold text-black/55">@creator_{idx + 1}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "legal" && (
            <motion.div key="legal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl font-black">Terms & Conditions</h1>
              <section className="space-y-2 text-black/70">
                <h2 className="text-xl font-bold text-black">1. Intellectual Property</h2>
                <p>
                  AI-generated designs created on Keepsy remain the property of the creator. By placing an order, you grant Keepsy
                  permission to produce and ship products featuring that design.
                </p>
              </section>
              <section className="space-y-2 text-black/70">
                <h2 className="text-xl font-bold text-black">2. Usage Policy</h2>
                <p>
                  Users are responsible for uploaded and generated content. Content must not violate copyright, trademark, or contain
                  illegal or harmful material.
                </p>
              </section>
              <section className="space-y-2 text-black/70">
                <h2 className="text-xl font-bold text-black">3. Payments & Refunds</h2>
                <p>
                  Payments are processed securely by Stripe. Because products are custom-made, refunds are only offered for damaged or
                  defective items.
                </p>
              </section>
              <button onClick={() => setView("home")} className="inline-flex items-center gap-2 font-bold text-black/70 hover:text-black">
                <ChevronLeft size={16} /> Back to creation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 border-l border-black/10 shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-black/50 hover:text-black">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto space-y-4 pr-1">
                {cartItems.length === 0 ? (
                  <p className="text-black/55">Your cart is empty.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="border border-black/10 rounded-2xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/5 border border-black/10">
                          {item.imageDataUrl ? (
                            <Image src={item.imageDataUrl} alt={item.product.name} fill className="object-cover" />
                          ) : (
                            <Image src="/keepsy-logo-transparent.png" alt={item.product.name} fill className="object-contain p-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{item.product.name}</div>
                          <div className="text-black/55 text-sm">{gbp(item.product.price)}</div>
                        </div>
                        <button onClick={() => handleRemoveCartItem(item.id)} className="text-black/40 hover:text-red-600">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAdjustQuantity(item.id, -1)} className="px-2 py-1 border border-black/10 rounded-md">
                            -
                          </button>
                          <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => handleAdjustQuantity(item.id, 1)} className="px-2 py-1 border border-black/10 rounded-md">
                            +
                          </button>
                        </div>
                        <div className="font-bold">{gbp(item.product.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t border-black/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-black/55 font-semibold">Subtotal</span>
                  <span className="text-xl font-black">{gbp(cartSubtotal)}</span>
                </div>
                <button
                  onClick={() => requestCheckout("cart")}
                  disabled={isBusy || cartItems.length === 0}
                  className="w-full py-3 rounded-xl bg-black text-white font-extrabold disabled:opacity-40"
                >
                  {isBusy ? "Redirecting..." : "Checkout"}
                </button>
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

      <footer className={`px-6 ${isMagicpathSkin ? "pb-20 pt-16" : "py-10 border-t border-black/10 bg-white/60"}`}>
        <MagicpathFrame enabled={isMagicpathSkin} className={isMagicpathSkin ? "mx-auto max-w-7xl px-8 py-8" : ""}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
            <div className="font-semibold text-black/55">
              © 2026 Keepsy Ltd. All designs generated are owned by the creator. Powered by OpenAI & Stripe
            </div>
            <div className="flex items-center gap-5 text-black/60">
              <button onClick={() => setView("catalog")} className="hover:text-black">Catalog</button>
              <button onClick={() => setView("community")} className="hover:text-black">Community</button>
              <button onClick={() => setView("legal")} className="hover:text-black">Terms of Service</button>
              <button onClick={() => setView("legal")} className="hover:text-black">Privacy Policy</button>
              <button className="hover:text-black" onClick={handleDeleteMyData}>
                Delete My Data
              </button>
            </div>
          </div>
        </MagicpathFrame>
      </footer>
      <GenerationLoadingOverlay
        isOpen={isGenerating}
        productType={selectedProduct.type}
        hasSourceImage={Boolean(uploadedImage)}
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