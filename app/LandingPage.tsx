"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const FLOATING_EXAMPLES = [
  {
    id: "family-tee",
    label: "Family Portrait Tee",
    product: "T-Shirt",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80",
    className: "hidden xl:block top-[10%] left-[2%] w-36 2xl:w-40",
  },
  {
    id: "pet-mug",
    label: "Pet Memory Mug",
    product: "Mug",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
    className: "hidden xl:block top-[12%] right-[2%] w-40 2xl:w-44",
  },
  {
    id: "cartoon-hoodie",
    label: "Cartoon Hoodie",
    product: "Hoodie",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    className: "hidden xl:block bottom-[14%] left-[3%] w-44 2xl:w-48",
  },
  {
    id: "kids-card",
    label: "Kids Art Card",
    product: "Card",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    className: "hidden xl:block bottom-[14%] right-[3%] w-36 2xl:w-40",
  },
  {
    id: "anniversary-card",
    label: "Anniversary Card",
    product: "Card",
    image:
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80",
    className: "hidden 2xl:block top-[6%] right-[20%] w-36",
  },
  {
    id: "baby-tee",
    label: "Baby Memory Tee",
    product: "T-Shirt",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80",
    className: "hidden 2xl:block top-[38%] left-[0.5%] w-32",
  },
  {
    id: "dog-hoodie",
    label: "Pet Hoodie",
    product: "Hoodie",
    image:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=80",
    className: "hidden 2xl:block bottom-[4%] left-[20%] w-44",
  },
  {
    id: "holiday-mug",
    label: "Holiday Mug",
    product: "Mug",
    image:
      "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&q=80",
    className: "hidden 2xl:block top-[44%] right-[15%] w-36",
  },
  {
    id: "kids-art-card",
    label: "Kids Art Card",
    product: "Card",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80",
    className: "hidden 2xl:block bottom-[32%] right-[0.5%] w-28",
  },
  {
    id: "family-hoodie",
    label: "Family Hoodie",
    product: "Hoodie",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
    className: "hidden 2xl:block top-[26%] left-[16%] w-52",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const pointerScale = useMemo(() => (isHovered ? 1 : 0.45), [isHovered]);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#FDFCFB] text-[#23211F]"
      role="button"
      tabIndex={0}
      aria-label="Enter Keepsy creation studio"
      onClick={() => router.push("/create")}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push("/create");
        }
      }}
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
          className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-20 right-0 h-96 w-96 rounded-full bg-pink-300/22 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-center px-6 py-8">
        <Image src="/keepsy-logo.svg" alt="Keepsy" width={480} height={128} className="h-24 w-auto object-contain" />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[82vh] max-w-7xl items-center justify-center px-6 pb-14">
        <div className="relative z-20 max-w-4xl text-center">
          <p className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-indigo-600">
            AI-powered creativity
          </p>
          <h1 className="text-5xl font-black leading-[1.05] md:text-7xl">
            Imagine it. Generate it.
            <br />
            <motion.span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)",
                backgroundSize: "220% auto",
                backgroundPosition: `${cursorOffset.x}px ${cursorOffset.y}px`,
              }}
              animate={{ backgroundSize: ["220% auto", "240% auto", "220% auto"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              Cherish it.
            </motion.span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-black/60">
            Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
          </p>
          <motion.p
            className="mx-auto mt-9 inline-block bg-clip-text text-lg font-extrabold text-transparent md:text-2xl"
            style={{
              backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)",
              backgroundSize: "220% auto",
              backgroundPosition: `${cursorOffset.x * 1.25}px ${cursorOffset.y * 1.25}px`,
            }}
            animate={{ backgroundSize: ["220% auto", "245% auto", "220% auto"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            Tap anywhere to start creating
          </motion.p>
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
    </div>
  );
}
