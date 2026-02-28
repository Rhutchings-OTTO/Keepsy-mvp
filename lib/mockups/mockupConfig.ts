import { getPlacement, type MockupColor, type MockupProductType, type PlacementEntry } from "./placements";

export type { MockupColor, MockupProductType };
export type MockupConfigEntry = PlacementEntry;

export function getMockupConfig(productType: MockupProductType, color: MockupColor): MockupConfigEntry {
  return getPlacement(productType, color);
}
