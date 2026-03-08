import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";
import { ProductPreviewClient } from "@/components/product/ProductPreviewClient";

type ProductPageProps = {
  params: Promise<{ type: string }>;
};

export function generateStaticParams() {
  return PRODUCT_CARDS.map((p) => ({ type: p.type }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((p) => p.type === type);
  if (!product) return {};
  return {
    title: `Custom ${product.name}`,
    description: `Design a personalised ${product.name.toLowerCase()} with your own photo or memory. Starting from £${product.price.toFixed(2)} — made to order, shipped to UK & US.`,
    alternates: { canonical: `https://keepsy.store/product/${type}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((item) => item.type === type);
  if (!product) return notFound();

  return <ProductPreviewClient key={type} initialSlug={type} />;
}
