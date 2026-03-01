import type { Region } from "@/lib/region";

export type SeasonalBlock = {
  title: string;
  description: string;
  prompts: string[];
};

export type HolidayBadge = {
  label: string;
  prompts: string[];
};

export type LandingContent = {
  region: Region;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  promptChips: string[];
  seasonalBlocks: SeasonalBlock[];
  holidayBadges: HolidayBadge[];
};

export const LANDING_CONTENT: Record<Region, LandingContent> = {
  US: {
    region: "US",
    heroTitle: "Create meaningful gifts for every season.",
    heroSubtitle:
      "Design personal keepsakes in minutes, then preview them on tees, hoodies, mugs, and cards before checkout.",
    primaryCta: "Start creating",
    promptChips: [
      "Warm Thanksgiving family table scene in watercolor",
      "Fourth of July backyard party with golden sunset lighting",
      "Elegant Christmas keepsake with soft festive lights",
      "Valentine's floral portrait with romantic pastel tones",
    ],
    seasonalBlocks: [
      {
        title: "Popular right now in the US",
        description: "Gift ideas people are creating this season.",
        prompts: [
          "Thanksgiving dinner portrait with cozy autumn colors",
          "Classic patriotic summer scene with flags and fireworks",
          "Christmas pet portrait in soft painterly style",
        ],
      },
      {
        title: "Family keepsake favorites",
        description: "Simple prompts with a premium, heartfelt feel.",
        prompts: [
          "Three-generation family portrait with warm window light",
          "Funny but tasteful couple illustration for anniversary",
          "New baby keepsake with minimal neutral tones",
        ],
      },
    ],
    holidayBadges: [
      { label: "Mother's Day (US) coming up", prompts: ["Floral portrait gift for Mom in soft watercolor"] },
      { label: "Thanksgiving", prompts: ["Family dinner keepsake with autumn leaves"] },
      { label: "Fourth of July", prompts: ["Patriotic picnic scene with warm evening glow"] },
      { label: "Valentine's Day", prompts: ["Romantic illustrated couple portrait with blush tones"] },
      { label: "Christmas", prompts: ["Cozy Christmas morning scene in photoreal style"] },
    ],
  },
  UK: {
    region: "UK",
    heroTitle: "Personal gifts, made beautifully for the UK.",
    heroSubtitle:
      "Turn your ideas into premium custom designs and see exactly how they look on keepsake products before checkout.",
    primaryCta: "Start creating",
    promptChips: [
      "Mother's Day UK floral keepsake in watercolor",
      "Elegant Father's Day portrait with classic tones",
      "Christmas family memory with warm candlelight",
      "Minimal birthday design with tasteful confetti accents",
    ],
    seasonalBlocks: [
      {
        title: "Popular right now in the UK",
        description: "Most-loved prompt styles this season.",
        prompts: [
          "Thank-you gift artwork with soft neutral palette",
          "New baby keepsake with gentle watercolor textures",
          "Birthday celebration scene with premium card-style composition",
        ],
      },
      {
        title: "Meaningful everyday gifting",
        description: "Timeless ideas that work all year.",
        prompts: [
          "Grandparents portrait in elegant painterly style",
          "Funny family moment in clean cartoon style",
          "Pet portrait with realistic fur detail and soft shadows",
        ],
      },
    ],
    holidayBadges: [
      { label: "Mother's Day (UK) coming up", prompts: ["Mum and children keepsake portrait with spring florals"] },
      { label: "Father's Day", prompts: ["Classic dad portrait with subtle vintage texture"] },
      { label: "Valentine's Day", prompts: ["Romantic hand-painted couple scene with warm light"] },
      { label: "Christmas", prompts: ["Cosy winter family artwork with festive decor"] },
      { label: "Thank you / New baby / Birthday", prompts: ["Minimal premium keepsake design for heartfelt moments"] },
    ],
  },
};

export function getLandingContent(region: Region): LandingContent {
  return LANDING_CONTENT[region];
}

