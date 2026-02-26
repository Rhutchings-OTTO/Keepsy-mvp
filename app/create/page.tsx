import { Wizard } from "@/components/Wizard";
import { STYLE_OPTIONS, type ProductType, type StyleOption } from "@/lib/siteConfig";

type CreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = (await searchParams) ?? {};
  const styleParam = typeof params.style === "string" ? params.style : undefined;
  const productParam = typeof params.product === "string" ? params.product : undefined;

  const initialStyle = STYLE_OPTIONS.find((style) => style === styleParam) as StyleOption | undefined;
  const initialProduct = ["card", "hoodie", "mug", "tee"].includes(productParam ?? "")
    ? (productParam as ProductType)
    : undefined;

  return <Wizard initialStyle={initialStyle} initialProduct={initialProduct} />;
}
