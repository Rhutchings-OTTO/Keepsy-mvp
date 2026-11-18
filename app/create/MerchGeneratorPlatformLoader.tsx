"use client";

import dynamic from "next/dynamic";
import type { InitialCreateQuery } from "./createQuery";

const MerchGeneratorPlatform = dynamic(
  () => import("@/app/MerchGeneratorPlatform"),
  { ssr: false }
);

export function MerchGeneratorPlatformLoader({ initialQuery }: { initialQuery?: InitialCreateQuery }) {
  return <MerchGeneratorPlatform initialQuery={initialQuery} />;
}
