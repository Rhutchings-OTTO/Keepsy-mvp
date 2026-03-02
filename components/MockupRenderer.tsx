"use client";

import { MockupStage } from "@/components/mockups/MockupStage";
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
  return <MockupStage {...props} />;
}
