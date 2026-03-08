// SiteChrome — Server Component (Phase 3 fix 3.14)
//
// Previously this was "use client" solely because of usePathname(). That hook
// has been extracted into SiteChromeLayout (a small "use client" island) which
// handles the landing vs. standard layout switch. All interactive children
// (SiteHeader, SiteFooter, BottomSheetNav, CartDrawer, CookieBanner,
// MeshGradientBackground, EasterEggProvider) already carry their own
// "use client" declarations and are unaffected by this change.
//
// The static shell — skip-to-content link, fixed background wrapper, CartDrawer
// portal mount point, CookieBanner — now renders as pure HTML on the server,
// reducing the client JavaScript that must be downloaded and hydrated before the
// page is interactive.

import { SiteChromeLayout } from "@/components/SiteChromeLayout";
import { MeshGradientBackground } from "@/components/MeshGradientBackground";
import { CartDrawer } from "@/components/CartDrawer";
import { CookieBanner } from "@/components/CookieBanner";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
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

      {/* Client island: handles pathname-dependent layout switching */}
      <SiteChromeLayout>{children}</SiteChromeLayout>

      {/* CartDrawer is always mounted; it opens via "open-cart-drawer" event */}
      <CartDrawer />
      {/* Cookie notice banner — shown once until dismissed */}
      <CookieBanner />
    </>
  );
}
