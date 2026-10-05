// SiteChrome — Server Component.
//
// Static shell: skip link, static background, the pathname-aware layout island,
// the always-mounted CartDrawer and the cookie notice.

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

      <SiteChromeLayout>{children}</SiteChromeLayout>

      {/* CartDrawer is always mounted; it opens via "open-cart-drawer" event */}
      <CartDrawer />
      <CookieBanner />
    </>
  );
}
