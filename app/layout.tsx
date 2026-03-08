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
  description: "Turn your favourite photos and memories into beautiful, personalised keepsakes. Custom mugs, greeting cards, tees and hoodies — premium quality, shipped to US & UK.",
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://keepsy.store/#organization",
      "name": "Keepsy",
      "url": "https://keepsy.store",
      "logo": "https://keepsy.store/images/logo.png",
      "email": "hello@keepsy.store",
      "sameAs": [
        "https://www.instagram.com/keepsy.store",
        "https://www.pinterest.com/keepsystore",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://keepsy.store/#website",
      "url": "https://keepsy.store",
      "name": "Keepsy",
      "description":
        "AI-powered personalised gifts — custom hoodies, mugs, t-shirts and greeting cards printed just for you.",
      "publisher": { "@id": "https://keepsy.store/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased font-sans">
        <AtelierModeProvider>
          <SiteChrome>{children}</SiteChrome>
        </AtelierModeProvider>
      </body>
    </html>
  );
}
