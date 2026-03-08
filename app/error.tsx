"use client";

import { useEffect } from "react";
import { MagneticLink } from "@/components/ui/MagneticLink";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* Forest hero strip */}
      <section
        className="relative overflow-hidden py-24 sm:py-32 text-center"
        style={{ backgroundColor: "var(--color-forest)" }}
      >
        {/* Background "500" watermark */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif font-bold select-none"
          style={{
            fontSize: "clamp(10rem, 30vw, 22rem)",
            color: "rgba(255,255,255,0.04)",
            lineHeight: 1,
          }}
        >
          500
        </span>

        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
            Unexpected error
          </p>
          <h1
            className="mt-4 font-serif font-bold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Something went wrong
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-base leading-8 text-white/65">
            Our team has been notified. Try refreshing the page, or head back home.
          </p>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--color-terracotta)" }}
          >
            What would you like to do?
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-8 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Try Again
            </button>
            <MagneticLink
              href="/"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-charcoal/15 px-8 text-sm font-semibold transition hover:bg-charcoal/5"
              style={{ color: "var(--color-charcoal)" }}
            >
              Go Home
            </MagneticLink>
          </div>
        </div>
      </section>
    </main>
  );
}
