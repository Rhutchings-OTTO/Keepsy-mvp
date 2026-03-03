/**
 * Canonical floater pool: product mockups + holiday/idea tiles.
 * Balanced selection ensures rich mix on desktop (60% ideas, 40% mockups).
 */

export type FloaterType = "mockup" | "idea";

export type FloaterDef = {
  id: string;
  type: FloaterType;
  title: string;
  subtitle: string;
  image: string;
  priority: number;
};

const IDEA_TILES: FloaterDef[] = [
  { id: "thanksgiving-scene", type: "idea", title: "Thanksgiving Cartoon", subtitle: "Design preview", image: "/occasion-tiles/thanksgiving-cartoon.png", priority: 1 },
  { id: "pet-scene", type: "idea", title: "Pet Portrait Scene", subtitle: "Design preview", image: "/occasion-tiles/pet-gifts-portrait.png", priority: 2 },
  { id: "fourth-july-scene", type: "idea", title: "Fourth of July Photo", subtitle: "Design preview", image: "/occasion-tiles/fourth-july-photo.png", priority: 3 },
  { id: "anniversary-scene", type: "idea", title: "Anniversary Watercolor", subtitle: "Design preview", image: "/occasion-tiles/anniversary-watercolor.png", priority: 4 },
  { id: "christmas-scene", type: "idea", title: "Christmas Scene", subtitle: "Design preview", image: "/occasion-tiles/christmas-scene.png", priority: 5 },
  { id: "birthday-scene", type: "idea", title: "Birthday Scene", subtitle: "Design preview", image: "/occasion-tiles/birthday-confetti.png", priority: 6 },
  { id: "mothers-day-scene", type: "idea", title: "Mother's Day Floral", subtitle: "Design preview", image: "/occasion-tiles/mothers-day-floral.png", priority: 7 },
];

const PRODUCT_MOCKUPS: FloaterDef[] = [
  { id: "plain-card", type: "mockup", title: "Plain Card Mockup", subtitle: "Card preview", image: "/product-tiles/plain-card.png", priority: 1 },
  { id: "plain-mug", type: "mockup", title: "Plain Mug Mockup", subtitle: "Mug preview", image: "/product-tiles/plain-mug-front.png", priority: 2 },
  { id: "tee-white", type: "mockup", title: "Premium Tee Mockup", subtitle: "T-Shirt preview", image: "/product-tiles/tee-white.png", priority: 3 },
  { id: "plain-hoodie", type: "mockup", title: "Plain Hoodie Mockup", subtitle: "Hoodie preview", image: "/product-tiles/hoodie-white.png", priority: 4 },
  { id: "tee-black", type: "mockup", title: "Tee Black Mockup", subtitle: "T-Shirt preview", image: "/product-tiles/tee-black.png", priority: 5 },
  { id: "tee-blue", type: "mockup", title: "Tee Blue Mockup", subtitle: "T-Shirt preview", image: "/product-tiles/tee-blue.png", priority: 6 },
  { id: "hoodie-blue", type: "mockup", title: "Hoodie Blue Mockup", subtitle: "Hoodie preview", image: "/product-tiles/hoodie-blue.png", priority: 7 },
  { id: "hoodie-black", type: "mockup", title: "Hoodie Black Mockup", subtitle: "Hoodie preview", image: "/product-tiles/hoodie-black.png", priority: 8 },
  { id: "preview-tee-blue", type: "mockup", title: "Tee Blue Preview", subtitle: "T-Shirt preview", image: "/mockup-previews/preview-tee-blue.png", priority: 9 },
  { id: "preview-hoodie-black", type: "mockup", title: "Hoodie Black Preview", subtitle: "Hoodie preview", image: "/mockup-previews/preview-hoodie-black.png", priority: 10 },
  { id: "preview-plain-card", type: "mockup", title: "Card Preview", subtitle: "Card preview", image: "/mockup-previews/preview-plain-card.png", priority: 11 },
];

export const FLOATER_POOL: FloaterDef[] = [...IDEA_TILES, ...PRODUCT_MOCKUPS];
export const FLOATER_POOL_SIZE = FLOATER_POOL.length;

const MOBILE_BREAK = 640;
const TABLET_BREAK = 1024;

/**
 * Select a balanced mix of floaters by type.
 * Desktop: 60% idea tiles, 40% mockups
 * Tablet: 50/50
 * Mobile: mostly mockups, at least 1 idea tile if possible
 */
export function selectBalancedFloaters(
  capacity: number,
  viewportWidth: number
): FloaterDef[] {
  if (capacity <= 0) return [];

  const isMobile = viewportWidth < MOBILE_BREAK;
  const isTablet = viewportWidth >= MOBILE_BREAK && viewportWidth < TABLET_BREAK;

  let ideaRatio: number;
  if (isMobile) {
    ideaRatio = 0.25;
  } else if (isTablet) {
    ideaRatio = 0.5;
  } else {
    ideaRatio = 0.6;
  }

  const ideaCount = Math.max(isMobile ? 1 : 0, Math.round(capacity * ideaRatio));
  const mockupCount = capacity - ideaCount;

  const ideasSorted = [...IDEA_TILES].sort((a, b) => a.priority - b.priority);
  const mockupsSorted = [...PRODUCT_MOCKUPS].sort((a, b) => a.priority - b.priority);

  const selectedIdeas = ideasSorted.slice(0, Math.min(ideaCount, ideasSorted.length));
  const selectedMockups = mockupsSorted.slice(0, Math.min(mockupCount, mockupsSorted.length));

  const result: FloaterDef[] = [];
  const maxLen = Math.max(selectedIdeas.length, selectedMockups.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < selectedIdeas.length) result.push(selectedIdeas[i]);
    if (i < selectedMockups.length) result.push(selectedMockups[i]);
  }

  return result.slice(0, capacity);
}
