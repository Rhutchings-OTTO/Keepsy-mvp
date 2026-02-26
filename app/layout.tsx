import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Keepsy",
  description: "Keep what matters — turn it into a gift.",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}