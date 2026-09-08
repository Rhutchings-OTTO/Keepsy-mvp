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
      "A golden retriever puppy surrounded by spring flowers",
      "A dad and daughter fishing by a lake at sunset",
      "Soft watercolour flowers with 'Happy Mother's Day' in elegant handwriting",
      "A cosy Christmas scene with a fireplace and stockings",
      "Two best friends laughing under fairy lights",
      "A vintage-style portrait of a family home in autumn",
    ],
    uploadTransformChips: [
      "Turn our front door photo into a Christmas card illustration.",
      "Turn this family photo into a soft watercolour painting for a mug.",
      "Make this dog photo into a soft watercolor keepsake.",
      "Transform this couple photo into elegant anniversary line art.",
      "Turn this birthday snapshot into a floral gift-ready illustration.",
    ],
    beforeAfterTiles: [
      {
        beforeLabel: "Summer house photo",
        afterLabel: "Snowy Christmas scene",
        caption: "Brick cottage in summer -> same house in snow with fairy lights and a wreath -> Christmas card",
        beforeImage: "/images/refresh/source-house.webp",
        afterImage: "/images/refresh/after-house.webp",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/images/refresh/after-house.webp",
        },
      },
      {
        beforeLabel: "Family walk photo",
        afterLabel: "Watercolour painting",
        caption: "Family of four seen from behind in a sunset meadow -> soft watercolour -> mug gift",
        beforeImage: "/images/refresh/source-family.webp",
        afterImage: "/images/refresh/after-family.webp",
        gift: {
          productType: "mug",
          color: "white",
          artworkImage: "/images/refresh/after-family.webp",
        },
      },
      {
        beforeLabel: "Dog snapshot",
        afterLabel: "Watercolour portrait",
        caption: "Golden retriever in the garden -> watercolour portrait with painted foliage -> hoodie keepsake",
        beforeImage: "/images/refresh/source-pet.webp",
        afterImage: "/images/refresh/after-pet.webp",
        gift: {
          productType: "hoodie",
          color: "blue",
          artworkImage: "/images/refresh/after-pet.webp",
        },
      },
      {
        beforeLabel: "Couple on the beach",
        afterLabel: "Line and wash art",
        caption: "Sunset beach walk photo -> ink and watercolour illustration -> anniversary card",
        beforeImage: "/images/refresh/source-couple.webp",
        afterImage: "/images/refresh/after-couple.webp",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/images/refresh/after-couple.webp",
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
        artworkImage: "/images/refresh/after-house.webp",
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
        artworkImage: "/images/refresh/after-couple.webp",
        productType: "card",
        color: "white",
      },
      {
        id: "pet-gifts",
        chip: "Pet portrait mug",
        accent: "linear-gradient(145deg,#ecfeff 0%,#e0f2fe 55%,#dcfce7 100%)",
        artworkImage: "/images/refresh/after-pet.webp",
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
      "A golden retriever puppy surrounded by spring flowers",
      "A dad and daughter fishing by a lake at sunset",
      "Soft watercolour flowers with 'Happy Mother's Day' in elegant handwriting",
      "A cosy Christmas scene with a fireplace and stockings",
      "Two best friends laughing under fairy lights",
      "A vintage-style portrait of a family home",
    ],
    uploadTransformChips: [
      "Turn our front door photo into a Christmas card illustration.",
      "Turn this family photo into a soft watercolour painting for a mug.",
      "Make this dog photo into a soft watercolor keepsake.",
      "Transform this couple photo into elegant anniversary line art.",
      "Turn this birthday snapshot into a floral gift-ready illustration.",
    ],
    beforeAfterTiles: [
      {
        beforeLabel: "Summer house photo",
        afterLabel: "Snowy Christmas scene",
        caption: "Brick cottage in summer -> same house in snow with fairy lights and a wreath -> Christmas card",
        beforeImage: "/images/refresh/source-house.webp",
        afterImage: "/images/refresh/after-house.webp",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/images/refresh/after-house.webp",
        },
      },
      {
        beforeLabel: "Family walk photo",
        afterLabel: "Watercolour painting",
        caption: "Family of four seen from behind in a sunset meadow -> soft watercolour -> mug gift",
        beforeImage: "/images/refresh/source-family.webp",
        afterImage: "/images/refresh/after-family.webp",
        gift: {
          productType: "mug",
          color: "white",
          artworkImage: "/images/refresh/after-family.webp",
        },
      },
      {
        beforeLabel: "Dog snapshot",
        afterLabel: "Watercolour portrait",
        caption: "Golden retriever in the garden -> watercolour portrait with painted foliage -> hoodie keepsake",
        beforeImage: "/images/refresh/source-pet.webp",
        afterImage: "/images/refresh/after-pet.webp",
        gift: {
          productType: "hoodie",
          color: "blue",
          artworkImage: "/images/refresh/after-pet.webp",
        },
      },
      {
        beforeLabel: "Couple on the beach",
        afterLabel: "Line and wash art",
        caption: "Sunset beach walk photo -> ink and watercolour illustration -> anniversary card",
        beforeImage: "/images/refresh/source-couple.webp",
        afterImage: "/images/refresh/after-couple.webp",
        gift: {
          productType: "card",
          color: "white",
          artworkImage: "/images/refresh/after-couple.webp",
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
        artworkImage: "/images/refresh/after-house.webp",
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
        artworkImage: "/images/refresh/after-couple.webp",
        productType: "card",
        color: "white",
      },
      {
        id: "pet-gifts",
        chip: "Pet portrait mug",
        accent: "linear-gradient(145deg,#ecfeff 0%,#e0f2fe 55%,#dcfce7 100%)",
        artworkImage: "/images/refresh/after-pet.webp",
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
