"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/gift-ideas", label: "Gift Ideas" },
  { href: "/create", label: "Create" },
  { href: "/#reviews", label: "Reviews" },
  { href: "mailto:support@keepsy.store", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#F7F1EB]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = item.href !== "/#reviews" && item.href.startsWith("/") && pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-10 rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${
                  active ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" aria-label="Go to homepage">
          <Image
            src="/keepsy-logo-transparent.png"
            alt="Keepsy"
            width={560}
            height={160}
            className="h-12 w-auto object-contain sm:h-14"
          />
        </Link>
      </div>
    </header>
  );
}
