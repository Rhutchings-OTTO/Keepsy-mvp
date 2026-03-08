import type { Metadata } from "next";
import LandingPage from "./LandingPage";
import { cookies } from "next/headers";
import type { Region } from "@/lib/region";

export const metadata: Metadata = {
  title: "Keepsy — Personalised Gifts | Custom Hoodies, Mugs, T-Shirts & Canvas Prints",
  description: "Create unique personalised gifts they'll never forget. Upload a photo or describe your idea — see it on a hoodie, mug, t-shirt, card or canvas before you buy. Free UK & US shipping over £75.",
  alternates: {
    canonical: "https://keepsy.store",
    languages: {
      "en-GB": "https://keepsy.store",
      "en-US": "https://keepsy.store",
    },
  },
  openGraph: {
    title: "Keepsy — Personalised Gifts | Custom Hoodies, Mugs, T-Shirts & Canvas Prints",
    description: "Create unique personalised gifts they'll never forget. Upload a photo or describe your idea — see it on a hoodie, mug, t-shirt, card or canvas before you buy.",
    type: "website",
    url: "https://keepsy.store",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Keepsy personalised gifts" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keepsy — Personalised Gifts",
    description: "See your design on the actual product before you order. Custom hoodies, mugs, t-shirts & more.",
    images: ["/twitter-image"],
  },
};

function parseRegion(value: string | undefined): Region | null {
  return value === "US" || value === "UK" ? value : null;
}

export default async function Page() {
  const cookieStore = await cookies();
  const initialRegion = parseRegion(cookieStore.get("keepsy_region")?.value);
  return <LandingPage initialRegion={initialRegion} />;
}