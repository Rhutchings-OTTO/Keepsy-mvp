import Link from "next/link";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/8 bg-[linear-gradient(180deg,rgba(252,249,245,0.86),rgba(245,239,232,0.92))] py-12 backdrop-blur-md sm:py-16">
      <div className={CONTAINER}>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-white/65 bg-white/66 p-6 shadow-[0_22px_48px_-34px_rgba(0,0,0,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Keepsy</p>
            <p className="mt-4 max-w-md font-serif text-2xl font-semibold tracking-[-0.03em] text-[#201d1b]">
              Personalised gifting that feels calm, premium, and easy to trust.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-7 text-black/58">
              Turn a photo, memory, pet, home, or occasion into a polished gift preview before you buy.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/40">Company</p>
            <div className="flex flex-col gap-3">
              <Link href="/terms" className="text-sm text-black/58 hover:text-black">Terms</Link>
              <Link href="/privacy" className="text-sm text-black/58 hover:text-black">Privacy</Link>
              <Link href="/refunds" className="text-sm text-black/58 hover:text-black">Refunds</Link>
              <Link href="/shipping" className="text-sm text-black/58 hover:text-black">Shipping</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/40">Explore</p>
            <div className="flex flex-col gap-3">
              <Link href="/gift-ideas" className="text-sm text-black/58 hover:text-black">Gift ideas</Link>
              <Link href="/create" className="text-sm text-black/58 hover:text-black">Create</Link>
              <Link href="/account" className="text-sm text-black/58 hover:text-black">Account</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-black/6 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/40">Support</p>
            <a href="mailto:support@keepsy.store" className="block text-sm text-black/58 hover:text-black">support@keepsy.store</a>
            <p className="text-xs text-black/45">UK and US support available seven days a week.</p>
          </div>
          <p className="text-xs text-black/35">Powered by OpenAI and Stripe</p>
        </div>
      </div>
    </footer>
  );
}
