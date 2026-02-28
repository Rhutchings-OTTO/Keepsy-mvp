export type OccasionId =
  | "mothers-day"
  | "christmas"
  | "thanksgiving"
  | "fourth-of-july"
  | "birthdays"
  | "anniversaries"
  | "pet-gifts";

export type ProductType = "card" | "hoodie" | "mug" | "tee";

export type StyleOption =
  | "Watercolor portrait"
  | "Classic Christmas card"
  | "Kids as superheroes"
  | "Pet portrait"
  | "Vintage oil painting"
  | "Minimal line art";

export type OccasionConfig = {
  id: OccasionId;
  title: string;
  description: string;
  defaultStyle: StyleOption;
  defaultProduct: ProductType;
  image: string;
};

export type PromoConfig = {
  id: string;
  title: string;
  subtitle: string;
  discountLabel: string;
  startDate: string;
  endDate: string;
};

export const STYLE_OPTIONS: StyleOption[] = [
  "Watercolor portrait",
  "Classic Christmas card",
  "Kids as superheroes",
  "Pet portrait",
  "Vintage oil painting",
  "Minimal line art",
];

export const OCCASIONS: OccasionConfig[] = [
  {
    id: "mothers-day",
    title: "Mother's Day",
    description: "Heartfelt portrait gifts moms keep forever.",
    defaultStyle: "Watercolor portrait",
    defaultProduct: "card",
    image: "/occasion-tiles/mothers-day-floral.png",
  },
  {
    id: "christmas",
    title: "Christmas",
    description: "Warm festive cards and family keepsakes.",
    defaultStyle: "Classic Christmas card",
    defaultProduct: "card",
    image: "/occasion-tiles/christmas-scene.png",
  },
  {
    id: "thanksgiving",
    title: "Thanksgiving",
    description: "Family gratitude moments turned into gifts.",
    defaultStyle: "Vintage oil painting",
    defaultProduct: "mug",
    image: "/occasion-tiles/thanksgiving-cartoon.png",
  },
  {
    id: "fourth-of-july",
    title: "Fourth of July",
    description: "Celebrate with bold patriotic artwork.",
    defaultStyle: "Kids as superheroes",
    defaultProduct: "tee",
    image: "/occasion-tiles/fourth-july-photo.png",
  },
  {
    id: "birthdays",
    title: "Birthdays",
    description: "Personalized gifts ready in minutes.",
    defaultStyle: "Minimal line art",
    defaultProduct: "hoodie",
    image: "/occasion-tiles/birthday-confetti.png",
  },
  {
    id: "anniversaries",
    title: "Anniversaries",
    description: "Romantic custom art for meaningful milestones.",
    defaultStyle: "Watercolor portrait",
    defaultProduct: "card",
    image: "/occasion-tiles/anniversary-watercolor.png",
  },
  {
    id: "pet-gifts",
    title: "Pet gifts",
    description: "Turn pet photos into adorable keepsakes.",
    defaultStyle: "Pet portrait",
    defaultProduct: "mug",
    image: "/occasion-tiles/pet-gifts-portrait.png",
  },
];

export const PROMOS: PromoConfig[] = [
  {
    id: "thanksgiving-cards-20",
    title: "Thanksgiving Sale",
    subtitle: "Get family thank-you cards ready this week.",
    discountLabel: "20% off cards",
    startDate: "2026-11-10",
    endDate: "2026-11-30",
  },
  {
    id: "christmas-last-shipping",
    title: "Christmas cutoff reminder",
    subtitle: "Order by Dec 18 for UK delivery before Christmas.",
    discountLabel: "Priority fulfillment",
    startDate: "2026-12-01",
    endDate: "2026-12-18",
  },
];

export function getCurrentPromo(now = new Date()): PromoConfig | null {
  return (
    PROMOS.find((promo) => now >= new Date(promo.startDate) && now <= new Date(`${promo.endDate}T23:59:59`)) ?? null
  );
}

export function getSeasonalUrgency(occasionId: OccasionId, now = new Date()): string | null {
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (occasionId === "christmas" && (month === 12 || (month === 11 && day > 20))) {
    return "Christmas cutoff approaching — order early for on-time delivery.";
  }
  if (occasionId === "thanksgiving" && month === 11) {
    return "Thanksgiving is near — card production slots are filling.";
  }
  if (occasionId === "mothers-day" && (month === 3 || month === 4)) {
    return "Mother's Day demand is high — reserve your gift slot now.";
  }
  if (occasionId === "fourth-of-july" && (month === 6 || month === 7)) {
    return "Fourth of July gifts are trending this week.";
  }
  return null;
}
