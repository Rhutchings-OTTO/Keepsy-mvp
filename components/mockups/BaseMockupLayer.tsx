"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BaseMockupLayerProps = {
  baseMockupSrc: string;
  productType: string;
  aspectRatio: number;
};

export function BaseMockupLayer({ baseMockupSrc, productType }: BaseMockupLayerProps) {
  // Keep the last-loaded src visible until the new one has fully decoded,
  // preventing a flash when the user switches product types.
  const [displayedSrc, setDisplayedSrc] = useState(baseMockupSrc);

  useEffect(() => {
    if (baseMockupSrc === displayedSrc) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => { if (!cancelled) setDisplayedSrc(baseMockupSrc); };
    img.onerror = () => { if (!cancelled) setDisplayedSrc(baseMockupSrc); };
    img.src = baseMockupSrc;
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMockupSrc]);

  return (
    <Image
      src={displayedSrc}
      alt={`${productType} mockup`}
      fill
      className="object-contain"
      quality={85}
      sizes="(max-width: 1024px) 100vw, 700px"
    />
  );
}
