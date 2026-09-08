/**
 * Single cart store shared by the create flow, the global cart drawer and the
 * add-ons drawer. Persisted in localStorage under the historical key
 * `keepsy_cart_v2` (backwards compatible with the previous line shape).
 *
 * Pure functions (`mergeLine`, `normaliseLine`, …) are exported for tests; the
 * stateful API (`getCart`, `addLine`, …) is a thin wrapper around them.
 */
import {
  FREE_SHIPPING_THRESHOLD,
  getCatalogProduct,
  getUnitPrice,
  roundMoney,
  shippingFor,
  type Currency,
} from "@/lib/commerce/pricing";

export const CART_STORAGE_KEY = "keepsy_cart_v2";
export const CART_UPDATED_EVENT = "cart-updated";
export const MAX_LINE_QUANTITY = 20;

export type SourceKind = "ai" | "original";

export type CartLine = {
  /** Stable id derived from the variant key (see `lineKey`). */
  id: string;
  /** Server catalogue id: tee, hoodie, mug, postcard, cardpack, uscard_1, canvas_20x16 … */
  productId: string;
  name: string;
  color?: string;
  size?: string;
  /** Preview image (https preferred; data URL tolerated for freshly generated designs). */
  imageUrl: string;
  /** Permanent https URL used for printing. */
  designUrl?: string;
  /** Canvas only: https URL of the user's crop. */
  croppedImageUrl?: string;
  /** "original" = customer photo printed unchanged; "ai" = generated/edited design. */
  sourceKind?: SourceKind;
  /** Pixel size of the print source, when known (for honest print-quality display). */
  sourceWidth?: number;
  sourceHeight?: number;
  /** Session node this line was created from (for history/selection). */
  designId?: string;
  /** Set when the line was added through the add-ons drawer. */
  addonId?: string;
  /** Price captured when added; the server re-prices from the catalogue anyway. */
  unitPrice: number;
  currency?: Currency;
  quantity: number;
};

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  amountToFreeShipping: number;
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

/** Deterministic identity for "the same thing in the basket". */
export function lineKey(line: Pick<CartLine, "productId" | "color" | "size" | "designUrl" | "imageUrl" | "croppedImageUrl" | "addonId">): string {
  const design = line.croppedImageUrl || line.designUrl || line.imageUrl || "";
  // Data URLs are huge; hash them cheaply so ids stay short.
  const designKey = design.startsWith("data:") ? `data:${cheapHash(design)}` : design;
  return [
    line.productId.toLowerCase(),
    (line.color ?? "").toLowerCase(),
    (line.size ?? "").toLowerCase(),
    designKey,
    line.addonId ?? "",
  ].join("|");
}

export function cheapHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function makeLineId(line: Parameters<typeof lineKey>[0]): string {
  return `line-${cheapHash(lineKey(line))}`;
}

/** Validate/repair a persisted line. Returns null when it cannot be sold. */
export function normaliseLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const productId = typeof r.productId === "string" ? r.productId : "";
  if (!productId || !getCatalogProduct(productId)) return null;
  const quantity = Number(r.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) return null;
  const imageUrl = typeof r.imageUrl === "string" && r.imageUrl ? r.imageUrl : (typeof r.designUrl === "string" ? r.designUrl : "");
  if (!imageUrl) return null;
  const unitPrice = Number(r.unitPrice);
  const line: CartLine = {
    id: "",
    productId,
    name: typeof r.name === "string" && r.name ? r.name : getCatalogProduct(productId)!.name,
    imageUrl,
    unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : getCatalogProduct(productId)!.priceGBP,
    quantity,
  };
  if (typeof r.color === "string" && r.color) line.color = r.color;
  if (typeof r.size === "string" && r.size) line.size = r.size;
  if (typeof r.designUrl === "string" && r.designUrl && !r.designUrl.startsWith("data:")) line.designUrl = r.designUrl;
  if (typeof r.croppedImageUrl === "string" && r.croppedImageUrl && !r.croppedImageUrl.startsWith("data:")) line.croppedImageUrl = r.croppedImageUrl;
  if (r.sourceKind === "ai" || r.sourceKind === "original") line.sourceKind = r.sourceKind;
  if (typeof r.sourceWidth === "number" && r.sourceWidth > 0) line.sourceWidth = r.sourceWidth;
  if (typeof r.sourceHeight === "number" && r.sourceHeight > 0) line.sourceHeight = r.sourceHeight;
  if (typeof r.designId === "string" && r.designId) line.designId = r.designId;
  if (typeof r.addonId === "string" && r.addonId) line.addonId = r.addonId;
  if (r.currency === "gbp" || r.currency === "usd") line.currency = r.currency;
  line.id = typeof r.id === "string" && r.id ? r.id : makeLineId(line);
  return line;
}

