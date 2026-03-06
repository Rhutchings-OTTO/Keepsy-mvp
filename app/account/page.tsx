import { GalleryOfThePossible } from "@/components/GalleryOfThePossible";

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-[2.25rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,242,236,0.86))] p-6 shadow-[0_34px_80px_-46px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">Account</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#201d1b] sm:text-5xl">
          Your designs and order history.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-black/58">
          Save favourites, revisit previews, and reorder gifts without starting from scratch.
        </p>
      </div>
      <div className="mt-8">
        <GalleryOfThePossible
          title="Saved inspiration"
          subtitle="Your personal design library will appear here. Until then, explore polished examples and start your first gift."
          ctaHref="/create"
          ctaLabel="Create your first design"
        />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-5 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.28)]">
          <h2 className="text-lg font-semibold text-[#201d1b]">Reorder</h2>
          <p className="mt-2 text-sm leading-7 text-black/58">Coming soon: one-click reorder for your previous gifts.</p>
        </div>
      </div>
    </section>
  );
}
