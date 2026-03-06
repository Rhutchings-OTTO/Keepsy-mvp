import type { Region } from "@/lib/region";
import type { OccasionId } from "@/lib/siteConfig";
import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

type MockupExample = {
  productType: MockupProductType;
  color: MockupColor;
  artworkImage: string;
};

type BeforeAfterTile = {
  beforeLabel: string;
  afterLabel: string;
  caption: string;
  beforeImage: string;
  afterImage: string;
  gift: MockupExample;
};

type OccasionTile = {
  id: OccasionId;
  chip: string;
  accent: string;
  artworkImage: string;
  productType: MockupProductType;
  color: MockupColor;
};

export const CREATE_EXAMPLES: Record<
  Region,
  {
    describeChips: string[];
    uploadTransformChips: string[];
    beforeAfterTiles: BeforeAfterTile[];
    occasionTiles: OccasionTile[];
    localInspiration: string[];
  }
> = {
  US: {
    describeChips: [
      "A cozy Thanksgiving family scene in warm watercolor.",
      "A Fourth of July backyard memory at golden hour.",
      "A Mother's Day floral keepsake with elegant brush texture.",
      "A birthday portrait with soft pastel flowers.",
      "A premium Christmas house portrait for a greeting card.",
      "A heartfelt anniversary line drawing on luxe cardstock.",
    ],
    uploadTransformChips: [
      "Turn our front door photo into a Christmas card illustration.",
      "Turn this family portrait into a fun caricature mug design.",
      "Make this dog photo into a soft watercolor keepsake.",
      "Transform this couple photo into elegant anniversary line art.",
      "Turn this birthday snapshot into a floral gift-ready illustration.",
    ],
    beforeAfterTiles: [
      {
        beforeLabel: "House portrait",
        afterLabel: "Christmas artwork",
        caption: "Front door photo -> festive watercolor -> flat card",
        beforeImage:
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/house-christmas.png",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/generated-examples/house-christmas.png",
        },
      },
      {
        beforeLabel: "Family portrait",
        afterLabel: "Caricature artwork",
        caption: "Family photo -> caricature -> mug gift",
        beforeImage:
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/family-caricature.png",
        gift: {
          productType: "mug",
          color: "white",
          artworkImage: "/generated-examples/family-caricature.png",
        },
      },
      {
        beforeLabel: "Dog snapshot",
        afterLabel: "Painterly portrait",
        caption: "Pet photo -> watercolor portrait -> hoodie keepsake",
        beforeImage:
          "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/pet-watercolor.png",
        gift: {
          productType: "hoodie",
          color: "blue",
          artworkImage: "/generated-examples/pet-watercolor.png",
        },
      },
      {
        beforeLabel: "Couple portrait",
        afterLabel: "Minimal line art",
        caption: "Anniversary photo -> line art -> keepsake card",
        beforeImage:
          "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/anniversary-line-art.png",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/generated-examples/anniversary-line-art.png",
        },
      },
    ],
    occasionTiles: [
      {
        id: "mothers-day",
        chip: "Floral portrait card",
        accent: "linear-gradient(145deg,#fff1f2 0%,#ffe4e6 55%,#fff8f3 100%)",
        artworkImage: "/generated-examples/mothers-day-bouquet.png",
        productType: "card",
        color: "white",
      },
      {
        id: "christmas",
        chip: "House portrait card",
        accent: "linear-gradient(145deg,#eef7ff 0%,#f0fdf4 55%,#e8f6ec 100%)",
        artworkImage: "/generated-examples/house-christmas.png",
        productType: "card",
        color: "white",
      },
      {
        id: "thanksgiving",
        chip: "Warm table scene",
        accent: "linear-gradient(145deg,#fff4e5 0%,#ffedd5 55%,#fef3c7 100%)",
        artworkImage: "/generated-examples/thanksgiving-tablescape.png",
        productType: "mug",
        color: "white",
      },
      {
        id: "fourth-of-july",
        chip: "Garden celebration tee",
        accent: "linear-gradient(145deg,#e0e7ff 0%,#dbeafe 55%,#fee2e2 100%)",
        artworkImage: "/generated-examples/fourth-july-garden.png",
        productType: "tshirt",
        color: "blue",
      },
      {
        id: "birthdays",
        chip: "Birthday floral hoodie",
        accent: "linear-gradient(145deg,#fdf4ff 0%,#f5f3ff 55%,#ede9fe 100%)",
        artworkImage: "/generated-examples/birthday-floral.png",
        productType: "hoodie",
        color: "white",
      },
      {
        id: "anniversaries",
        chip: "Minimal keepsake card",
        accent: "linear-gradient(145deg,#fff7ed 0%,#ffedd5 55%,#fef2f2 100%)",
        artworkImage: "/generated-examples/anniversary-line-art.png",
        productType: "card",
        color: "white",
      },
      {
        id: "pet-gifts",
        chip: "Pet portrait mug",
        accent: "linear-gradient(145deg,#ecfeff 0%,#e0f2fe 55%,#dcfce7 100%)",
        artworkImage: "/generated-examples/pet-watercolor.png",
        productType: "mug",
        color: "white",
      },
    ],
    localInspiration: [
      "Thanksgiving host gift",
      "Fourth of July backyard memory",
      "Mother's Day floral keepsake",
      "Holiday house portrait",
    ],
  },
  UK: {
    describeChips: [
      "A Mother's Day floral keepsake in soft neutrals.",
      "A Christmas house portrait with gentle watercolor detail.",
      "A birthday keepsake with floral illustration and calm tones.",
      "A premium anniversary line drawing for a greeting card.",
      "A painterly pet portrait for a cosy hoodie gift.",
      "A warm family caricature for an everyday mug keepsake.",
    ],
    uploadTransformChips: [
      "Turn our front door photo into a Christmas card illustration.",
      "Turn this family portrait into a fun caricature mug design.",
      "Make this dog photo into a soft watercolor keepsake.",
      "Transform this couple photo into elegant anniversary line art.",
      "Turn this birthday snapshot into a floral gift-ready illustration.",
    ],
    beforeAfterTiles: [
      {
        beforeLabel: "House portrait",
        afterLabel: "Christmas artwork",
        caption: "Front door photo -> festive watercolor -> flat card",
        beforeImage:
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/house-christmas.png",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/generated-examples/house-christmas.png",
        },
      },
      {
        beforeLabel: "Family portrait",
        afterLabel: "Caricature artwork",
        caption: "Family photo -> caricature -> mug gift",
        beforeImage:
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/family-caricature.png",
        gift: {
          productType: "mug",
          color: "white",
          artworkImage: "/generated-examples/family-caricature.png",
        },
      },
      {
        beforeLabel: "Dog snapshot",
        afterLabel: "Painterly portrait",
        caption: "Pet photo -> watercolor portrait -> hoodie keepsake",
        beforeImage:
          "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/pet-watercolor.png",
        gift: {
          productType: "hoodie",
          color: "blue",
          artworkImage: "/generated-examples/pet-watercolor.png",
        },
      },
      {
        beforeLabel: "Couple portrait",
        afterLabel: "Minimal line art",
        caption: "Anniversary photo -> line art -> keepsake card",
        beforeImage:
          "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
        afterImage: "/generated-examples/anniversary-line-art.png",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/generated-examples/anniversary-line-art.png",
        },
      },
    ],
    occasionTiles: [
      {
        id: "mothers-day",
        chip: "Floral portrait card",
        accent: "linear-gradient(145deg,#fff1f2 0%,#ffe4e6 55%,#fff8f3 100%)",
        artworkImage: "/generated-examples/mothers-day-bouquet.png",
        productType: "card",
        color: "white",
      },
      {
        id: "christmas",
        chip: "House portrait card",
        accent: "linear-gradient(145deg,#eef7ff 0%,#f0fdf4 55%,#e8f6ec 100%)",
        artworkImage: "/generated-examples/house-christmas.png",
        productType: "card",
        color: "white",
      },
      {
        id: "thanksgiving",
        chip: "Warm table scene",
        accent: "linear-gradient(145deg,#fff4e5 0%,#ffedd5 55%,#fef3c7 100%)",
        artworkImage: "/generated-examples/thanksgiving-tablescape.png",
        productType: "mug",
        color: "white",
      },
      {
        id: "fourth-of-july",
        chip: "Garden celebration tee",
        accent: "linear-gradient(145deg,#e0e7ff 0%,#dbeafe 55%,#fee2e2 100%)",
        artworkImage: "/generated-examples/fourth-july-garden.png",
        productType: "tshirt",
        color: "blue",
      },
      {
        id: "birthdays",
        chip: "Birthday floral hoodie",
        accent: "linear-gradient(145deg,#fdf4ff 0%,#f5f3ff 55%,#ede9fe 100%)",
        artworkImage: "/generated-examples/birthday-floral.png",
        productType: "hoodie",
        color: "white",
      },
      {
        id: "anniversaries",
        chip: "Minimal keepsake card",
        accent: "linear-gradient(145deg,#fff7ed 0%,#ffedd5 55%,#fef2f2 100%)",
        artworkImage: "/generated-examples/anniversary-line-art.png",
        productType: "card",
        color: "white",
      },
      {
        id: "pet-gifts",
        chip: "Pet portrait mug",
        accent: "linear-gradient(145deg,#ecfeff 0%,#e0f2fe 55%,#dcfce7 100%)",
        artworkImage: "/generated-examples/pet-watercolor.png",
        productType: "mug",
        color: "white",
      },
    ],
    localInspiration: [
      "Mother's Day floral keepsake",
      "Birthday portrait in soft colour",
      "Cosy Christmas house card",
      "Pet portrait gift",
    ],
  },
};
