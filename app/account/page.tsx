import Link from "next/link";

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-black">My Account</h1>
      <p className="mt-2 text-black/70">Placeholder area for saved designs, reorder history, and account tools.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="font-bold">Saved designs</h2>
          <p className="text-sm text-black/65">Coming soon: resume drafts and saved gift concepts.</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="font-bold">Reorder</h2>
          <p className="text-sm text-black/65">Coming soon: one-click reorder for your previous gifts.</p>
        </div>
      </div>
      <Link href="/create" className="mt-5 inline-block rounded-xl bg-black px-4 py-2 font-bold text-white">Create a new gift</Link>
    </section>
  );
}
