"use client";

import { MockupWithLoupe } from "@/components/mockups/MockupWithLoupe";
import type { MockupColor, MockupProductType } from "@/lib/mockups/mockupConfig";

export type { MockupColor, MockupProductType };

type MockupRendererProps = {
  productType: MockupProductType;
  color: MockupColor;
  generatedImage: string | null;
  hasArtwork?: boolean;
  className?: string;
};

export function MockupRenderer(props: MockupRendererProps) {
  return <MockupWithLoupe {...props} />;
}
