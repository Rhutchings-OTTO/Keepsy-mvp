"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/** Match your real products */
const PRODUCTS: Product[] = [
  {
    id: "tee",
    type: "tshirt",
    name: "Premium tee",
    price: 29,
    description: "Soft, heavyweight premium tee.",
    colors: ["#FFFFFF", "#111827", "#4B5563"],
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
    colors: ["#FFFFFF", "#111827"],
  },
];

const PRESET_PROMPTS = [
  "Turn my child's crayon drawing into a warm watercolor keepsake, clean background, gift-ready",
  "A cozy family portrait illustration in soft pastel tones, simple background",
  "A cute pet illustration, clean white background, print-ready",
  "A minimal line-art portrait with a warm, sentimental feel",
  "A romantic anniversary keepsake illustration, tasteful and modern",
];

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" },
};

function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

/** Uses YOUR real API route */
async function generateViaKeepsyAPI(prompt: string) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      style: "watercolor",
      quality: "high",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to generate image");
  return data.imageDataUrl as string; // IMPORTANT: this is a data URL
}

/** Uses YOUR real Stripe session route */
async function checkoutViaKeepsyAPI(args: {
  selectedProduct: Product;
  prompt: string;
  imageDataUrl: string;
}) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: {
        id: args.selectedProduct.id,
        name: args.selectedProduct.name,
        priceGBP: args.selectedProduct.price,
      },
      currency: "gbp",
      prompt: args.prompt,
      imageDataUrl: args.imageDataUrl,
      cart: [{ id: args.selectedProduct.id, name: args.selectedProduct.name, priceGBP: args.selectedProduct.price }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to create checkout session");
  return data.url as string;
}

/** Realistic mockup using YOUR photos in /public/product-tiles */
function RealProductPreview({
  type,
  imageDataUrl,
}: {
  type: MerchType;
  imageDataUrl: string | null;
}) {
  // map to your actual filenames
  const fileMap: Record<MerchType, string> = {
    tshirt: "/product-tiles/tee.jpg",
    mug: "/product-tiles/mug.jpg",
    card: "/product-tiles/card.jpg",
    hoodie: "/product-tiles/hoodie.jpg",
  };

  // overlay placements (tweak later if needed)
  const overlay: Record<MerchType, React.CSSProperties> = {
    card: { top: "23%", left: "36%", width: "28%", height: "52%" },
    tshirt: { top: "30%", left: "34%", width: "32%", height: "38%" },
    mug: { top: "32%", left: "35%", width: "30%", height: "33%" },
    hoodie: { top: "30%", left: "34%", width: "32%", height: "38%" },
  };

  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-black/10 bg-white">
      <img src={fileMap[type]} className="absolute inset-0 w-full h-full object-cover" alt="Product mockup" />
      {imageDataUrl && (
        <motion.img
          key={imageDataUrl}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          src={imageDataUrl}
          alt="Applied design"
          className="absolute rounded-xl shadow-xl border border-black/10 bg-white"
          style={{ ...(overlay[type] as any), objectFit: "cover" }}
        />
      )}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/0 via-black/0 to-black/10" />
    </div>
  );
}

