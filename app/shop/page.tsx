import type { Metadata } from "next";
import Link from "next/link";
import { CatalogClient } from "./CatalogClient";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Shop Personalised Gifts | Custom Hoodies, Mugs, T-Shirts, Cards & Canvas — Keepsy",
  description:
    "Browse our collection of personalised gifts. Custom printed hoodies from £44.99, mugs from £14.99, t-shirts from £29.99, greeting cards from £6.99 and canvas prints from £29.99. Preview your design before you buy.",
  alternates: {
    canonical: "https://keepsy.store/shop",
  },
  openGraph: {
    title: "Shop Personalised Gifts | Custom Hoodies, Mugs, T-Shirts, Cards & Canvas — Keepsy",
    description:
      "Browse our collection of personalised gifts. Custom printed hoodies from £44.99, mugs from £14.99, t-shirts from £29.99, greeting cards from £6.99 and canvas prints from £29.99. Preview your design before you buy.",
    type: "website",
    url: "https://keepsy.store/shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Personalised Gifts | Custom Hoodies, Mugs, T-Shirts, Cards & Canvas — Keepsy",
    description:
      "Browse our collection of personalised gifts. Custom printed hoodies from £44.99, mugs from £14.99, t-shirts from £29.99, greeting cards from £6.99 and canvas prints from £29.99. Preview your design before you buy.",
  },
};

const shopItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Keepsy Personalised Gifts",
  description: "A collection of personalised gifts custom printed with your unique design.",
  url: "https://keepsy.store/shop",
  numberOfItems: 5,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Personalised Hoodie", url: "https://keepsy.store/product/hoodie", image: "https://keepsy.store/images/mockups/hoodie-preview.jpg" },
    { "@type": "ListItem", position: 2, name: "Personalised T-Shirt", url: "https://keepsy.store/product/tee", image: "https://keepsy.store/images/mockups/tee-preview.jpg" },
    { "@type": "ListItem", position: 3, name: "Personalised Mug", url: "https://keepsy.store/product/mug", image: "https://keepsy.store/images/mockups/mug-preview.jpg" },
    { "@type": "ListItem", position: 4, name: "Personalised Greeting Card", url: "https://keepsy.store/product/card", image: "https://keepsy.store/images/mockups/card-preview.jpg" },
    { "@type": "ListItem", position: 5, name: "Personalised Canvas Print", url: "https://keepsy.store/product/canvas", image: "https://keepsy.store/images/mockups/canvas-preview.jpg" },
  ],
};

const shopBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://keepsy.store" },
    { "@type": "ListItem", position: 2, name: "Shop", item: "https://keepsy.store/shop" },
  ],
};

export default function ShopPage() {
  return (
    <>
      <JsonLd data={shopItemListJsonLd} />
      <JsonLd data={shopBreadcrumbJsonLd} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-4 pb-2 text-sm text-charcoal/50 sm:px-6">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-charcoal">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="text-charcoal font-medium">Shop</li>
        </ol>
      </nav>
      <CatalogClient />
    </>
  );
}
