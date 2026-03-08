"use client";

// SiteChromeLayout — client island extracted from SiteChrome (Phase 3 fix 3.14).
//
// This component holds the ONLY piece of SiteChrome that requires "use client":
// the usePathname() hook, which switches between the landing layout
// (EasterEggProvider + BottomSheetNav only) and the standard site layout
// (SiteHeader + main + SiteFooter + BottomSheetNav).
//
// Everything else — the skip-to-content link, the fixed background, CartDrawer,
// CookieBanner — is static structure that is rendered by SiteChrome (Server
// Component) and passed in as children or rendered alongside this component.
//
// All imported components already have their own "use client" declarations,
// so Next.js is free to tree-shake / split them correctly.

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomSheetNav } from "@/components/BottomSheetNav";
import { PremiumEffects } from "@/components/PremiumEffects";
import { EasterEggProvider } from "@/components/EasterEggProvider";

type SiteChromeLayoutProps = {
  children: React.ReactNode;
};

export function SiteChromeLayout({ children }: SiteChromeLayoutProps) {
  const pathname = usePathname();
  const isEntryLanding = pathname === "/";

  if (isEntryLanding) {
    return (
      <EasterEggProvider>
        <div className="relative z-10" id="main-content">{children}</div>
        <PremiumEffects />
        <BottomSheetNav />
      </EasterEggProvider>
    );
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0" id="main-content">{children}</main>
      <SiteFooter />
      <BottomSheetNav />
    </div>
  );
}
