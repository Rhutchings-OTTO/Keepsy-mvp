import Image from "next/image";
import type { ProductType } from "@/lib/siteConfig";

export type ProductCard = {
  type: ProductType;
  name: string;
  price: number;
  image: string;
  valueFrame: string;
};

export const PRODUCT_CARDS: ProductCard[] = [
  { type: "card", name: "Greeting Card", price: 9.99, image: "/product-tiles/plain-card.png", valueFrame: "Less than a bunch of flowers" },
  { type: "hoodie", name: "Premium Hoodie", price: 44.99, image: "/product-tiles/hoodie-white.png", valueFrame: "A gift they'll wear every day" },
  { type: "mug", name: "Ceramic Mug", price: 18.99, image: "/product-tiles/plain-mug-front.png", valueFrame: "They'll think of you every morning" },
  { type: "tee", name: "Premium Tee", price: 29.99, image: "/product-tiles/tee-white.png", valueFrame: "Less than a dinner out" },
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
          className={`rounded-2xl border p-3 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 ${selected === product.type ? "border-black !text-white" : "border-black/10"}`}
          style={selected === product.type ? { backgroundColor: "var(--color-charcoal)" } : { backgroundColor: "var(--color-cream)" }}
        >
          <div className={`rounded-xl border ${selected === product.type ? "border-white/10 bg-white/5" : "border-black/6"} p-2`}
            style={selected !== product.type ? { backgroundColor: "rgba(253,246,238,0.6)" } : undefined}
          >
            <Image src={product.image} alt={product.name} width={360} height={220} className="h-28 w-full object-contain" />
          </div>
          <p className="mt-2 font-bold">{product.name}</p>
          <p className={`${selected === product.type ? "text-white/80" : "text-black/65"}`}>from £{product.price}</p>
          <p className={`mt-0.5 text-[11px] ${selected === product.type ? "text-white/50" : "text-black/40"}`}>{product.valueFrame}</p>
        </button>
      ))}
    </div>
  );
}
