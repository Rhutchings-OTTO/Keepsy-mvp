"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomSheetNav } from "@/components/BottomSheetNav";
import { PremiumEffects } from "@/components/PremiumEffects";
import { EasterEggProvider } from "@/components/EasterEggProvider";
import { MeshGradientBackground } from "@/components/MeshGradientBackground";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isEntryLanding = pathname === "/";
  const isCreateRoute = pathname.startsWith("/create");

  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden>
        <MeshGradientBackground />
      </div>
      {isEntryLanding || isCreateRoute ? (
        <EasterEggProvider>
          <div className="relative z-10">{children}</div>
          <PremiumEffects />
          <BottomSheetNav />
        </EasterEggProvider>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <BottomSheetNav />
        </div>
      )}
    </>
  );
}
