"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DynamicLogo } from "@/components/DynamicLogo";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

const NAV_ITEMS = [
  { href: "/gift-ideas", label: "Gift Ideas" },
  { href: "/create", label: "Create" },
  { href: "/#reviews", label: "Reviews" },
  { href: "mailto:support@keepsy.store", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[rgba(246,241,235,0.74)] backdrop-blur-xl">
      <div className={`${CONTAINER} flex items-center justify-between py-4`}>
        <DynamicLogo
          href="/"
          width={118}
          className="h-8 w-auto text-[#201d1b] sm:h-9"
        />
        <nav
          className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/70 px-2 py-2 shadow-[0_18px_38px_-30px_rgba(0,0,0,0.32)] backdrop-blur-md md:flex"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.href !== "/#reviews" && item.href.startsWith("/") && pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#1f2937] text-white shadow-[0_14px_30px_-20px_rgba(17,24,39,0.5)]"
                    : "text-black/65 hover:bg-black/[0.04] hover:text-black"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/create"
          className="hidden min-h-11 items-center justify-center rounded-full bg-[#1f2937] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_rgba(17,24,39,0.58)] md:inline-flex"
        >
          Create now
        </Link>
      </div>
    </header>
  );
}
