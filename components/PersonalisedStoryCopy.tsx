"use client";

import { useMemo } from "react";
import type { Region } from "@/lib/region";
import { getUpcomingOccasion } from "@/lib/occasion";
import { FF } from "@/lib/featureFlags";

type ProductType = "tshirt" | "hoodie" | "mug" | "card";

type PersonalisedStoryCopyProps = {
  region: Region;
  productType: ProductType;
};

const PRODUCT_COPY: Record<ProductType, string> = {
  tshirt: "on a premium tee they'll wear proudly",
  hoodie: "on a hoodie they'll reach for every day",
  mug: "on a mug they’ll smile at every morning",
  card: "on a keepsake card they can treasure",
};

export default function PersonalisedStoryCopy({ region, productType }: PersonalisedStoryCopyProps) {
  const message = useMemo(() => {
    const occasion = getUpcomingOccasion();
    if (occasion) return `This will make a beautiful ${occasion.occasionName} gift ${PRODUCT_COPY[productType]}.`;
    return `A thoughtful ${region} keepsake ${PRODUCT_COPY[productType]}.`;
  }, [productType, region]);

  if (!FF.personalisedStory) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-black/65 shadow-sm">
      {message}
    </div>
  );
}

