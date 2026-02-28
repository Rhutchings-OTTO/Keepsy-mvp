"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MockupRenderer } from "@/components/MockupRenderer";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";
import {
  Sparkles,
  ShoppingCart,
  Zap,
  Upload,
  X,
  RefreshCcw,
  ArrowRight,
  ChevronLeft,
  Plus,
  Heart,
  Shirt,
  Coffee,
  CreditCard,
  Layout,
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
  style?: string;
  occasion?: string;
  success?: boolean;
  canceled?: boolean;
};

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

const PRESET_PROMPTS = [
  "Photoreal family Christmas scene in a snowy village with warm lights, print-ready",
  "Thanksgiving cartoon family dinner scene with pumpkins and autumn leaves",
  "Fourth of July backyard scene with fireworks, flags, and a barbecue at dusk",
  "Romantic anniversary watercolor scene with champagne, roses, and candlelight",
  "Lifelike pet portrait with soft natural window light and clean background",
];

const COMMUNITY_DESIGNS = [
  "/occasion-tiles/christmas-scene.png",
  "/occasion-tiles/thanksgiving-cartoon.png",
  "/occasion-tiles/fourth-july-photo.png",
  "/occasion-tiles/anniversary-watercolor.png",
];

const CREATOR_TESTIMONIALS = [
  {
    name: "Sarah J.",
    quote: "The AI generated exactly what I was looking for! The t-shirt quality is superb.",
    initials: "SJ",
  },
  {
    name: "Marcus L.",
    quote: "Uploaded a photo of my dog and the AI turned it into a masterpiece on a mug.",
    initials: "ML",
  },
  {
    name: "Elena R.",
    quote: "Fast shipping and beautiful packaging. Will definitely order again.",
    initials: "ER",
  },
];

