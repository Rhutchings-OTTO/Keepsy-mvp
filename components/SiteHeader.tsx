"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DynamicLogo } from "@/components/DynamicLogo";

const CONTAINER = "w-full max-w-[420px] sm:max-w-[720px] lg:max-w-[960px] mx-auto px-5";

const NAV_ITEMS = [
  { href: "/gift-ideas", label: "Gift Ideas" },
  { href: "/create", label: "Create" },
  { href: "/#reviews", label: "Reviews" },
  { href: "mailto:support@keepsy.store", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-black/10 bg-[#F7F1EB]/95 backdrop-blur-sm">
      <div className={`flex h-full items-center justify-between ${CONTAINER}`}>
        {/* Desktop nav — hidden on mobile (BottomSheetNav handles mobile) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-3" aria-label="Primary">
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
        <DynamicLogo
          href="/"
          width={110}
          className="h-8 w-auto text-obsidian sm:h-9"
        />
      </div>
    </header>
  );
}
