"use client";

// HeroPromptVisual — homepage hero visual hook (typed-out example prompts).
//
// Visual-only mimic of CreateModePanel (the real "Describe / Upload" tabs on
// /create). Click anywhere on this card routes the visitor to /create.
// No generation, upload, or prompt-state logic lives on the homepage.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ImageIcon, WandSparkles } from "lucide-react";

const ROTATING_EXAMPLES = [
  "A golden retriever in a chef's hat baking cookies",
  "Mum and Dad's wedding photo as an oil painting",
  "Our anniversary date in elegant calligraphy",
  "A watercolour portrait of our cat Bella",
];

// Typewriter timings (ms): type each prompt out, hold, erase, then the next.
const TYPE_MS = 55;
const ERASE_MS = 22;
const HOLD_MS = 1900;
const GAP_MS = 350;

type Phase = "typing" | "holding" | "erasing";

export function HeroPromptVisual() {
  const reduceMotion = useReducedMotion();
  // Start with the first prompt fully shown so the server HTML has text and
  // matches the client's first render (reduced motion included); the
  // typewriter loop begins after the first hold.
  const [exampleIndex, setExampleIndex] = useState(0);
  const [typed, setTyped] = useState(ROTATING_EXAMPLES[0].length);
  const [phase, setPhase] = useState<Phase>("holding");

  const full = ROTATING_EXAMPLES[exampleIndex];

  useEffect(() => {
    if (reduceMotion) return;
    let id: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      id =
        typed < full.length
          ? setTimeout(() => setTyped((n) => n + 1), TYPE_MS)
          : setTimeout(() => setPhase("holding"), 0);
    } else if (phase === "holding") {
      id = setTimeout(() => setPhase("erasing"), HOLD_MS);
    } else if (typed > 0) {
      id = setTimeout(() => setTyped((n) => n - 1), ERASE_MS);
    } else {
      id = setTimeout(() => {
        setExampleIndex((i) => (i + 1) % ROTATING_EXAMPLES.length);
        setPhase("typing");
      }, GAP_MS);
    }
    return () => clearTimeout(id);
  }, [reduceMotion, phase, typed, full.length]);

  // Reduced motion: the effect never runs, so the first prompt stays in full.
  const shown = full.slice(0, typed);

  return (
    <Link
      href="/create"
      aria-label="Open the personalisation flow"
      className="group block rounded-3xl border border-charcoal/10 bg-white p-5 shadow-[0_18px_44px_-22px_rgba(45,41,38,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-22px_rgba(45,41,38,0.24)] sm:p-6"
    >
      {/* Tab pill — Describe / Photo */}
      <div
        className="inline-flex rounded-2xl border border-charcoal/10 p-1"
        style={{ backgroundColor: "var(--color-cream)" }}
        aria-hidden
      >
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-charcoal shadow-sm">
          <WandSparkles size={13} style={{ color: "var(--color-terracotta)" }} />
          Describe a gift
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-charcoal/55">
          <ImageIcon size={13} />
          Use a photo
        </span>
      </div>

      {/* Fake textarea with a typed-out example prompt */}
      <div
        className="mt-4 min-h-[112px] rounded-2xl border border-charcoal/10 bg-white px-4 py-3 transition-colors group-hover:border-charcoal/20 sm:min-h-[128px]"
        style={{ backgroundColor: "rgba(253,246,238,0.65)" }}
      >
        <p
          aria-hidden
          className="text-base leading-7 text-charcoal/45 sm:text-[17px]"
        >
          {shown}
          <span
            className={`ml-0.5 inline-block h-[1.05em] w-[2px] -translate-y-[1px] align-middle ${
              phase === "holding" ? "hero-prompt-caret" : ""
            }`}
            style={{ backgroundColor: "var(--color-terracotta)" }}
          />
        </p>
      </div>

      {/* CTA-like footer row inside the card */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-charcoal/55">
          2 free designs every day. No card required.
        </p>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: "var(--color-terracotta)" }}
        >
          Try it →
        </span>
      </div>

      {/* Local styles — caret blinks while a prompt is held */}
      <style>{`
        @keyframes hero-prompt-caret-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .hero-prompt-caret {
          animation: hero-prompt-caret-blink 1.05s steps(1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-prompt-caret {
            animation: none;
          }
        }
      `}</style>
    </Link>
  );
}
