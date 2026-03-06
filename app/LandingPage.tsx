"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Gift, ImageIcon, ShieldCheck, Sparkles } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import { DynamicLogo } from "@/components/DynamicLogo";
import RegionSelector from "@/components/RegionSelector";
import { MockupStage } from "@/components/mockups/MockupStage";
import { getRegion, setRegion, type Region } from "@/lib/region";
import { CREATE_EXAMPLES } from "@/content/createExamples";

const PremiumGateway = dynamic(
  () => import("@/components/PremiumGateway").then((mod) => mod.PremiumGateway),
  { ssr: false }
);

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-6";

const HERO_BULLETS = [
  "Write your idea in everyday language",
  "Upload a photo if you already have one",
  "Preview it on cards, mugs, hoodies and tees",
];

const TRUST_POINTS = [
  { title: "Clear and simple", body: "Everything is explained in plain English, with no design jargon." },
  { title: "Preview before you buy", body: "You see the artwork on the real product before checkout." },
  { title: "Premium print feel", body: "Examples are tuned for soft, gift-ready finishes rather than harsh AI styling." },
];

const STEPS = [
  {
    title: "Bring the memory",
    body: "Start with a photo, a person, a pet, a home, or a moment you want to turn into something meaningful.",
    icon: ImageIcon,
  },
  {
    title: "Choose the style",
    body: "Keepsy turns it into polished artwork and lets you compare versions without feeling overwhelmed.",
    icon: Sparkles,
  },
  {
    title: "Order the keepsake",
    body: "Pick the product you want and order only when the preview looks genuinely gift-worthy.",
    icon: Gift,
  },
];

const REVIEWS = [
  {
    name: "Helen, 54",
    quote: "The mug preview looked like a proper finished gift, not just a picture dropped onto a template.",
  },
  {
    name: "Rachel, 47",
    quote: "I liked that it felt guided. I always knew what to do next.",
  },
  {
    name: "Emma, 51",
    quote: "The card example sold it for me. It felt warm, polished and easy to trust.",
  },
];

type LandingPageProps = {
  initialRegion?: Region | null;
};

