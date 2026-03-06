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

export function BottomSheetNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        backgroundColor: "rgba(253, 246, 238, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
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
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition"
              style={{
                minHeight: "56px",
                color: active
                  ? "var(--color-terracotta)"
                  : "var(--ink-muted)",
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ lineHeight: 1 }}
              >
                {label}
              </span>
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
