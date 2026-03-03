import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";
import { ProductPreviewClient } from "@/components/product/ProductPreviewClient";

type ProductPageProps = {
  params: Promise<{ type: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((item) => item.type === type);
  if (!product) return notFound();

  return <ProductPreviewClient initialSlug={type} />;
}