export default function MerchGeneratorPlatform() {
  const [view, setView] = useState<"home" | "catalog">("home");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [prompt, setPrompt] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // We keep upload UI for later, but generation uses prompt only (to avoid rewriting your API route today).
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[2]); // default: card
  const [selectedColor, setSelectedColor] = useState(PRODUCTS[2].colors[0]);

  const [cartCount, setCartCount] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsBusy(true);
    try {
      const imageDataUrl = await generateViaKeepsyAPI(prompt);
      setGeneratedImage(imageDataUrl);
      setStep(2);
      setView("home");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddToCart = () => {
    setCartCount((p) => p + 1);
    setStep(3);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#F7F1EB] text-[#23211F] selection:bg-indigo-100 overflow-x-hidden">
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
      <nav className="fixed top-0 w-full z-50 bg-white/75 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            setView("home");
            setStep(1);
          }}
        >
          {/* YOUR REAL LOGO */}
          <img src="/logo.png" alt="Keepsy" className="w-10 h-10 rounded-xl shadow-sm border border-black/5 bg-white" />
          <span className="font-extrabold text-2xl tracking-tight">keepsy</span>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-black/60">
            <button onClick={() => setView("home")} className={view === "home" ? "text-black" : ""}>
              Create
            </button>
            <button onClick={() => setView("catalog")} className={view === "catalog" ? "text-black" : ""}>
              Catalog
            </button>
          </div>

          <div className="flex items-center gap-2 bg-black/5 hover:bg-black/10 transition-all px-4 py-2 rounded-full">
            <ShoppingCart size={18} className="text-black/70" />
            <motion.span
              key={cartCount}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              className="font-extrabold text-sm"
            >
              {cartCount}
            </motion.span>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <div className="space-y-20">
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
                    Keep what matters —
                    <br />
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)" }}>
                      turn it into a gift.
                    </span>
                  </motion.h1>

                  <motion.p variants={fadeInUp} className="text-lg text-black/55 mb-10 max-w-2xl leading-relaxed">
                    Describe a memory or upload a photo. Keepsy generates a beautiful keepsake and applies it to real product mockups instantly.
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
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={uploadedImage ? "Add instructions for your photo..." : "Describe your gift image…"}
                            className="flex-1 py-4 outline-none text-base md:text-lg placeholder:text-black/25 font-semibold bg-transparent"
                          />

                          <div className="flex items-center gap-2 border-l border-black/5 pl-4 ml-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                                uploadedImage ? "bg-black/5 text-black" : "text-black/45 hover:bg-black/5 hover:text-black"
                              }`}
                              title="Upload a photo (UI only for now)"
                            >
                              <Upload size={20} />
                              {uploadedImage && <span className="text-xs font-extrabold hidden sm:inline">Photo added</span>}
                            </button>
                          </div>
                        </div>

                        <motion.button
                          onClick={handleGenerate}
                          disabled={!prompt || isBusy}
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
                              Generate <ArrowRight size={20} />
                            </>
                          )}
                        </motion.button>
                      </div>

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
                              Upload UI is enabled — we’ll wire photo-to-image properly next.
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
                      <motion.div key={label} whileHover={{ scale: 1.06, opacity: 1 }} className="flex flex-col items-center gap-2">
                        <Icon size={28} />
                        <span className="font-extrabold text-xs uppercase tracking-widest">{label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && generatedImage && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
                >
                  <div className="lg:col-span-7 sticky top-24">
                    <RealProductPreview type={selectedProduct.type} imageDataUrl={generatedImage} />
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
                            className="w-full py-4 bg-black text-white rounded-2xl font-black flex items-center justify-center gap-2"
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
                      You’re about to buy: <span className="text-black">{selectedProduct.name}</span>
                    </p>

                    <motion.button
                      onClick={handleCheckout}
                      disabled={isBusy || !generatedImage}
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
                            {isBusy ? "Redirecting…" : `Pay ${gbp(selectedProduct.price)}`} <ArrowRight />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <button onClick={() => setStep(2)} className="mt-4 text-sm font-extrabold text-black/55 hover:text-black inline-flex items-center gap-2">
                      <ChevronLeft size={16} /> Back
                    </button>
                  </div>

                  <div className="bg-white/70 border border-black/10 rounded-[32px] p-7 shadow-sm">
                    <h3 className="text-xl font-black mb-4">Order Summary</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-black/10 bg-white">
                        {generatedImage ? <img src={generatedImage} className="w-full h-full object-cover" alt="thumb" /> : null}
                      </div>
                      <div>
                        <div className="font-extrabold">{selectedProduct.name}</div>
                        <div className="text-sm text-black/55 font-semibold">Custom AI-generated design</div>
                      </div>
                      <div className="ml-auto font-black">{gbp(selectedProduct.price)}</div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-black/10 space-y-2 text-sm font-semibold text-black/60">
                      <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                      <div className="flex justify-between text-black font-black text-base pt-2"><span>Total</span><span>{gbp(selectedProduct.price)}</span></div>
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
        </AnimatePresence>
      </main>
    </div>
  );
}