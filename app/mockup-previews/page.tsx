import Image from "next/image";

const PREVIEW_FILES = [
  "preview-plain-card.png",
  "preview-plain-mug-front.png",
  "preview-tee-white.png",
  "preview-tee-blue.png",
  "preview-tee-black.png",
  "preview-hoodie-white.png",
  "preview-hoodie-blue.png",
  "preview-hoodie-black.png",
];

export default function MockupPreviewsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">Generated design on every mockup</h1>
      <p className="mt-2 text-black/70">
        Preview generated from the Labrador + turkey sample design using the same placement logic as the live create flow.
      </p>

      <section className="mt-6">
        <h2 className="text-xl font-bold">All mockups overview</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <Image
            src="/mockup-previews/all-mockups-grid.png"
            alt="All product mockup previews"
            width={1920}
            height={1440}
            className="h-auto w-full"
            priority
          />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {PREVIEW_FILES.map((file) => (
          <article key={file} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <Image
              src={`/mockup-previews/${file}`}
              alt={file}
              width={2816}
              height={1536}
              className="h-auto w-full"
            />
            <p className="border-t border-black/10 px-3 py-2 text-sm font-semibold text-black/70">{file}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
