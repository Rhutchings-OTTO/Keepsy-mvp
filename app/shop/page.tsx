import type { Metadata } from "next";
import { CatalogClient } from "./CatalogClient";

export const metadata: Metadata = {
  title: "Shop Personalised Gifts",
  description:
    "Browse Keepsy's collection of handcrafted, custom printed gifts — personalised mugs, hoodies, tees and greeting cards. Every piece made to order, shipped to the UK & US.",
  alternates: {
    canonical: "https://keepsy.store/shop",
  },
  openGraph: {
    title: "Shop Personalised Gifts — Keepsy",
    description:
      "Explore our range of premium personalised gifts. Custom printed hoodies, mugs, tees and greeting cards — artisan quality, made just for you.",
    type: "website",
    url: "https://keepsy.store/shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Personalised Gifts — Keepsy",
    description:
      "Premium custom printed gifts, made to order. Discover personalised mugs, hoodies, tees and cards at Keepsy.",
  },
};

export default function ShopPage() {
  return <CatalogClient />;
}
