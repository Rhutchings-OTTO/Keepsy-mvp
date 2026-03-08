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
      "Soft watercolour flowers with 'Happy Mother's Day' in elegant handwriting",
      "A dad and daughter fishing by a lake at sunset",
      "A golden retriever puppy surrounded by spring flowers",
      "A cosy Christmas scene with a fireplace and stockings",
      "Two best friends laughing under fairy lights",
      "A vintage-style portrait of a family home in autumn",
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
      "Soft watercolour flowers with 'Happy Mother's Day' in elegant handwriting",
      "A dad and daughter fishing by a lake at sunset",
      "A golden retriever puppy surrounded by spring flowers",
      "A cosy Christmas scene with a fireplace and stockings",
      "Two best friends laughing under fairy lights",
      "A vintage-style portrait of a family home",
    ],
    popularRightNow: [
      "Mother's Day UK keepsakes",
      "Birthday memory cards",
      "Thank-you gift artwork",
    ],
  },
};

