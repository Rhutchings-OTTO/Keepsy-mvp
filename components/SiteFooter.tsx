import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/75">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-black/65 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-bold text-black">Keepsy</p>
          <p className="mt-2 leading-relaxed">Turn your favorite memories into meaningful gifts in minutes.</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-black">Company</p>
          <Link href="/terms" className="block hover:text-black">Terms</Link>
          <Link href="/privacy" className="block hover:text-black">Privacy</Link>
          <Link href="/refunds" className="block hover:text-black">Refunds</Link>
          <Link href="/shipping" className="block hover:text-black">Shipping</Link>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-black">Explore</p>
          <Link href="/gift-ideas" className="block hover:text-black">Gift ideas</Link>
          <Link href="/create" className="block hover:text-black">Create a gift</Link>
          <Link href="/account" className="block hover:text-black">Account</Link>
        </div>
        <div>
          <p className="font-semibold text-black">Support</p>
          <a href="mailto:support@keepsy.store" className="mt-2 block hover:text-black">
            support@keepsy.store
          </a>
          <p className="mt-2 text-xs">UK/US support available Monday–Sunday.</p>
        </div>
      </div>
    </footer>
  );
}
