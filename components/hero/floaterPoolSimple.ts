/**
 * Canonical pool for HeroFloatersSimple: 20–24 unique items (mockups + ideas).
 */

export type FloaterItem = {
  id: string;
  type: "mockup" | "idea";
  title: string;
  subtitle: string;
  imageSrc: string;
  /** Product preview slug for mockups that map to a product */
  productSlug?: "tee" | "hoodie" | "mug" | "card";
};

export const FLOATER_POOL_SIMPLE: FloaterItem[] = [
  { id: "thanksgiving-scene", type: "idea", title: "Thanksgiving Cartoon", subtitle: "Design preview", imageSrc: "/occasion-tiles/thanksgiving-cartoon.png" },
  { id: "pet-scene", type: "idea", title: "Pet Portrait Scene", subtitle: "Design preview", imageSrc: "/occasion-tiles/pet-gifts-portrait.png" },
  { id: "fourth-july-scene", type: "idea", title: "Fourth of July Photo", subtitle: "Design preview", imageSrc: "/occasion-tiles/fourth-july-photo.png" },
  { id: "anniversary-scene", type: "idea", title: "Anniversary Watercolor", subtitle: "Design preview", imageSrc: "/occasion-tiles/anniversary-watercolor.png" },
  { id: "christmas-scene", type: "idea", title: "Christmas Scene", subtitle: "Design preview", imageSrc: "/occasion-tiles/christmas-scene.png" },
  { id: "birthday-scene", type: "idea", title: "Birthday Scene", subtitle: "Design preview", imageSrc: "/occasion-tiles/birthday-confetti.png" },
  { id: "mothers-day-scene", type: "idea", title: "Mother's Day Floral", subtitle: "Design preview", imageSrc: "/occasion-tiles/mothers-day-floral.png" },
  { id: "plain-card", type: "mockup", title: "Plain Card Mockup", subtitle: "Card preview", imageSrc: "/product-tiles/plain-card.png", productSlug: "card" },
  { id: "plain-mug", type: "mockup", title: "Plain Mug Mockup", subtitle: "Mug preview", imageSrc: "/product-tiles/plain-mug-front.png", productSlug: "mug" },
  { id: "tee-white", type: "mockup", title: "Premium Tee Mockup", subtitle: "T-Shirt preview", imageSrc: "/product-tiles/tee-white.png", productSlug: "tee" },
  { id: "plain-hoodie", type: "mockup", title: "Plain Hoodie Mockup", subtitle: "Hoodie preview", imageSrc: "/product-tiles/hoodie-white.png", productSlug: "hoodie" },
  { id: "tee-black", type: "mockup", title: "Tee Black Mockup", subtitle: "T-Shirt preview", imageSrc: "/product-tiles/tee-black.png", productSlug: "tee" },
  { id: "tee-blue", type: "mockup", title: "Tee Blue Mockup", subtitle: "T-Shirt preview", imageSrc: "/product-tiles/tee-blue.png", productSlug: "tee" },
  { id: "hoodie-blue", type: "mockup", title: "Hoodie Blue Mockup", subtitle: "Hoodie preview", imageSrc: "/product-tiles/hoodie-blue.png", productSlug: "hoodie" },
  { id: "hoodie-black", type: "mockup", title: "Hoodie Black Mockup", subtitle: "Hoodie preview", imageSrc: "/product-tiles/hoodie-black.png", productSlug: "hoodie" },
  { id: "preview-tee-blue", type: "mockup", title: "Tee Blue Preview", subtitle: "T-Shirt preview", imageSrc: "/mockup-previews/preview-tee-blue.png", productSlug: "tee" },
  { id: "preview-hoodie-black", type: "mockup", title: "Hoodie Black Preview", subtitle: "Hoodie preview", imageSrc: "/mockup-previews/preview-hoodie-black.png", productSlug: "hoodie" },
  { id: "preview-plain-card", type: "mockup", title: "Card Preview", subtitle: "Card preview", imageSrc: "/mockup-previews/preview-plain-card.png", productSlug: "card" },
  { id: "preview-tee-white", type: "mockup", title: "Tee White Preview", subtitle: "T-Shirt preview", imageSrc: "/mockup-previews/preview-tee-white.png", productSlug: "tee" },
  { id: "preview-tee-black", type: "mockup", title: "Tee Black Preview", subtitle: "T-Shirt preview", imageSrc: "/mockup-previews/preview-tee-black.png", productSlug: "tee" },
  { id: "preview-plain-mug", type: "mockup", title: "Mug Preview", subtitle: "Mug preview", imageSrc: "/mockup-previews/preview-plain-mug-front.png", productSlug: "mug" },
  { id: "preview-hoodie-white", type: "mockup", title: "Hoodie White Preview", subtitle: "Hoodie preview", imageSrc: "/mockup-previews/preview-hoodie-white.png", productSlug: "hoodie" },
  { id: "preview-hoodie-blue", type: "mockup", title: "Hoodie Blue Preview", subtitle: "Hoodie preview", imageSrc: "/mockup-previews/preview-hoodie-blue.png", productSlug: "hoodie" },
];
