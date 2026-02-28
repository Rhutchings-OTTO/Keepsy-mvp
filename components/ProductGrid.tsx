import Image from "next/image";
import type { ProductType } from "@/lib/siteConfig";

export type ProductCard = {
  type: ProductType;
  name: string;
  price: number;
  image: string;
};

export const PRODUCT_CARDS: ProductCard[] = [
  { type: "card", name: "Greeting Card", price: 8, image: "/product-tiles/plain-card.png" },
  { type: "hoodie", name: "Premium Hoodie", price: 40, image: "/product-tiles/plain-hoodie.png" },
  { type: "mug", name: "Ceramic Mug", price: 14, image: "/product-tiles/plain-mug.png" },
  { type: "tee", name: "Premium Tee", price: 29, image: "/product-tiles/plain-tee.png" },
];

type ProductGridProps = {
  selected?: ProductType;
  onSelect?: (type: ProductType) => void;
};

export function ProductGrid({ selected, onSelect }: ProductGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PRODUCT_CARDS.map((product) => (
        <button
          type="button"
          key={product.type}
          aria-label={`Choose ${product.name}`}
          onClick={() => onSelect?.(product.type)}
          className={`rounded-2xl border p-3 text-left ${selected === product.type ? "border-black bg-black text-white" : "border-black/10 bg-white"}`}
        >
          <Image src={product.image} alt={product.name} width={360} height={220} className="h-28 w-full rounded-xl object-cover" />
          <p className="mt-2 font-bold">{product.name}</p>
          <p className={`${selected === product.type ? "text-white/80" : "text-black/65"}`}>from £{product.price}</p>
        </button>
      ))}
    </div>
  );
}
