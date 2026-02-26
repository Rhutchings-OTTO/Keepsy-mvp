import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
      <div className="max-w-2xl">
        <p className="mb-4 inline-block rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-black/60">
          Made for meaningful gifting
        </p>
        <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
          Imagine it. Generate it.
          <br />
          <span
            className="gradient-flow bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)", backgroundSize: "220% auto" }}
          >
            Cherish it.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-black/65 sm:text-lg">
          Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/create" className="min-h-11 rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30">
            Create your gift
          </Link>
          <Link href="/gift-ideas" className="text-sm font-semibold text-black/65 underline-offset-4 hover:text-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
            See gift ideas
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* TODO: Replace placeholder collage with professional lifestyle photoshoot */}
        <Image src="/product-tiles/card.jpg" alt="Family card gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
        <Image src="/product-tiles/mug.jpg" alt="Pet mug gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
        <Image src="/product-tiles/tee.jpg" alt="Cartoon tee gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
        <Image src="/product-tiles/hoodie.jpg" alt="Anniversary hoodie gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
      </div>
    </section>
  );
}
