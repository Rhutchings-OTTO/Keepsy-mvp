/**
 * Full pool of floating example items for the hero.
 * Capacity-based layout will render as many as can safely fit.
 */

export type FloaterDef = {
  id: string;
  label: string;
  product: string;
  image: string;
};

export const FLOATER_POOL: FloaterDef[] = [
  { id: "tee-white", label: "Premium Tee Mockup", product: "T-Shirt", image: "/product-tiles/tee-white.png" },
  { id: "tee-black", label: "Tee Black Mockup", product: "T-Shirt", image: "/product-tiles/tee-black.png" },
  { id: "tee-blue", label: "Tee Blue Mockup", product: "T-Shirt", image: "/product-tiles/tee-blue.png" },
  { id: "plain-mug", label: "Plain Mug Mockup", product: "Mug", image: "/product-tiles/plain-mug-front.png" },
  { id: "plain-hoodie", label: "Plain Hoodie Mockup", product: "Hoodie", image: "/product-tiles/hoodie-white.png" },
  { id: "hoodie-blue", label: "Hoodie Blue Mockup", product: "Hoodie", image: "/product-tiles/hoodie-blue.png" },
  { id: "hoodie-black", label: "Hoodie Black Mockup", product: "Hoodie", image: "/product-tiles/hoodie-black.png" },
  { id: "plain-card", label: "Plain Card Mockup", product: "Card", image: "/product-tiles/plain-card.png" },
  { id: "christmas-scene", label: "Christmas Scene", product: "Design", image: "/occasion-tiles/christmas-scene.png" },
  { id: "thanksgiving-scene", label: "Thanksgiving Cartoon", product: "Design", image: "/occasion-tiles/thanksgiving-cartoon.png" },
  { id: "fourth-july-scene", label: "Fourth of July Photo", product: "Design", image: "/occasion-tiles/fourth-july-photo.png" },
  { id: "anniversary-scene", label: "Anniversary Watercolor", product: "Design", image: "/occasion-tiles/anniversary-watercolor.png" },
  { id: "birthday-scene", label: "Birthday Scene", product: "Design", image: "/occasion-tiles/birthday-confetti.png" },
  { id: "pet-scene", label: "Pet Portrait Scene", product: "Design", image: "/occasion-tiles/pet-gifts-portrait.png" },
  { id: "mothers-day-scene", label: "Mother's Day Floral", product: "Design", image: "/occasion-tiles/mothers-day-floral.png" },
];

export const FLOATER_POOL_SIZE = FLOATER_POOL.length;
