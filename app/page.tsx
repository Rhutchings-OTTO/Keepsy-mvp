import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PromoBanner } from "@/components/PromoBanner";
import { TrustBar } from "@/components/TrustBar";
import { Explainer } from "@/components/Explainer";
import { OccasionTiles } from "@/components/OccasionTiles";
import { TestimonialGrid } from "@/components/TestimonialGrid";
import { FAQ } from "@/components/FAQ";

export default function Page() {
  return (
    <>
      <PromoBanner />
      <Hero />
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-black/70 sm:flex sm:items-center sm:justify-between">
          <span>⭐ 4.8/5 average rating</span>
          <span>120,000+ gifts created</span>
          <span>Loved by families, pet parents, and memory keepers</span>
        </div>
      </section>
      <TrustBar />
      <Explainer />
      <OccasionTiles />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="font-bold">Need policy details before buying?</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <Link href="/shipping" className="underline">Shipping times & cutoffs</Link>
            <Link href="/refunds" className="underline">Refund policy</Link>
          </div>
        </div>
      </section>
      <TestimonialGrid />
      <FAQ />
    </>
  );
}