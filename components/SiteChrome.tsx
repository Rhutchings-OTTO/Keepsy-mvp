"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomSheetNav } from "@/components/BottomSheetNav";
import { PremiumEffects } from "@/components/PremiumEffects";
import { EasterEggProvider } from "@/components/EasterEggProvider";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isEntryLanding = pathname === "/";
  const isCreateRoute = pathname.startsWith("/create");

  if (isEntryLanding || isCreateRoute) {
    return (
      <EasterEggProvider>
        {children}
        <PremiumEffects />
        <BottomSheetNav />
      </EasterEggProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BottomSheetNav />
    </div>
  );
}