const fadeInUp = {
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
  const [view, setView] = useState<"home" | "catalog" | "community" | "legal">("home");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [prompt, setPrompt] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateAbortRef = useRef<AbortController | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[2]); // default: card
  const [selectedColor, setSelectedColor] = useState(PRODUCTS[2].colors[0]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
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
      setStep(2);
    }

    const style = initialQuery.style?.trim();
    const occasion = initialQuery.occasion?.replace(/-/g, " ").trim();
    if (style && occasion) {
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
    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    setGenerationError(null);
    setIsBusy(true);
    try {
      const basePrompt = prompt || "Create a polished lifelike keepsake design from this uploaded image.";
      const promptWithQualityGuide = `${basePrompt}. High-quality production-ready design image. Avoid words, letters, logos, and typographic word-art unless explicitly requested. Use realistic lighting, depth, and texture.`;
      let imageDataUrl: string | null = null;
      const maxAttempts = 2;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          imageDataUrl = await generateViaKeepsyAPI({
            prompt: promptWithQualityGuide,
            sourceImageDataUrl: uploadedImage,
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
      setGenerationError(null);
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
      setIsBusy(false);
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
    setStep(3);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    setGenerationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1EB] text-[#23211F] selection:bg-indigo-100 overflow-x-hidden">
      {/* Background blobs */}
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

      {/* NAV */}
      <nav className="fixed top-16 z-40 flex w-full items-center justify-between border-b border-black/5 bg-[#F7F1EB] px-6 py-4">
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
            src="/keepsy-logo.png"
            alt="Keepsy"
            width={420}
            height={120}
            className="h-12 w-auto object-contain sm:h-16"
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
            className="flex items-center gap-2 bg-black/5 hover:bg-black/10 transition-all px-4 py-2 rounded-full"
          >
            <ShoppingCart size={18} className="text-black/70" />
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
      </nav>

      <main className="flex-1 pt-40 pb-16 px-6 max-w-7xl mx-auto w-full">
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
              {/* STEP 1 */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, scale: 0.98 }}
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

                  <motion.p variants={fadeInUp} className="text-lg text-black/55 mb-10 max-w-2xl leading-relaxed">
                    Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
                  </motion.p>

                  <motion.div variants={fadeInUp} className="w-full relative group">
                    <div className="absolute -inset-1 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-700"
                      style={{ backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)" }}
                    />
                    <div className="relative bg-white p-2 rounded-2xl shadow-xl flex flex-col gap-2 border border-black/5">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        <div className="flex-1 flex items-center px-4">
                          <input
                            type="text"
                            value={prompt}
                            onChange={(e) => {
                              setPrompt(e.target.value);
                              if (generationError) setGenerationError(null);
                            }}
                            placeholder={uploadedImage ? "Add instructions for your photo..." : "Describe your gift image…"}
                            className="flex-1 bg-transparent py-4 text-base font-semibold outline-none placeholder:text-black/40 md:text-lg"
                          />

                          <div className="flex items-center gap-2 border-l border-black/5 pl-4 ml-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                                uploadedImage ? "bg-black/5 text-black" : "text-black/60 hover:bg-black/5 hover:text-black"
                              }`}
                              title="Upload a photo"
                            >
                              <Upload size={20} />
                              {uploadedImage && <span className="text-xs font-extrabold hidden sm:inline">Photo added</span>}
                            </button>
                          </div>
                        </div>

                        <motion.button
                          onClick={handleGenerate}
                          disabled={(!prompt && !uploadedImage) || isBusy}
                          className={`px-8 py-4 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                            isBusy ? "bg-black/35 cursor-not-allowed" : "bg-black hover:bg-black/90"
                          }`}
                        >
                          {isBusy ? (
                            <>
                              <RefreshCcw className="animate-spin" size={20} />
                              Generating…
                            </>
                          ) : (
                            <>
                              Generate Design <ArrowRight size={20} />
                            </>
                          )}
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {generationError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mx-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                          >
                            {generationError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {checkoutStatus === "success" && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mx-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                          >
                            Payment complete. Your order is confirmed and queued for processing.
                          </motion.p>
                        )}
                        {checkoutStatus === "canceled" && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mx-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                          >
                            Checkout canceled. Your design is saved here so you can continue anytime.
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {uploadedImage && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.98 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.98 }}
                            className="px-4 pb-2"
                          >
                            <div className="relative inline-block mt-2">
                              <motion.img src={uploadedImage} alt="Uploaded" className="h-16 w-16 object-cover rounded-lg border border-black/10 shadow-sm" />
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={clearUploadedImage}
                                className="absolute -top-2 -right-2 p-1 bg-white border border-black/10 rounded-full shadow-md text-black/50 hover:text-red-600 transition-colors"
                              >
                                <X size={12} />
                              </motion.button>
                            </div>
                            <p className="text-[10px] text-black/45 mt-1 font-semibold italic">
                              Uploaded photo will be used as the generation source.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap justify-center gap-3">
                    <span className="text-sm text-black/35 font-semibold mr-2 self-center">Try:</span>
                    {PRESET_PROMPTS.map((p) => (
                      <motion.button
                        key={p}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPrompt(p)}
                        className="px-4 py-2 rounded-full border border-black/10 text-sm text-black/70 hover:bg-white transition-colors bg-white/70"
                      >
                        {p}
                      </motion.button>
                    ))}
                  </motion.div>

                  <motion.div variants={fadeInUp} className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 w-full opacity-60">
                    {[
                      { Icon: Shirt, label: "T-Shirts" },
                      { Icon: Coffee, label: "Mugs" },
                      { Icon: CreditCard, label: "Cards" },
                      { Icon: Layout, label: "Hoodies" },
                    ].map(({ Icon, label }) => (
                      <motion.button
                        key={label}
                        whileHover={{ scale: 1.06, opacity: 1 }}
                        className="flex flex-col items-center gap-2"
                        onClick={() => {
                          const typeMap: Record<string, MerchType> = {
                            "T-Shirts": "tshirt",
                            Mugs: "mug",
                            Cards: "card",
                            Hoodies: "hoodie",
                          };
                          const product = PRODUCTS.find((p) => p.type === typeMap[label]);
                          if (!product) return;
                          setSelectedProduct(product);
                          setSelectedColor(product.colors[0]);
                          setStep(2);
                        }}
                      >
                        <Icon size={28} />
                        <span className="font-extrabold text-xs uppercase tracking-widest">{label}</span>
                      </motion.button>
                    ))}
                  </motion.div>

                  <motion.section variants={fadeInUp} className="mt-16 w-full">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-8">What our creators say</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {CREATOR_TESTIMONIALS.map((testimonial) => (
                        <article
                          key={testimonial.name}
                          className="rounded-3xl border border-black/10 bg-white/80 p-6 text-center shadow-sm"
                        >
                          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-[#7DB9E8]/80 to-[#F8C8DC]/80 text-white font-black flex items-center justify-center border border-white">
                            {testimonial.initials}
                          </div>
                          <div className="mt-4 flex items-center justify-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={`${testimonial.name}-${index}`} size={15} className="text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          <p className="mt-4 text-lg italic text-black/70">&quot;{testimonial.quote}&quot;</p>
                          <p className="mt-4 text-2xl font-black">{testimonial.name}</p>
                        </article>
                      ))}
                    </div>
                  </motion.section>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
                >
                  <div className="lg:col-span-7 sticky top-24">
                    <MockupRenderer
                      productType={getMockupProductType(selectedProduct.type)}
                      color={getMockupColor(selectedColor)}
                      generatedImage={generatedImage}
                    />
                    <div className="mt-6 flex gap-3 items-center">
                      <div className="px-3 py-2 rounded-full bg-white/70 border border-black/10 text-xs font-extrabold flex items-center gap-2">
                        <Sparkles size={14} /> Applied to real mockups
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        className="text-xs font-extrabold text-black/55 hover:text-black inline-flex items-center gap-2"
                      >
                        <ChevronLeft size={16} />
                        Back
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <h2 className="text-4xl font-black mb-2">{selectedProduct.name}</h2>
                      <p className="text-black/55 font-semibold">{selectedProduct.description}</p>
                    </div>

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

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div
                  key="step3"
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
                      onClick={hasCartItems ? handleCartCheckout : handleCheckout}
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

                    <button onClick={() => setStep(2)} className="mt-4 text-sm font-extrabold text-black/55 hover:text-black inline-flex items-center gap-2">
                      <ChevronLeft size={16} /> Back
                    </button>
                    <p className="mt-4 text-xs text-black/45">
                      By placing your order, you agree to our{" "}
                      <button className="underline hover:text-black" onClick={() => setView("legal")}>
                        Terms of Service
                      </button>
                      .
                    </p>
                  </div>

                  <div className="bg-white/70 border border-black/10 rounded-[32px] p-7 shadow-sm">
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
                  </div>
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
                      setStep(2);
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
                            <Image src="/keepsy-logo.png" alt={item.product.name} fill className="object-contain p-2" />
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
                  onClick={handleCartCheckout}
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

      <footer className="py-10 px-6 border-t border-black/10 bg-white/60">
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
      </footer>
    </div>
  );
}