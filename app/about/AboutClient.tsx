"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Star, Sparkles, Heart, Leaf, ShieldCheck, Package, Truck, RefreshCcw, Lock } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── 1. Hero ──────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative h-[480px] md:h-[600px] overflow-hidden">
      {/* Background image — high resolution, warm friendship energy */}
      <img
        src="https://images.unsplash.com/photo-1536010305525-f7aa0834e2c7?w=1600&q=90"
        alt="Women laughing together, warm friendship"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Warm dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(30,18,10,0.35) 0%, rgba(30,18,10,0.62) 60%, rgba(30,18,10,0.75) 100%)",
        }}
      />
      {/* Text */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
          >
            Our Story
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white md:text-6xl md:leading-[1.1]">
            Made by a Son,<br className="hidden sm:block" /> for the People You Love
          </h1>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 2. Origin Story ─────────────────────────────────────────────────── */

function OriginStory() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="grid gap-14 md:grid-cols-2 md:gap-20 md:items-center">
        {/* Text */}
        <FadeIn>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
            How it started
          </p>
          <h2 className="mb-7 font-serif text-3xl font-bold leading-tight text-charcoal md:text-4xl">
            We started with a simple question
          </h2>
          <div className="space-y-5 text-charcoal/70 leading-relaxed">
            <p>
              Keepsy was born out of a very ordinary moment. Rory was looking
              for a birthday gift for his mum — something personal, something
              that said "I really see you." Everything he found was either too
              generic or too complicated. The custom options required design
              software he didn't have. The nice things were too expensive. The
              affordable things looked cheap.
            </p>
            <p>
              He told his mate Dan about it. Dan had the exact same problem —
              he'd been trying to find something meaningful for his mum for
              Mother's Day. So together, they built the thing they both wished
              existed. A place where you could describe a memory in plain
              English — or just upload a photo — and see it transformed into
              something genuinely beautiful. Something you'd be proud to give.
              Something she'd actually love.
            </p>
            <p>
              Today, Keepsy has helped thousands of families turn their most
              cherished moments into keepsakes. Every mug, every card, every
              hoodie starts the same way: with a memory that deserved to be
              kept.
            </p>
          </div>

          {/* Dan's quote */}
          <blockquote
            className="mt-8 border-l-2 pl-5"
            style={{ borderColor: "var(--color-terracotta)" }}
          >
            <p className="font-serif text-base italic leading-relaxed text-charcoal/80">
              "We just wanted to make our mums smile. Turns out, a lot of
              people feel the same way."
            </p>
            <footer
              className="mt-2 text-sm font-medium"
              style={{ color: "var(--color-terracotta)" }}
            >
              — Dan, Co-Founder of Keepsy
            </footer>
          </blockquote>

          <Link
            href="/create"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full px-8 text-sm font-semibold text-white shadow-[0_16px_32px_-16px_rgba(196,113,74,0.45)] transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Create Your First Keepsake
          </Link>
        </FadeIn>

        {/* Founder illustration */}
        <FadeIn delay={0.15}>
          <div
            className="overflow-hidden rounded-[2rem] shadow-xl"
            style={{ backgroundColor: "#FDF6EE" }}
          >
            <img
              src="/images/about/founders-illustration.png"
              alt="Rory and Dan, co-founders of Keepsy"
              className="aspect-square w-full object-contain"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 3. Mission Statement ─────────────────────────────────────────────── */

function MissionStatement() {
  return (
    <section
      className="relative overflow-hidden py-24 md:py-36"
      style={{ backgroundColor: "var(--color-forest)" }}
    >
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-8 text-center">
        <FadeIn>
          <p
            className="font-serif text-2xl font-bold leading-snug md:text-4xl md:leading-[1.3]"
            style={{ color: "var(--color-cream)" }}
          >
            "The best gift isn't the most expensive one.{" "}
            <br className="hidden md:block" />
            It's the one that says:{" "}
            <em>I remembered.</em>"
          </p>
          <p
            className="mt-6 text-sm font-medium"
            style={{ color: "rgba(253,246,238,0.55)" }}
          >
            — Rory &amp; Dan, Co-Founders of Keepsy
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 4. Values ────────────────────────────────────────────────────────── */

const VALUES = [
  {
    icon: Star,
    title: "Quality First",
    body: "Premium materials, vivid prints, products that feel luxurious when you hold them.",
  },
  {
    icon: Sparkles,
    title: "Effortlessly Personal",
    body: "Anyone can create something beautiful. No design skills required.",
  },
  {
    icon: Heart,
    title: "Made with Intention",
    body: "Every product is made to order. Nothing sits in a warehouse.",
  },
  {
    icon: Leaf,
    title: "Planet-Conscious",
    body: "Print-on-demand means zero waste. We only make what's needed.",
  },
];

function ValuesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <FadeIn className="mb-12 text-center">
        <h2 className="font-serif text-3xl font-bold text-charcoal md:text-4xl">
          What We Stand For
        </h2>
      </FadeIn>
      <div ref={ref} className="grid gap-6 sm:grid-cols-2">
        {VALUES.map(({ icon: Icon, title, body }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.55,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]"
          >
            <div
              className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(196,113,74,0.12)" }}
            >
              <Icon size={22} style={{ color: "var(--color-terracotta)" }} />
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold text-charcoal">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-charcoal/65">{body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── 5. By the Numbers ────────────────────────────────────────────────── */

const STATS = [
  { value: "Thousands", label: "Happy Customers" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "2 Countries", label: "US & UK Delivery" },
  { value: "0 Waste", label: "Print on Demand" },
];

function StatItem({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="text-center">
      <p
        className={`font-serif text-4xl font-bold md:text-5xl transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ color: "var(--color-terracotta)" }}
      >
        {value}
      </p>
      <p
        className={`mt-2 text-sm font-medium transition-all duration-700 delay-100 ${
          inView ? "opacity-100" : "opacity-0"
        }`}
        style={{ color: "rgba(45,41,38,0.55)" }}
      >
        {label}
      </p>
    </div>
  );
}

function ByTheNumbers() {
  return (
    <section
      className="py-20 md:py-28"
      style={{ backgroundColor: "#F5EDE0" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold text-charcoal md:text-4xl">
            The Keepsy Promise
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <StatItem key={label} value={value} label={label} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Our Promise ───────────────────────────────────────────────────── */

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    body: "Not happy? We'll make it right.",
  },
  {
    icon: Package,
    title: "Gift-Ready Always",
    body: "Every order arrives beautifully packaged.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    body: "US & UK shipping within 5–7 business days.",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    body: "30-day no-questions-asked returns.",
  },
  {
    icon: Lock,
    title: "Secure Checkout",
    body: "Stripe-powered, bank-level security.",
  },
  {
    icon: Heart,
    title: "Made with Love",
    body: "Every product is a little piece of art.",
  },
];

function OurPromise() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold text-charcoal md:text-4xl">
            Our Promise to You
          </h2>
        </FadeIn>
        <div ref={ref} className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-start gap-4"
            >
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(196,113,74,0.1)" }}
              >
                <Icon size={18} style={{ color: "var(--color-terracotta)" }} />
              </div>
              <div>
                <h3 className="mb-1 font-serif text-base font-bold text-charcoal">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-charcoal/60">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 7. CTA Section ───────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section
      className="py-20 md:py-28"
      style={{ backgroundColor: "var(--color-terracotta)" }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <h2 className="mb-4 font-serif text-3xl font-bold text-white md:text-5xl">
            Ready to Create Something Beautiful?
          </h2>
          <p className="mb-10 text-base" style={{ color: "rgba(253,246,238,0.8)" }}>
            Join thousands of families who've turned their favourite memories into
            keepsakes.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-white px-8 text-sm font-semibold transition hover:bg-cream sm:w-auto"
              style={{ color: "var(--color-terracotta)" }}
            >
              Shop Our Collection
            </Link>
            <Link
              href="/create"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-white bg-white px-8 text-sm font-semibold transition hover:bg-cream sm:w-auto"
              style={{ color: "var(--color-terracotta)" }}
            >
              Start Creating for Free
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Page assembly ────────────────────────────────────────────────────── */

export function AboutClient() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <OriginStory />
      <MissionStatement />
      <ValuesSection />
      <ByTheNumbers />
      <OurPromise />
      <CTASection />
    </div>
  );
}
