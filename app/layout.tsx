import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { AtelierModeProvider } from "@/context/AtelierModeContext";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Keepsy — Personalised Gifts She'll Never Forget",
    template: "%s — Keepsy",
  },
  description: "Turn your favourite photos and memories into beautiful, personalised keepsakes. Custom mugs, greeting cards, tees and hoodies — gift-wrapped free, shipped to US & UK.",
  keywords: ["personalised gifts", "custom mugs", "custom hoodies", "keepsake gifts", "photo gifts", "personalised cards"],
  metadataBase: new URL("https://keepsy.store"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://keepsy.store",
    title: "Keepsy",
    description: "Keep what matters — turn it into a gift.",
    siteName: "Keepsy",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Keepsy social preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keepsy",
    description: "Keep what matters — turn it into a gift.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="antialiased font-sans">
        <AtelierModeProvider>
          <SiteChrome>{children}</SiteChrome>
        </AtelierModeProvider>
      </body>
    </html>
  );
}
