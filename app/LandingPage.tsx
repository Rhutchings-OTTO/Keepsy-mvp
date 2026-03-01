"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import RegionSelector from "@/components/RegionSelector";
import { getLandingContent } from "@/content/landingContent";
import { getRegion, regionFromPathOrHost, setRegion, type Region } from "@/lib/region";

const FLOATING_EXAMPLES = [
  {
    id: "tee-white",
    label: "Premium Tee Mockup",
    product: "T-Shirt",
    image: "/product-tiles/tee-white.png",
    className: "hidden xl:block top-[10%] left-[2%] w-36 2xl:w-40",
  },
  {
    id: "plain-mug",
    label: "Plain Mug Mockup",
    product: "Mug",
    image: "/product-tiles/plain-mug-front.png",
    className: "hidden xl:block top-[12%] right-[2%] w-40 2xl:w-44",
  },
  {
    id: "plain-hoodie",
    label: "Plain Hoodie Mockup",
    product: "Hoodie",
    image: "/product-tiles/hoodie-white.png",
    className: "hidden xl:block bottom-[14%] left-[3%] w-44 2xl:w-48",
  },
  {
    id: "plain-card",
    label: "Plain Card Mockup",
    product: "Card",
    image: "/product-tiles/plain-card.png",
    className: "hidden xl:block bottom-[14%] right-[3%] w-36 2xl:w-40",
  },
  {
    id: "christmas-scene",
    label: "Christmas Scene",
    product: "Design",
    image: "/occasion-tiles/christmas-scene.png",
    className: "hidden 2xl:block top-[6%] right-[20%] w-36",
  },
  {
    id: "thanksgiving-scene",
    label: "Thanksgiving Cartoon",
    product: "Design",
    image: "/occasion-tiles/thanksgiving-cartoon.png",
    className: "hidden 2xl:block top-[38%] left-[0.5%] w-32",
  },
  {
    id: "fourth-july-scene",
    label: "Fourth of July Photo",
    product: "Design",
    image: "/occasion-tiles/fourth-july-photo.png",
    className: "hidden 2xl:block bottom-[4%] left-[20%] w-44",
  },
  {
    id: "anniversary-scene",
    label: "Anniversary Watercolor",
    product: "Design",
    image: "/occasion-tiles/anniversary-watercolor.png",
    className: "hidden 2xl:block top-[44%] right-[15%] w-36",
  },
  {
    id: "birthday-scene",
    label: "Birthday Scene",
    product: "Design",
    image: "/occasion-tiles/birthday-confetti.png",
    className: "hidden 2xl:block bottom-[32%] right-[0.5%] w-28",
  },
  {
    id: "pet-scene",
    label: "Pet Portrait Scene",
    product: "Design",
    image: "/occasion-tiles/pet-gifts-portrait.png",
    className: "hidden 2xl:block top-[26%] left-[16%] w-52",
  },
];

type LandingPageProps = {
  initialRegion?: Region | null;
};

