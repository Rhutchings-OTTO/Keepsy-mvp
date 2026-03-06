"use client";

import Image from "next/image";

type BaseMockupLayerProps = {
  baseMockupSrc: string;
  productType: string;
  aspectRatio: number;
};

export function BaseMockupLayer({ baseMockupSrc, productType }: BaseMockupLayerProps) {
  return (
    <Image
      src={baseMockupSrc}
      alt={`${productType} mockup`}
      fill
      className="object-contain"
      quality={100}
      sizes="(max-width: 1024px) 100vw, 700px"
    />
  );
}
