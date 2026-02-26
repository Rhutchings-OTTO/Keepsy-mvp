import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";

type ProductPageProps = {
  params: Promise<{ type: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((item) => item.type === type);
  if (!product) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Image src={product.image} alt={product.name} width={640} height={640} className="h-full w-full rounded-2xl object-cover" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-black/55">Product</p>
          <h1 className="mt-1 text-4xl font-black">{product.name}</h1>
          <p className="mt-2 text-black/65">Perfect for meaningful gifts, custom memories, and family moments.</p>
          <p className="mt-4 text-2xl font-black">From £{product.price}</p>
          <div className="mt-4 space-y-2 text-sm text-black/65">
            <p>• Gift-ready print quality</p>
            <p>• Fast dispatch options</p>
            <p>• Secure checkout</p>
          </div>
          <Link href={`/create?product=${product.type}`} className="mt-6 inline-block rounded-xl bg-black px-5 py-3 font-bold text-white">
            Personalize this product
          </Link>
        </div>
      </div>
    </section>
  );
}