function FlowStage({
  label,
  image,
  alt,
  tone,
}: {
  label: string;
  image: string;
  alt: string;
  tone: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/8 bg-white/78 p-3 shadow-[0_16px_36px_-28px_rgba(23,18,12,0.38)] backdrop-blur-md">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">{label}</p>
      <div
        className="relative overflow-hidden rounded-[1.2rem] border border-black/8"
        style={{ background: tone }}
      >
        <Image src={image} alt={alt} width={320} height={320} className="h-32 w-full object-cover" />
      </div>
    </div>
  );
}

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const router = useRouter();
  const [region, setCurrentRegion] = useState<Region | null>(() => initialRegion ?? getRegion());
  const [showGateway, setShowGateway] = useState<boolean>(() => {
    const resolvedRegion = initialRegion ?? getRegion();
    return !resolvedRegion;
  });
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(28);
  const heroGlow = useMotionTemplate`radial-gradient(520px circle at ${glowX}% ${glowY}%, rgba(250, 225, 197, 0.58), transparent 58%)`;

  const activeRegion = region ?? "UK";
  const showcase = CREATE_EXAMPLES[activeRegion];
  const heroExample = showcase.beforeAfterTiles[0];
  const supportingExamples = showcase.beforeAfterTiles.slice(1, 3);
  const heroOccasions = showcase.occasionTiles.slice(0, 3);

  useEffect(() => {
    if (showGateway) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showGateway]);

  const handleSelectRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  const handleGatewayComplete = (nextRegion: Region) => {
    setCurrentRegion(nextRegion);
    setShowGateway(false);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#f6f1eb] text-[#201d1b] ${showGateway ? "fixed inset-0 h-screen" : ""}`}>
      {showGateway ? (
        <PremiumGateway onComplete={handleGatewayComplete} />
      ) : (
        <>
          <div className="fixed inset-0 z-0">
            <AuroraBackground />
          </div>

          <header className="relative z-30">
            <div className={`${CONTAINER} flex items-center justify-between py-5`}>
              <DynamicLogo href="/" width={148} className="text-[#201d1b]" />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegionSelectorOpen(true)}
                  className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-[#4f4944] shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-md"
                >
                  {activeRegion} shipping
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/create")}
                  className="hidden rounded-full bg-[#1f2937] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(17,24,39,0.5)] sm:inline-flex"
                >
                  Start now
                </button>
              </div>
            </div>
          </header>

          <main className="relative z-20">
            <section className="pb-20 pt-6 sm:pb-24 sm:pt-10">
              <div className={CONTAINER}>
                <motion.div
                  className="relative overflow-hidden rounded-[2.25rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,243,236,0.76))] p-5 shadow-[0_40px_110px_-56px_rgba(31,24,18,0.55)] backdrop-blur-xl sm:p-7"
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    glowX.set(((event.clientX - rect.left) / rect.width) * 100);
                    glowY.set(((event.clientY - rect.top) / rect.height) * 100);
                  }}
                  onMouseLeave={() => {
                    glowX.set(50);
                    glowY.set(28);
                  }}
                >
                  <motion.div className="pointer-events-none absolute inset-0" style={{ backgroundImage: heroGlow }} />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.36),transparent_40%,rgba(255,255,255,0.2)_75%,transparent)]" />
                  <div className="relative z-10 grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="max-w-xl"
                    >
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#d8cdc0] bg-white/78 px-3 py-1.5 text-sm font-medium text-[#62584e]">
                        <ShieldCheck size={16} className="text-[#8b6f47]" />
                        Personalised gifts without the faff
                      </div>
                      <h1 className="mt-6 font-serif text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.98] tracking-[-0.045em] text-[#1d1917]">
                        Turn a photo or memory into a premium keepsake.
                      </h1>
                      <p className="mt-5 max-w-lg text-lg leading-8 text-[#5e5852]">
                        Keepsy creates finished artwork and shows it on the actual product, so the whole process feels simple, warm and easy to trust.
                      </p>

                      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => router.push("/create")}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1f2937] px-6 text-base font-semibold text-white shadow-[0_18px_34px_-22px_rgba(17,24,39,0.6)]"
                        >
                          Create your gift
                          <ArrowRight size={18} />
                        </button>
                        <Link
                          href="/gift-ideas"
                          className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 bg-white/80 px-6 text-base font-semibold text-[#312d2a] shadow-[0_16px_34px_-24px_rgba(0,0,0,0.35)]"
                        >
                          Browse gift ideas
                        </Link>
                      </div>

                      <ul className="mt-8 space-y-3">
                        {HERO_BULLETS.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-[15px] leading-6 text-[#514b46]">
                            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#8b6f47] shadow-sm">
                              <Check size={14} />
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {heroOccasions.map((item) => (
                          <div key={`${item.id}-${item.productType}`} className="rounded-[1.35rem] border border-black/8 bg-white/72 p-3 shadow-[0_14px_30px_-24px_rgba(23,18,12,0.36)]">
                            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-black/8 bg-[#f7f0e8]">
                              <Image src={item.artworkImage} alt={item.chip} fill className="object-cover" sizes="48px" />
                            </div>
                            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">{item.id.replace(/-/g, " ")}</p>
                            <p className="mt-1 text-sm font-semibold text-[#26211d]">{item.chip}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
                      className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"
                    >
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <FlowStage
                          label="1. Original photo"
                          image={heroExample.beforeImage}
                          alt={heroExample.beforeLabel}
                          tone="linear-gradient(145deg,#f9dfd2 0%,#fffaf5 55%,#efe9e3 100%)"
                        />
                        <FlowStage
                          label="2. Artwork style"
                          image={heroExample.afterImage}
                          alt={heroExample.afterLabel}
                          tone="linear-gradient(145deg,#e8eef8 0%,#f4f7fb 55%,#ece7df 100%)"
                        />
                      </div>

                      <div className="rounded-[1.7rem] border border-black/8 bg-white/74 p-4 shadow-[0_22px_46px_-28px_rgba(23,18,12,0.38)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">3. Final keepsake</p>
                            <h2 className="mt-2 text-xl font-semibold text-[#201d1b]">Photo to artwork to gift</h2>
                          </div>
                          <div className="rounded-full border border-black/8 bg-[#fbf7f2] px-3 py-1 text-xs font-semibold text-[#6f655d]">
                            Preview first
                          </div>
                        </div>
                        <div className="mt-4">
                          <MockupStage
                            productType={heroExample.gift.productType}
                            color={heroExample.gift.color}
                            generatedImage={heroExample.gift.artworkImage}
                            className="!rounded-[1.6rem]"
                          />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {supportingExamples.map((example) => (
                            <div key={example.caption} className="rounded-[1.25rem] border border-black/8 bg-[#faf6f0] p-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-black/8 bg-white">
                                  <Image src={example.afterImage} alt={example.afterLabel} fill className="object-cover" sizes="48px" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">{example.gift.productType}</p>
                                  <p className="text-sm font-semibold text-[#26211d]">{example.caption}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </section>

            <section className="pb-18 sm:pb-24">
              <div className={CONTAINER}>
                <div className="grid gap-4 md:grid-cols-3">
                  {TRUST_POINTS.map((point) => (
                    <article
                      key={point.title}
                      className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.3)] backdrop-blur-md"
                    >
                      <h2 className="text-xl font-semibold text-[#201d1b]">{point.title}</h2>
                      <p className="mt-3 text-[15px] leading-7 text-[#5e5852]">{point.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="pb-18 sm:pb-24">
              <div className={CONTAINER}>
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b7f74]">How it works</p>
                  <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-[#1f1a17] sm:text-5xl">
                    A simple path from memory to finished gift.
                  </h2>
                </div>
                <div className="mt-10 grid gap-4 lg:grid-cols-3">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <article
                        key={step.title}
                        className="rounded-[30px] border border-black/8 bg-white/82 p-6 shadow-[0_20px_46px_-36px_rgba(0,0,0,0.34)] backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe4d7] text-[#8b6f47]">
                            <Icon size={18} />
                          </div>
                          <span className="text-sm font-semibold text-[#8a7c71]">Step {index + 1}</span>
                        </div>
                        <h3 className="mt-6 text-xl font-semibold text-[#201d1b]">{step.title}</h3>
                        <p className="mt-3 text-[15px] leading-7 text-[#5e5852]">{step.body}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section id="reviews" className="pb-20 sm:pb-24">
              <div className={CONTAINER}>
                <div className="rounded-[36px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_56px_-40px_rgba(0,0,0,0.36)] backdrop-blur-md sm:p-8">
                  <div className="max-w-2xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b7f74]">Reviews</p>
                    <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#1f1a17] sm:text-4xl">
                      Trusted by people who want something personal, not complicated.
                    </h2>
                  </div>
                  <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {REVIEWS.map((review) => (
                      <article key={review.name} className="rounded-[28px] bg-[#fbf7f2] p-5">
                        <p className="text-base leading-7 text-[#47413c]">&quot;{review.quote}&quot;</p>
                        <p className="mt-4 text-sm font-semibold text-[#7a6f66]">{review.name}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>

          <footer className="relative z-20 border-t border-black/8 bg-white/65 py-10 backdrop-blur-md">
            <div className={`${CONTAINER} flex flex-col gap-5 text-sm text-[#5d5650] sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                <p className="font-semibold text-[#27221f]">Keepsy</p>
                <p className="mt-1">Beautiful personalised gifts, made simple.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/gift-ideas" className="hover:text-[#1f1a17]">Gift ideas</Link>
                <Link href="/create" className="hover:text-[#1f1a17]">Create</Link>
                <Link href="/terms" className="hover:text-[#1f1a17]">Terms</Link>
                <Link href="/privacy" className="hover:text-[#1f1a17]">Privacy</Link>
              </div>
            </div>
          </footer>

          <RegionSelector
            open={isRegionSelectorOpen}
            onSelect={(nextRegion) => {
              handleSelectRegion(nextRegion);
              setIsRegionSelectorOpen(false);
            }}
            onClose={region ? () => setIsRegionSelectorOpen(false) : undefined}
            currentRegion={activeRegion}
          />
        </>
      )}
    </div>
  );
}
