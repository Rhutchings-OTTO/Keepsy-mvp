import type { Region } from "@/lib/region";

export type LandingContent = {
  region: Region;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  promptChips: string[];
  seasonalBlocks: { title: string; description: string; prompts: string[] }[];
  holidayBadges: { label: string; prompts: string[] }[];
};

export const LANDING_CONTENT: Record<Region, LandingContent> = {
  US: {
    region: "US",
    heroTitle: "Meaningful gifts, made in minutes.",
    heroSubtitle:
      "Create personal designs for cards, mugs, tees, and hoodies with warm, premium style.",
    primaryCta: "Start creating",
    promptChips: [
      "A warm Mother’s Day floral portrait with soft watercolor details",
      "Thanksgiving family table scene with cozy autumn lighting",
      "Fourth of July backyard celebration at dusk, realistic style",
      "Valentine’s keepsake illustration with elegant blush tones",
      "Classic Christmas family memory in painterly style",
    ],
    seasonalBlocks: [
      {
        title: "Popular right now",
        description: "US-ready ideas that feel personal and thoughtful.",
        prompts: [
          "Mother’s Day portrait with flowers and handwritten feel",
          "Thanksgiving dinner scene with playful warmth",
          "Fourth of July memory print with subtle fireworks glow",
        ],
      },
    ],
    holidayBadges: [
      { label: "Mother’s Day (US) coming up", prompts: ["Mother’s Day watercolor portrait for Mum"] },
      { label: "Thanksgiving", prompts: ["Cozy family Thanksgiving keepsake design"] },
      { label: "Fourth of July", prompts: ["Patriotic summer gathering scene at sunset"] },
      { label: "Valentine’s Day", prompts: ["Romantic minimalist illustration with warm neutrals"] },
      { label: "Christmas", prompts: ["Festive winter memory with elegant holiday palette"] },
    ],
  },
  UK: {
    region: "UK",
    heroTitle: "Personal gifts, beautifully crafted.",
    heroSubtitle:
      "Turn your ideas into premium keepsakes across cards, mugs, t-shirts, and hoodies.",
    primaryCta: "Start creating",
    promptChips: [
      "Mother’s Day UK floral keepsake with soft neutral tones",
      "Father’s Day portrait with classic vintage details",
      "Elegant Christmas memory illustration with warm lighting",
      "Thank you card artwork with modern Scandinavian style",
      "New baby keepsake design in gentle pastel palette",
    ],
    seasonalBlocks: [
      {
        title: "Popular right now",
        description: "UK-focused gifting ideas for everyday moments and big occasions.",
        prompts: [
          "Mother’s Day UK bouquet and portrait composition",
          "Birthday keepsake illustration with subtle confetti",
          "Thank-you card design with calm premium style",
        ],
      },
    ],
    holidayBadges: [
      { label: "Mother’s Day (UK) coming up", prompts: ["Mother’s Day UK floral portrait design"] },
      { label: "Father’s Day", prompts: ["Father’s Day keepsake with warm family mood"] },
      { label: "Valentine’s Day", prompts: ["Elegant romantic line-art with soft blush accents"] },
      { label: "Christmas", prompts: ["Classic Christmas home scene with warm glow"] },
      { label: "Thank you / New baby / Birthday", prompts: ["Minimal thank-you gift artwork with premium finish"] },
    ],
  },
};