export default function LandingPage({ initialRegion = null }: LandingPageProps) {
  const router = useRouter();
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [region, setActiveRegion] = useState<Region | null>(initialRegion);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [ripple, setRipple] = useState<{ active: boolean; x: number; y: number; to: string }>({
    active: false,
    x: 0,
    y: 0,
    to: "/create",
  });
  const pointerScale = useMemo(() => (isHovered ? 1 : 0.45), [isHovered]);
  const content = getLandingContent(region ?? "UK");

  useEffect(() => {
    const stored = getRegion() ?? regionFromPathOrHost();
    if (stored) {
      setActiveRegion(stored);
      setRegion(stored);
      return;
    }
    setSelectorOpen(true);
  }, []);

  const navigateWithRipple = (event: React.MouseEvent<HTMLButtonElement>, to: string) => {
    const x = event.clientX;
    const y = event.clientY;
    setRipple({ active: true, x, y, to });
    window.setTimeout(() => {
      router.push(to);
    }, 420);
  };

  const applyRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    setActiveRegion(nextRegion);
    setSelectorOpen(false);
  };

  const openCreateWithPrompt = (prompt: string) => {
    router.push(`/create?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FDFCFB] via-[#F8F2FB] to-[#EEF7FF] text-[#23211F]"
      onMouseMove={(event) => {
        const { innerWidth, innerHeight } = window;
        const x = ((event.clientX / innerWidth) * 100 - 50) * pointerScale;
        const y = ((event.clientY / innerHeight) * 100 - 50) * pointerScale;
        setCursorOffset({ x, y });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/35 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-10 right-[-2%] h-[32rem] w-[32rem] rounded-full bg-pink-300/32 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-200/24 blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, -24, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-8">
        <button
          type="button"
          onClick={() => setSelectorOpen(true)}
          className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:bg-white"
        >
          {region ?? "Choose"} region
        </button>
        <Image
          src="/keepsy-logo-transparent.png"
          alt="Keepsy"
          width={760}
          height={220}
          className="h-24 w-auto object-contain sm:h-28"
        />
        <button
          type="button"
          onClick={() => setSelectorOpen(true)}
          className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:bg-white"
        >
          Change region
        </button>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[82vh] max-w-7xl flex-col items-center justify-center gap-8 px-6 pb-14">
        <div className="relative z-20 max-w-4xl text-center">
          <p className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-indigo-600">
            AI-powered creativity • {content.region}
          </p>
          <h1 className="text-5xl font-black leading-[1.05] md:text-7xl">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-black/60">
            {content.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={(event) => navigateWithRipple(event, "/create")}
              className="rounded-2xl bg-black px-6 py-3 text-base font-black text-white shadow-lg transition hover:bg-black/90"
            >
              {content.primaryCta}
            </button>
            <button
              onClick={() => router.push("/gift-ideas")}
              className="rounded-2xl border border-black/15 bg-white/80 px-6 py-3 text-base font-bold text-black transition hover:bg-white"
            >
              Browse gift ideas
            </button>
          </div>

          <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-black/10 bg-white/70 p-5 text-left shadow-sm">
            <h2 className="text-lg font-black text-black/85">Suggested prompts</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {content.promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => openCreateWithPrompt(chip)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:border-black/25 hover:bg-white/90"
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          <section className="mx-auto mt-6 max-w-4xl rounded-3xl border border-black/10 bg-white/70 p-5 text-left shadow-sm">
            <h2 className="text-lg font-black text-black/85">Occasions coming up</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {content.holidayBadges.map((badge) => (
                <button
                  key={badge.label}
                  type="button"
                  onClick={() => openCreateWithPrompt(badge.prompts[0] ?? "")}
                  className="rounded-full border border-[#D9C7B5] bg-[#FBF7F3] px-3 py-1.5 text-xs font-semibold text-[#6C5948] transition hover:border-[#BEA48D]"
                >
                  {badge.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="relative z-20 w-full max-w-6xl rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm">
          <h2 className="text-2xl font-black text-black/85">Popular this season</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {content.seasonalBlocks.map((block) => (
              <article key={block.title} className="rounded-2xl border border-black/10 bg-white/90 p-4">
                <h3 className="text-base font-black text-black/80">{block.title}</h3>
                <p className="mt-1 text-sm font-medium text-black/60">{block.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {block.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => openCreateWithPrompt(prompt)}
                      className="rounded-full border border-black/10 bg-[#F8F4EF] px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:border-black/25"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          {FLOATING_EXAMPLES.map((example, i) => (
            <motion.div
              key={example.id}
              className={`absolute ${example.className} rounded-2xl border border-black/10 bg-white/80 p-2 shadow-xl backdrop-blur`}
              style={{
                x: cursorOffset.x * (0.24 + i * 0.015),
                y: cursorOffset.y * (0.24 + i * 0.015),
              }}
              animate={{ y: [0, i % 2 === 0 ? -12 : 12, 0], rotate: [0, i % 2 === 0 ? 1.4 : -1.4, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={example.image}
                alt={example.label}
                width={240}
                height={160}
                className="h-28 w-full rounded-xl object-cover"
              />
              <div className="mt-2 text-xs font-bold text-black/75">{example.label}</div>
              <div className="text-[11px] font-semibold text-black/50">{example.product} preview</div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-20 mx-auto mb-8 flex w-full max-w-7xl items-center justify-center">
        <button
          type="button"
          onClick={() => setSelectorOpen(true)}
          className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-black/60 hover:bg-white"
        >
          Change region ({region ?? "Unselected"})
        </button>
      </footer>

      {ripple.active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] bg-[#F7F1EB]"
          initial={{ clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)` }}
          animate={{ clipPath: `circle(220vmax at ${ripple.x}px ${ripple.y}px)` }}
          transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
        />
      )}
      <RegionSelector
        open={selectorOpen}
        onSelect={applyRegion}
        onClose={region ? () => setSelectorOpen(false) : undefined}
      />
    </div>
  );
}
