import type { Region } from "@/lib/region";

export const CREATE_EXAMPLES: Record<
  Region,
  {
    describeChips: string[];
    uploadTransformChips: string[];
    beforeAfterTiles: { beforeLabel: string; afterLabel: string; caption: string }[];
  }
> = {
  US: {
    describeChips: [
      "A cozy Thanksgiving family scene in warm watercolor.",
      "A Fourth of July backyard memory at golden hour.",
      "A Mother's Day (US) floral keepsake for Mum.",
      "A Valentine's portrait with elegant soft tones.",
      "A heartfelt birthday card illustration.",
      "A premium thank-you keepsake with subtle texture.",
    ],
    uploadTransformChips: [
      "Turn our house into a Christmas watercolor for a card.",
      "Turn our family photo into a birthday card illustration.",
      "Make this landscape look like a vintage travel poster.",
      "Turn this pet photo into a cozy watercolor portrait.",
      "Transform this photo into a Mother's Day (US) keepsake style.",
    ],
    beforeAfterTiles: [
      { beforeLabel: "Family photo", afterLabel: "Christmas card style", caption: "Photo -> Christmas card" },
      { beforeLabel: "House photo", afterLabel: "Watercolor keepsake", caption: "Home memory -> watercolor gift" },
      { beforeLabel: "Pet snapshot", afterLabel: "Cozy portrait art", caption: "Pet photo -> portrait print" },
      { beforeLabel: "Landscape photo", afterLabel: "Vintage poster", caption: "Scenery -> travel-style art" },
    ],
  },
  UK: {
    describeChips: [
      "A Mother's Day (UK) floral keepsake in soft neutrals.",
      "A Father's Day portrait with classic vintage details.",
      "A gentle New baby illustration in pastel tones.",
      "A Valentine's memory print with elegant lighting.",
      "A birthday keepsake card with subtle celebration details.",
      "A premium thank-you gift design with calm texture.",
    ],
    uploadTransformChips: [
      "Turn our house into a Christmas watercolor for a card.",
      "Turn our family photo into a birthday card illustration.",
      "Make this landscape look like a vintage travel poster.",
      "Turn this pet photo into a cozy watercolor portrait.",
      "Transform this photo into a Mother's Day (UK) keepsake style.",
    ],
    beforeAfterTiles: [
      { beforeLabel: "Family photo", afterLabel: "Christmas card style", caption: "Photo -> Christmas card" },
      { beforeLabel: "Home snapshot", afterLabel: "Watercolor keepsake", caption: "Home photo -> keepsake art" },
      { beforeLabel: "Pet photo", afterLabel: "Painterly portrait", caption: "Pet photo -> portrait gift" },
      { beforeLabel: "Landscape", afterLabel: "Vintage poster style", caption: "Landscape -> vintage art print" },
    ],
  },
};