export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: CartLine[] = [];
    for (const item of parsed) {
      const line = normaliseLine(item);
      if (line) out.push(line);
    }
    return out;
  } catch {
    return [];
  }
}

/** Add a line, merging quantities when the same variant+design already exists. */
export function mergeLine(lines: CartLine[], incoming: Omit<CartLine, "id"> & { id?: string }): CartLine[] {
  const id = makeLineId(incoming);
  const existing = lines.find((l) => l.id === id || lineKey(l) === lineKey(incoming));
  if (existing) {
    return lines.map((l) =>
      l === existing
        ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + incoming.quantity) }
        : l
    );
  }
  return [...lines, { ...incoming, id }];
}

export function setLineQuantity(lines: CartLine[], id: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((l) => l.id !== id);
  return lines.map((l) => (l.id === id ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : l));
}

export function removeLine(lines: CartLine[], id: string): CartLine[] {
  return lines.filter((l) => l.id !== id);
}

/** Price a line for the current region; falls back to the captured price. */
export function linePrice(line: CartLine, currency: Currency): number {
  return getUnitPrice(line.productId, currency) ?? line.unitPrice;
}

export function computeTotals(lines: CartLine[], currency: Currency): CartTotals {
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + linePrice(l, currency) * l.quantity, 0));
  const shipping = lines.length === 0 ? 0 : shippingFor(subtotal, currency);
  return {
    subtotal,
    shipping,
    total: roundMoney(subtotal + shipping),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    amountToFreeShipping: Math.max(0, roundMoney(FREE_SHIPPING_THRESHOLD - subtotal)),
  };
}

// ─── Stateful API ────────────────────────────────────────────────────────────

let state: CartLine[] | null = null;

function load(): CartLine[] {
  if (state) return state;
  if (typeof window === "undefined") return [];
  state = parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  return state;
}

function persist(lines: CartLine[]) {
  state = lines;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Quota exceeded: drop data-URL previews in favour of https URLs and retry.
    try {
      const slim = lines.map((l) =>
        l.imageUrl.startsWith("data:") && l.designUrl ? { ...l, imageUrl: l.designUrl } : l
      );
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(slim));
      state = slim;
    } catch {
      // give up silently; in-memory cart still works for this session
    }
  }
  emit();
}

export function getCart(): CartLine[] {
  return load();
}

/** Re-read localStorage (another tab or legacy writer changed it). */
export function reloadCart(): CartLine[] {
  state = null;
  const lines = load();
  listeners.forEach((l) => l());
  return lines;
}

export function addLine(incoming: Omit<CartLine, "id"> & { id?: string }): CartLine[] {
  const next = mergeLine(load(), incoming);
  persist(next);
  return next;
}

export function addLines(incoming: Array<Omit<CartLine, "id"> & { id?: string }>): CartLine[] {
  let next = load();
  for (const line of incoming) next = mergeLine(next, line);
  persist(next);
  return next;
}

export function updateQuantity(id: string, quantity: number): CartLine[] {
  const next = setLineQuantity(load(), id, quantity);
  persist(next);
  return next;
}

export function removeFromCart(id: string): CartLine[] {
  const next = removeLine(load(), id);
  persist(next);
  return next;
}

export function replaceCart(lines: CartLine[]): void {
  persist(lines);
}

export function clearCart(): void {
  persist([]);
}

export function subscribeCart(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test helper — reset the in-memory cache. */
export function __resetCartStoreForTests(): void {
  state = null;
  listeners.clear();
}
