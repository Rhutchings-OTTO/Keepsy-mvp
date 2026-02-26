"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Recipient = "Mom" | "Dad" | "Grandma" | "Grandpa" | "Partner" | "Friend";
type Theme = "Warm, sentimental" | "Minimal, modern" | "Classic portrait" | "Playful, cute";
type ProductId = "card" | "tee" | "mug" | "hoodie";

type Product = {
  id: ProductId;
  name: string;
  fromText: string;
  priceFrom: number;
};

const PRODUCTS: Product[] = [
  { id: "card", name: "Greeting card", fromText: "from", priceFrom: 8 },
  { id: "tee", name: "Premium tee", fromText: "from", priceFrom: 29 },
  { id: "mug", name: "Mug", fromText: "from", priceFrom: 14 },
  { id: "hoodie", name: "Hoodie", fromText: "from", priceFrom: 40 },
];

const INK = "#23211F";
const MUTED = "rgba(35,33,31,0.62)";
const BORDER = "rgba(35,33,31,0.12)";

const pastelGradient =
  "linear-gradient(90deg, rgba(124,199,230,0.95) 0%, rgba(169,210,176,0.95) 25%, rgba(241,197,141,0.95) 55%, rgba(233,156,150,0.95) 75%, rgba(176,132,200,0.95) 100%)";

function moneyGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function SoftSurface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border ${className}`}
      style={{
        background: "rgba(255,255,255,0.60)",
        borderColor: BORDER,
        backdropFilter: "blur(10px)",
        boxShadow: "0 30px 80px rgba(35,33,31,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function GradientButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${className}`}
      style={{ backgroundImage: pastelGradient }}
    >
      {/* subtle sheen */}
      <span
        className="pointer-events-none absolute -inset-x-10 -top-10 h-20 rotate-12 opacity-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
        }}
      />
      {children}
    </motion.button>
  );
}

function OutlineButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={onClick}
      className="rounded-full px-5 py-3 text-sm font-semibold"
      style={{
        background: "rgba(255,255,255,0.60)",
        border: `1px solid ${BORDER}`,
        color: INK,
      }}
    >
      {children}
    </motion.button>
  );
}

