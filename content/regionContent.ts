import type { Region } from "@/lib/region";

export type RegionInspirationContent = {
  holidayBadges: string[];
  promptChips: string[];
  popularRightNow: string[];
};

export const REGION_CONTENT: Record<Region, RegionInspirationContent> = {
  US: {
    holidayBadges: [
      "Mother's Day (US) coming up",
      "Thanksgiving",
      "Fourth of July",
      "Valentine's Day",
      "Christmas",
    ],
    promptChips: [
      "A warm Mother's Day floral portrait in soft watercolor.",
      "A cozy Thanksgiving family dinner scene with golden evening light.",
      "A Fourth of July backyard celebration at dusk with subtle fireworks.",
      "A romantic Valentine's keepsake illustration with elegant blush tones.",
      "A classic Christmas family memory in painterly style.",
    ],
    popularRightNow: [
      "Mother's Day floral keepsakes",
      "Thanksgiving family portraits",
      "Fourth of July memory prints",
    ],
  },
  UK: {
    holidayBadges: [
      "Mother's Day (UK) coming up",
      "Father's Day",
      "Valentine's Day",
      "Christmas",
      "Thank you / New baby / Birthday",
    ],
    promptChips: [
      "A Mother's Day UK keepsake with soft floral details and warm neutrals.",
      "A Father's Day portrait with classic vintage texture and natural light.",
      "An elegant Christmas memory illustration with warm lighting.",
      "A premium thank-you card design in calm Scandinavian style.",
      "A gentle new baby keepsake in pastel tones.",
    ],
    popularRightNow: [
      "Mother's Day UK keepsakes",
      "Birthday memory cards",
      "Thank-you gift artwork",
    ],
  },
};

