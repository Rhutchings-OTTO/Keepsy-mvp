import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { AtelierModeProvider } from "@/context/AtelierModeContext";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Keepsy — Personalised Gifts | Custom Hoodies, Mugs, T-Shirts & Canvas Prints",
    template: "%s — Keepsy",
  },
  description: "Create personalised gifts they'll never forget. Describe your idea or upload a photo — see it on a hoodie, mug, t-shirt, card or canvas before you buy. Free UK & US shipping over £75. From £9.99.",
  keywords: ["personalised gifts", "custom mugs", "custom hoodies", "keepsake gifts", "photo gifts", "personalised cards"],
  metadataBase: new URL("https://keepsy.store"),
  alternates: {
    canonical: "https://keepsy.store",
    languages: {
      "en-GB": "https://keepsy.store",
      "en-US": "https://keepsy.store",
    },
  },
  openGraph: {
    type: "website",
    url: "https://keepsy.store",
    title: "Keepsy — Personalised Gifts | Custom Hoodies, Mugs, T-Shirts & Canvas Prints",
    description: "Create personalised gifts they'll never forget. Describe your idea or upload a photo — see it on a hoodie, mug, t-shirt, card or canvas before you buy. Free UK & US shipping over £75. From £9.99.",
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
    title: "Keepsy — Personalised Gifts",
    description: "Create personalised gifts they'll never forget. Describe your idea or upload a photo — see it on a hoodie, mug, t-shirt, card or canvas before you buy.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
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
        "https://www.instagram.com/wearekeepsy",
        "https://www.facebook.com/wearekeepsy",
        "https://www.tiktok.com/@wearekeepsy",
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@keepsy.store",
        "availableLanguage": ["English"],
        "areaServed": ["GB", "US"],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://keepsy.store/#website",
      "url": "https://keepsy.store",
      "name": "Keepsy",
      "description":
        "AI-powered personalised gifts — custom hoodies, mugs, t-shirts and greeting cards printed just for you.",
      "publisher": { "@id": "https://keepsy.store/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://keepsy.store/shop?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": ["Organization", "OnlineStore"],
      "@id": "https://keepsy.store/#store",
      "name": "Keepsy",
      "url": "https://keepsy.store",
      "description": "Keepsy is an online personalised gift store selling custom printed hoodies, t-shirts, mugs, greeting cards and canvas prints to customers in the UK and United States.",
      "areaServed": [
        { "@type": "Country", "name": "United Kingdom" },
        { "@type": "Country", "name": "United States" },
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Personalised Gifts",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Personalised Hoodie" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Personalised T-Shirt" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Personalised Mug" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Personalised Greeting Card" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Personalised Canvas Print" } },
        ],
      },
      "priceRange": "££",
      "currenciesAccepted": "GBP, USD",
      "paymentAccepted": "Credit Card, Debit Card, PayPal",
      "parentOrganization": { "@id": "https://keepsy.store/#organization" },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
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
