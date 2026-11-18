import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";
import { ProductPreviewClient } from "@/components/product/ProductPreviewClient";
import { JsonLd } from "@/components/JsonLd";
import { getUnitPrice } from "@/lib/commerce/pricing";

type ProductPageProps = {
  params: Promise<{ type: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PRODUCT_TITLES: Record<string, string> = {
  hoodie: "Personalised Hoodie — Custom Printed Hoodie Gift | Keepsy",
  mug: "Personalised Mug — Custom Photo Mug Gift | Keepsy",
  tee: "Personalised T-Shirt — Custom Printed Tee Gift | Keepsy",
  card: "Personalised Greeting Card — Custom Photo Card | Keepsy",
  canvas: "Personalised Canvas Print — Custom Photo Canvas | Keepsy",
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  hoodie:
    "Design a personalised hoodie from £44.99. Upload a photo or describe your idea — see it on the hoodie before you order. Soft fleece, vivid lasting print. Free UK & US shipping over £75.",
  mug: "Create a personalised mug from £14.99. Upload a photo or describe your idea — preview it on a ceramic mug before ordering. Perfect gift for any occasion. Ships to UK and US.",
  tee: "Design a personalised t-shirt from £29.99. Upload a photo or describe your design — preview it on a premium tee before you order. Soft, vivid prints. Free UK & US shipping over £75.",
  card: "Create a personalised greeting card from £6.99. Describe your design or upload a photo — see it on a premium card before ordering. Perfect for birthdays, Mother's Day, weddings and more.",
  canvas:
    "Design a personalised canvas print from £29.99. Upload a photo or describe your idea — preview it before ordering. Vivid gallery-quality print. Ships to UK and US.",
};

export function generateStaticParams() {
  return PRODUCT_CARDS.map((p) => ({ type: p.type }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((p) => p.type === type);
  if (!product) return {};
  const title =
    PRODUCT_TITLES[type] ??
    `Personalised ${product.name} — Custom ${product.name} Gift | Keepsy`;
  const description =
    PRODUCT_DESCRIPTIONS[type] ??
    `Design a personalised ${product.name.toLowerCase()} with your own photo or memory. Starting from £${product.price.toFixed(2)} — made to order, shipped to UK & US.`;
  return {
    title,
    description,
    alternates: { canonical: `https://keepsy.store/product/${type}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://keepsy.store/product/${type}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const PRODUCT_META: Record<
  string,
  { name: string; price: string; image: string }
> = {
  hoodie: {
    name: "Personalised Hoodie",
    price: "44.99",
    image: "https://keepsy.store/mockups/premium-v2/hoodie-white.webp",
  },
  mug: {
    name: "Personalised Mug",
    price: "14.99",
    image: "https://keepsy.store/mockups/premium-v2/mug-white.webp",
  },
  tee: {
    name: "Personalised T-Shirt",
    price: "29.99",
    image: "https://keepsy.store/mockups/premium-v2/tee-white.webp",
  },
  card: {
    name: "Personalised Greeting Card",
    price: "6.99",
    image: "https://keepsy.store/mockups/premium-v2/plain-card.webp",
  },
  canvas: {
    name: "Personalised Canvas Print",
    price: "29.99",
    image: "https://keepsy.store/product-tiles/plain-canvas.png",
  },
};

function buildProductJsonLd(
  type: string,
  name: string,
  description: string,
  price: string,
  image: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://keepsy.store/product/${type}`,
    name,
    description,
    image,
    sku: `KEEPSY-${type.toUpperCase()}`,
    brand: {
      "@type": "Brand",
      name: "Keepsy",
    },
    offers: {
      "@type": "Offer",
      "@id": `https://keepsy.store/product/${type}#offer`,
      url: `https://keepsy.store/product/${type}`,
      price,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Keepsy",
        url: "https://keepsy.store",
      },
    },
  };
}

function buildBreadcrumbJsonLd(type: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://keepsy.store",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://keepsy.store/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: `https://keepsy.store/product/${type}`,
      },
    ],
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { type } = await params;
  const query = await searchParams;
  const initialColor = typeof query?.color === "string" ? query.color : undefined;
  const product = PRODUCT_CARDS.find((item) => item.type === type);
  if (!product) return notFound();

  const meta = PRODUCT_META[type] ?? {
    name: `Personalised ${product.name}`,
    price: product.price.toFixed(2),
    image: "",
  };

  const description =
    PRODUCT_DESCRIPTIONS[type] ??
    `A personalised ${product.name.toLowerCase()} made to order at Keepsy.`;

  const productSchema = buildProductJsonLd(
    type,
    meta.name,
    description,
    (getUnitPrice(type === "card" ? "postcard" : type === "canvas" ? "canvas_10x8" : type, "gbp") ?? Number(meta.price)).toFixed(2),
    meta.image,
  );
  const breadcrumbSchema = buildBreadcrumbJsonLd(type, meta.name);

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductPreviewClient key={`${type}-${initialColor ?? ""}`} initialSlug={type} initialColor={initialColor} />
    </>
  );
}
