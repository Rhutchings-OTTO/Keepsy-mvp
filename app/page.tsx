import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import LandingPage from "./LandingPage";
import type { Region } from "@/lib/region";
import {
  DESTINATION_COOKIE,
  getCountry,
  suggestCountryFromHeaders,
} from "@/lib/commerce/markets";

export const metadata: Metadata = {
  title:
    "Keepsy — Personalised Gifts | Custom Hoodies, Mugs, T-Shirts & Canvas Prints",
  description:
    "Upload a photo or describe an idea, see it on a hoodie, mug, t-shirt, card or canvas, then order. Made to order and delivered to the UK and US. From £6.99.",
  alternates: {
    canonical: "https://keepsy.store",
    languages: {
      "en-GB": "https://keepsy.store",
      "en-US": "https://keepsy.store",
    },
  },
  openGraph: {
    title:
      "Keepsy — Personalised Gifts | Custom Hoodies, Mugs, T-Shirts & Canvas Prints",
    description:
      "Upload a photo or describe an idea, see it on a hoodie, mug, t-shirt, card or canvas, then order. Made to order and delivered to the UK and US. From £6.99.",
    type: "website",
    url: "https://keepsy.store",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Keepsy personalised gifts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keepsy — Personalised Gifts",
    description:
      "See your design on the product before you order. Custom hoodies, mugs, t-shirts, cards and canvas prints.",
    images: ["/twitter-image"],
  },
};

function parseRegion(value: string | undefined): Region | null {
  return value === "US" || value === "UK" ? value : null;
}

export default async function Page() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const initialRegion = parseRegion(cookieStore.get("keepsy_region")?.value);
  const cookieCountry = cookieStore.get(DESTINATION_COOKIE)?.value;
  const initialCountry = getCountry(cookieCountry)?.code ?? null;
  const suggestedCountry = suggestCountryFromHeaders(headerStore);
  return (
    <LandingPage
      initialRegion={initialRegion}
      initialCountry={initialCountry}
      suggestedCountry={suggestedCountry}
    />
  );
}