function ProductTile({ id, imageSrc }: { id: ProductId; imageSrc: string | null }) {
  const base = `/product-tiles/${id}.jpg`;

  const overlayById: Record<ProductId, CSSProperties> = {
    card: { top: "20%", left: "28%", width: "44%", height: "52%" },
    tee: { top: "26%", left: "33%", width: "34%", height: "40%" },
    mug: { top: "26%", left: "30%", width: "40%", height: "44%" },
    hoodie: { top: "28%", left: "33%", width: "34%", height: "40%" },
  };

  const [missingBase, setMissingBase] = useState(false);

  return (
    <div className="relative h-[210px] w-full overflow-hidden rounded-2xl border" style={{ borderColor: BORDER }}>
      {!missingBase ? (
        <img
          src={base}
          className="absolute inset-0 h-full w-full object-cover"
          alt=""
          onError={() => setMissingBase(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 px-6 text-center text-xs" style={{ color: MUTED }}>
          Missing image: <span className="ml-1 font-mono">{base}</span>
          <div className="mt-2">Put it in <span className="font-mono">/public/product-tiles/</span> and push to GitHub.</div>
        </div>
      )}

      {imageSrc && !missingBase && (
        <motion.img
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          src={imageSrc}
          alt="Design preview"
          className="absolute rounded-lg shadow-lg"
          style={{
            ...(overlayById[id] as CSSProperties),
            objectFit: "cover",
            border: "1px solid rgba(0,0,0,0.10)",
            background: "white",
          }}
        />
      )}
    </div>
  );
}

export default function Page() {
  const [recipient, setRecipient] = useState<Recipient>("Mom");
  const [theme, setTheme] = useState<Theme>("Warm, sentimental");
  const [details, setDetails] = useState(
    "Tell me what makes this person special, and I’ll create a unique, heartfelt image just for them…"
  );

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [cart, setCart] = useState<Product[]>([]);
  const cartTotal = useMemo(() => cart.reduce((sum, p) => sum + p.priceFrom, 0), [cart]);

  function buildPrompt() {
    return `Create a ${theme.toLowerCase()} keepsake image as a gift for my ${recipient}. Details: ${details}. Clean background, print-ready, sentimental and tasteful.`;
  }

  async function generate() {
    setLoading(true);
    setImageDataUrl(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(),
          style: theme.includes("Minimal") ? "minimal" : theme.includes("Classic") ? "oil" : "watercolor",
          quality: "high",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate image");
      setImageDataUrl(data.imageDataUrl);
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    if (!imageDataUrl) return alert("Generate your image first.");
    if (cart.length === 0) return alert("Add at least one item to cart.");

    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: { id: "bundle", name: `Keepsy order (${cart.length} items)`, priceGBP: cartTotal },
          prompt: buildPrompt(),
          imageDataUrl,
          currency: "gbp",
          cart: cart.map((p) => ({ id: p.id, name: p.name, priceGBP: p.priceFrom })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create checkout");
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: INK }}>
      {/* premium ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-[-120px] top-[-120px] h-[380px] w-[380px] rounded-full blur-3xl opacity-30"
          style={{ background: "rgba(124,199,230,0.8)" }}
        />
        <div
          className="absolute right-[-140px] top-[40px] h-[420px] w-[420px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(241,197,141,0.85)" }}
        />
        <div
          className="absolute left-[25%] bottom-[-180px] h-[520px] w-[520px] rounded-full blur-3xl opacity-20"
          style={{ background: "rgba(176,132,200,0.9)" }}
        />
      </div>

      <div className="mx-auto max-w-[1160px] px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Keepsy"
              className="h-7 w-auto"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
            <div className="text-sm font-medium" style={{ color: "rgba(35,33,31,0.82)" }}>
              keepsy
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OutlineButton onClick={() => alert("MVP: Sign in later.")}>Sign in</OutlineButton>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm"
              style={{ background: "rgba(35,33,31,0.20)" }}
              onClick={() => document.getElementById("create")?.scrollIntoView({ behavior: "smooth" })}
            >
              Start
            </motion.button>
          </div>
        </motion.div>

        {/* Hero + Creator */}
        <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h1 className="text-[52px] leading-[1.02] font-semibold tracking-tight">
              Keep what matters — <br />
              turn it into a gift.
            </h1>

            <p className="mt-5 max-w-[580px] text-[15px] leading-7" style={{ color: MUTED }}>
              Generate a heartfelt image that tells a story — families, pets, and more. Print it onto cards, mugs, tees,
              hoodies — and deliver to their door.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <GradientButton onClick={() => alert("MVP: examples next.")}>AI examples</GradientButton>
              <OutlineButton onClick={() => alert("MVP: example set next.")}>Sue examples</OutlineButton>
            </div>

            {/* Premium preview panel */}
            <div className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Generated preview</div>
                <div className="text-xs" style={{ color: MUTED }}>
                  This is what prints.
                </div>
              </div>

              <SoftSurface className="p-4">
                {!imageDataUrl ? (
                  <div className="rounded-2xl border bg-white/50 p-6 text-sm" style={{ borderColor: BORDER, color: MUTED }}>
                    Generate an image and it will appear here, and be applied to the products below.
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                    <img
                      src={imageDataUrl}
                      alt="Generated preview"
                      className="h-[320px] w-full rounded-2xl object-contain bg-white"
                      style={{ border: `1px solid ${BORDER}` }}
                    />
                  </motion.div>
                )}
              </SoftSurface>
            </div>
          </motion.div>

          {/* Creator card */}
          <motion.div
            id="create"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          >
            <SoftSurface className="p-6">
              <div className="text-sm font-semibold">Create your design</div>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <div className="text-xs font-medium" style={{ color: MUTED }}>
                    Who is your gift for?
                  </div>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value as Recipient)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.80)", border: `1px solid ${BORDER}` }}
                  >
                    {(["Mom", "Dad", "Grandma", "Grandpa", "Partner", "Friend"] as Recipient[]).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <div className="text-xs font-medium" style={{ color: MUTED }}>
                    Style / theme
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as Theme)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.80)", border: `1px solid ${BORDER}` }}
                  >
                    {(["Warm, sentimental", "Minimal, modern", "Classic portrait", "Playful, cute"] as Theme[]).map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="grid gap-2">
                  <div className="text-xs font-medium" style={{ color: MUTED }}>
                    Tell me what makes them special…
                  </div>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="min-h-[140px] w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.80)", border: `1px solid ${BORDER}` }}
                  />
                </label>

                <GradientButton disabled={loading} onClick={generate} className="w-full">
                  {loading ? "Generating…" : "Continue"}
                </GradientButton>

                <div className="text-xs" style={{ color: MUTED }}>
                  Tip: include names, a memory, and a “why it matters”. It produces dramatically better outputs.
                </div>
              </div>
            </SoftSurface>
          </motion.div>
        </section>

        {/* Products */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold">Put it on something</h2>
              <div className="mt-1 text-sm" style={{ color: MUTED }}>
                Your image is applied as a live preview.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="rounded-full px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.60)", border: `1px solid ${BORDER}` }}
              >
                <span style={{ color: MUTED }}>Cart:</span>{" "}
                <span className="font-semibold">{cart.length} item{cart.length === 1 ? "" : "s"}</span>{" "}
                <span className="mx-2" style={{ color: "rgba(35,33,31,0.18)" }}>
                  ·
                </span>{" "}
                <span className="font-semibold">{moneyGBP(cartTotal)}</span>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                style={{ background: "rgba(35,33,31,0.20)" }}
                disabled={loading || cart.length === 0 || !imageDataUrl}
                onClick={checkout}
              >
                Checkout
              </motion.button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="rounded-3xl border overflow-hidden"
                style={{ background: "rgba(255,255,255,0.60)", borderColor: BORDER }}
              >
                <div className="p-4">
                  <ProductTile id={p.id} imageSrc={imageDataUrl} />
                </div>

                <div className="px-5 pb-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs" style={{ color: MUTED }}>
                        {p.fromText} {moneyGBP(p.priceFrom)}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundImage: pastelGradient }}
                      onClick={() => setCart((c) => [...c, p])}
                    >
                      Add
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-xs" style={{ color: MUTED }}>
            Free U.K. shipping · 100% happiness guarantee
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 flex items-center justify-between text-xs" style={{ color: MUTED }}>
          <div className="font-medium">Keepsy 2024</div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:opacity-80">About</a>
            <a href="#" className="hover:opacity-80">Support</a>
            <a href="#" className="hover:opacity-80">Privacy</a>
          </div>
        </footer>
      </div>
    </main>
  );
}