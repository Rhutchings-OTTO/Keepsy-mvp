"use client";

import { MockupWithLoupe } from "@/components/mockups/MockupWithLoupe";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  return (
    <ErrorBoundary
      fallback={
        <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-black/10 bg-white/60 p-6 text-center">
          <p className="text-sm font-semibold text-black/60">Preview unavailable</p>
        </div>
      }
    >
      <MockupWithLoupe {...props} />
    </ErrorBoundary>
  );
}
