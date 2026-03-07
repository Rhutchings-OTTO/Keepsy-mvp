import Link from "next/link";
import { GalleryOfThePossible } from "@/components/GalleryOfThePossible";

export const metadata = {
  title: "My Account | Keepsy",
  description: "View your saved designs, order history, and reorder your favourite gifts.",
};

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header card */}
      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>Account</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Your designs & order history.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          Save favourites, revisit previews, and reorder gifts without starting from scratch.
        </p>
      </div>

      {/* Gallery */}
      <div className="mt-10">
        <GalleryOfThePossible
          title="Saved inspiration"
          subtitle="Your personal design library will appear here. Until then, explore polished examples and start your first gift."
          ctaHref="/create"
          ctaLabel="Create your first design"
        />
      </div>

      {/* Quick action cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>Coming soon</p>
          <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-charcoal)" }}>One-click Reorder</h2>
          <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.60)" }}>
            Reorder your favourite previous gifts with a single tap — your design, your memories, delivered again.
          </p>
        </div>
        <div className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-forest)" }}>Get started</p>
          <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-charcoal)" }}>Create a New Gift</h2>
          <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.60)" }}>
            Upload a photo or describe a moment — our AI turns it into a one-of-a-kind keepsake.
          </p>
          <Link
            href="/create"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          >
            Start creating
          </Link>
        </div>
      </div>
    </main>
  );
}
