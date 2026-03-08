import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";
import { ProductPreviewClient } from "@/components/product/ProductPreviewClient";

type ProductPageProps = {
  params: Promise<{ type: string }>;
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  card: "A premium personalised greeting card printed on heavyweight cardstock, complete with envelope. Add your own photo or heartfelt message — a keepsake they'll hold onto forever.",
  hoodie:
    "A beautifully soft fleece hoodie with your personalised design printed to last. The perfect thoughtful gift — warm, wearable, and made just for them.",
  mug: "An 11oz ceramic mug with a glossy finish, printed with your personalised design. Every morning cup made a little more special.",
  tee: "A soft, heavyweight premium tee with your personalised design. Great quality, great gift — worn with pride.",
};

export function generateStaticParams() {
  return PRODUCT_CARDS.map((p) => ({ type: p.type }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((p) => p.type === type);
  if (!product) return {};
  return {
    title: `Personalised ${product.name}`,
    description:
      PRODUCT_DESCRIPTIONS[type] ??
      `Design a personalised ${product.name.toLowerCase()} with your own photo or memory. Starting from £${product.price.toFixed(2)} — made to order, shipped to UK & US.`,
    alternates: { canonical: `https://keepsy.store/product/${type}` },
    openGraph: {
      title: `Personalised ${product.name} — Keepsy`,
      description:
        PRODUCT_DESCRIPTIONS[type] ??
        `Design a personalised ${product.name.toLowerCase()} with your own photo or memory.`,
      type: "website",
      url: `https://keepsy.store/product/${type}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Personalised ${product.name} — Keepsy`,
      description:
        PRODUCT_DESCRIPTIONS[type] ??
        `Design a personalised ${product.name.toLowerCase()} with your own photo or memory.`,
    },
  };
}

function buildProductJsonLd(type: string, name: string, price: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `Personalised ${name} — Keepsy`,
    "description":
      PRODUCT_DESCRIPTIONS[type] ??
      `A personalised ${name.toLowerCase()} made to order at Keepsy.`,
    "brand": { "@type": "Brand", "name": "Keepsy" },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": price.toFixed(2),
      "availability": "https://schema.org/InStock",
      "url": `https://keepsy.store/product/${type}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((item) => item.type === type);
  if (!product) return notFound();

  const jsonLd = buildProductJsonLd(type, product.name, product.price);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPreviewClient key={type} initialSlug={type} />
    </>
  );
}
