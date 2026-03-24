import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";
import { ProductPreviewClient } from "@/components/product/ProductPreviewClient";
import { JsonLd } from "@/components/JsonLd";

type ProductPageProps = {
  params: Promise<{ type: string }>;
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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((p) => p.type === type);
  if (!product) return {};
  const title =
    PRODUCT_TITLES[type] ?? `Personalised ${product.name} — Custom ${product.name} Gift | Keepsy`;
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

const PRODUCT_META: Record<string, { name: string; price: string; image: string }> = {
  hoodie: {
    name: "Personalised Hoodie",
    price: "44.99",
    image: "https://keepsy.store/images/mockups/hoodie-preview.jpg",
  },
  mug: {
    name: "Personalised Mug",
    price: "14.99",
    image: "https://keepsy.store/images/mockups/mug-preview.jpg",
  },
  tee: {
    name: "Personalised T-Shirt",
    price: "29.99",
    image: "https://keepsy.store/images/mockups/tee-preview.jpg",
  },
  card: {
    name: "Personalised Greeting Card",
    price: "6.99",
    image: "https://keepsy.store/images/mockups/card-preview.jpg",
  },
  canvas: {
    name: "Personalised Canvas Print",
    price: "29.99",
    image: "https://keepsy.store/images/mockups/canvas-preview.jpg",
  },
};

function buildProductJsonLd(type: string, name: string, description: string, price: string, image: string) {
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
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "GBP",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: ["GB", "US"],
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: ["GB", "US"],
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "247",
      bestRating: "5",
      worstRating: "1",
    },
  };
}


function buildBreadcrumbJsonLd(type: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://keepsy.store" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "https://keepsy.store/shop" },
      { "@type": "ListItem", position: 3, name, item: `https://keepsy.store/product/${type}` },
    ],
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { type } = await params;
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

  const productSchema = buildProductJsonLd(type, meta.name, description, meta.price, meta.image);
  const breadcrumbSchema = buildBreadcrumbJsonLd(type, meta.name);

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductPreviewClient key={type} initialSlug={type} />
    </>
  );
}
