"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomSheetNav } from "@/components/BottomSheetNav";
import { PremiumEffects } from "@/components/PremiumEffects";
import { EasterEggProvider } from "@/components/EasterEggProvider";
import { MeshGradientBackground } from "@/components/MeshGradientBackground";
import { CartDrawer } from "@/components/CartDrawer";
import { CookieBanner } from "@/components/CookieBanner";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isEntryLanding = pathname === "/";

  return (
    <>
      {/* Skip to main content — hidden until focused (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
        style={{ color: "var(--color-terracotta)" }}
      >
        Skip to main content
      </a>
      <div className="fixed inset-0 z-0" aria-hidden>
        <MeshGradientBackground />
      </div>
      {isEntryLanding ? (
        <EasterEggProvider>
          <div className="relative z-10" id="main-content">{children}</div>
          <PremiumEffects />
          <BottomSheetNav />
        </EasterEggProvider>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1" id="main-content">{children}</main>
          <SiteFooter />
          <BottomSheetNav />
        </div>
      )}
      {/* CartDrawer is always mounted; it opens via "open-cart-drawer" event */}
      <CartDrawer />
      {/* Cookie notice banner — shown once until dismissed */}
      <CookieBanner />
    </>
  );
}
