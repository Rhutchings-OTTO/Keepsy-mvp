import Link from "next/link";

const CONTAINER = "w-full max-w-[420px] sm:max-w-[720px] lg:max-w-[960px] mx-auto px-5";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/75 py-12 sm:py-16">
      <div className={CONTAINER}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-bold text-black">Keepsy</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">Turn your favorite memories into meaningful gifts in minutes.</p>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-black">Company</p>
            <div className="flex flex-col gap-3">
              <Link href="/terms" className="text-sm text-neutral-500 hover:text-black">Terms of Artistry</Link>
              <Link href="/privacy" className="text-sm text-neutral-500 hover:text-black">Privacy</Link>
              <Link href="/refunds" className="text-sm text-neutral-500 hover:text-black">Refunds</Link>
              <Link href="/shipping" className="text-sm text-neutral-500 hover:text-black">Shipping</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-black">Explore</p>
            <div className="flex flex-col gap-3">
              <Link href="/gift-ideas" className="text-sm text-neutral-500 hover:text-black">Gift ideas</Link>
              <Link href="/create" className="text-sm text-neutral-500 hover:text-black">Create a gift</Link>
              <Link href="/account" className="text-sm text-neutral-500 hover:text-black">Account</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-3 border-t border-black/5 pt-8">
          <p className="font-semibold text-black">Support</p>
          <a href="mailto:support@keepsy.store" className="block text-sm text-neutral-500 hover:text-black">support@keepsy.store</a>
          <p className="text-xs text-neutral-500">UK/US support available Monday–Sunday.</p>
        </div>
        <p className="mt-8 text-xs text-neutral-400">Powered by OpenAI & Stripe</p>
      </div>
    </footer>
  );
}
