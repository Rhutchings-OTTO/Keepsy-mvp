"use client";

import dynamic from "next/dynamic";

type InitialCreateQuery = {
  product?: string;
  prompt?: string;
  style?: string;
  occasion?: string;
  success?: boolean;
  canceled?: boolean;
};

const MerchGeneratorPlatform = dynamic(
  () => import("@/app/MerchGeneratorPlatform"),
  { ssr: false }
);

export function MerchGeneratorPlatformLoader({ initialQuery }: { initialQuery?: InitialCreateQuery }) {
  return <MerchGeneratorPlatform initialQuery={initialQuery} />;
}
