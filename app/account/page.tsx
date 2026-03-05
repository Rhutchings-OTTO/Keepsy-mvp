import { GalleryOfThePossible } from "@/components/GalleryOfThePossible";

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-black">My Account</h1>
      <p className="mt-2 text-black/70">Your designs and order history.</p>
      <div className="mt-8">
        <GalleryOfThePossible
          title="Gallery of the Possible"
          subtitle="Your designs will appear here. Until then, explore what others have imagined."
          ctaHref="/create"
          ctaLabel="Create your first design"
        />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="frosted-glass rounded-2xl border border-white/20 p-5">
          <h2 className="font-bold">Reorder</h2>
          <p className="mt-1 text-sm text-black/65">Coming soon: one-click reorder for your previous gifts.</p>
        </div>
      </div>
    </section>
  );
}
