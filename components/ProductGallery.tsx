"use client";

/**
 * ProductGallery uses Three-Layer Sandwich Compositing:
 *
 * - Bottom: Static product base (fabric/ceramic texture)
 * - Middle: AI-generated artwork (mix-blend multiply for apparel, normal for mug/card; perspective transform)
 * - Top: Transparent PNG overlay (drawstrings, reflections, shadows) — fixed, never re-renders on prompt change
 *
 * When the user changes the prompt, only the Middle layer re-renders/fades.
 */
export { MockupStage as ProductGallery } from "@/components/mockups/MockupStage";
export type { MockupStageProps as ProductGalleryProps } from "@/components/mockups/MockupStage";
