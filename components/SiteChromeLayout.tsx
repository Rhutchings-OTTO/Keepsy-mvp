"use client";

// SiteChromeLayout — the one client island in the chrome.
//
// Every page, including the homepage, gets the same header, footer and mobile
// bottom nav so the site feels like one place. The only pathname-dependent
// behaviour left is the bottom padding that keeps content clear of the
// bottom nav on small screens.

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomSheetNav } from "@/components/BottomSheetNav";

type SiteChromeLayoutProps = {
  children: React.ReactNode;
};

export function SiteChromeLayout({ children }: SiteChromeLayoutProps) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <SiteHeader />
      <main
        className="flex-1 overflow-x-hidden pb-16 md:pb-0"
        id="main-content"
      >
        {children}
      </main>
      <SiteFooter />
      <BottomSheetNav />
    </div>
  );
}
