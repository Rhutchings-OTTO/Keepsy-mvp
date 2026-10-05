"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Sparkles, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/shop", label: "Shop", Icon: ShoppingBag },
  { href: "/create", label: "Create", Icon: Sparkles },
  { href: "/account", label: "Account", Icon: User },
];

/**
 * Mobile bottom navigation. Always shown on small screens (it no longer waits
 * for a region cookie). Pages that need the full viewport can add
 * `data-hide-bottom-nav` to <body> — see agent notes.
 */
export function BottomSheetNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        backgroundColor: "rgba(253, 246, 238, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracotta/40"
              style={{
                color: active ? "var(--color-terracotta)" : "var(--ink-muted)",
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ lineHeight: 1 }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
