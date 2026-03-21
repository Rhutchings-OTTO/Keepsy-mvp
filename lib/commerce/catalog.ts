/**
 * Canonical product catalog. Server-side only. Never trust client-provided price IDs.
 */
export type CatalogProduct = {
  id: string;
  name: string;
  priceGBP: number;
  priceUSD?: number;
};

export const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  postcard: { id: "postcard", name: "Fine Art Postcard",          priceGBP: 6.99,  priceUSD: 9.99  },
  cardpack: { id: "cardpack", name: "Greeting Cards (7 pack)",    priceGBP: 29.99, priceUSD: 39.99 },
  mug:      { id: "mug",      name: "Mug",                        priceGBP: 14.99, priceUSD: 19.99 },
  tee:    { id: "tee",    name: "Premium tee",     priceGBP: 29.99, priceUSD: 39.99 },
  hoodie: { id: "hoodie", name: "Hoodie",           priceGBP: 44.99, priceUSD: 59.99 },
  // Canvas — one entry per size; catalogId = "canvas_{W}x{H}"
  // USD prices = ceil((GBP × 1.33 + 0.01) / 5) × 5 − 0.01
  // Horizontal
  "canvas_10x8":  { id: "canvas_10x8",  name: "Canvas print (10×8 in)",   priceGBP: 29.99,  priceUSD: 39.99  },
  "canvas_12x9":  { id: "canvas_12x9",  name: "Canvas print (12×9 in)",   priceGBP: 34.99,  priceUSD: 49.99  },
  "canvas_14x11": { id: "canvas_14x11", name: "Canvas print (14×11 in)",  priceGBP: 39.99,  priceUSD: 54.99  },
  "canvas_16x12": { id: "canvas_16x12", name: "Canvas print (16×12 in)",  priceGBP: 44.99,  priceUSD: 59.99  },
  "canvas_18x12": { id: "canvas_18x12", name: "Canvas print (18×12 in)",  priceGBP: 49.99,  priceUSD: 69.99  },
  "canvas_20x10": { id: "canvas_20x10", name: "Canvas print (20×10 in)",  priceGBP: 49.99,  priceUSD: 69.99  },
  "canvas_20x16": { id: "canvas_20x16", name: "Canvas print (20×16 in)",  priceGBP: 54.99,  priceUSD: 74.99  },
  "canvas_24x16": { id: "canvas_24x16", name: "Canvas print (24×16 in)",  priceGBP: 59.99,  priceUSD: 79.99  },
  "canvas_24x18": { id: "canvas_24x18", name: "Canvas print (24×18 in)",  priceGBP: 64.99,  priceUSD: 89.99  },
  "canvas_24x20": { id: "canvas_24x20", name: "Canvas print (24×20 in)",  priceGBP: 69.99,  priceUSD: 94.99  },
  "canvas_30x15": { id: "canvas_30x15", name: "Canvas print (30×15 in)",  priceGBP: 74.99,  priceUSD: 99.99  },
  "canvas_30x20": { id: "canvas_30x20", name: "Canvas print (30×20 in)",  priceGBP: 74.99,  priceUSD: 99.99  },
  "canvas_30x24": { id: "canvas_30x24", name: "Canvas print (30×24 in)",  priceGBP: 84.99,  priceUSD: 114.99 },
  "canvas_32x24": { id: "canvas_32x24", name: "Canvas print (32×24 in)",  priceGBP: 84.99,  priceUSD: 114.99 },
  "canvas_36x12": { id: "canvas_36x12", name: "Canvas print (36×12 in)",  priceGBP: 79.99,  priceUSD: 109.99 },
  "canvas_36x24": { id: "canvas_36x24", name: "Canvas print (36×24 in)",  priceGBP: 89.99,  priceUSD: 119.99 },
  "canvas_40x20": { id: "canvas_40x20", name: "Canvas print (40×20 in)",  priceGBP: 99.99,  priceUSD: 134.99 },
  "canvas_40x30": { id: "canvas_40x30", name: "Canvas print (40×30 in)",  priceGBP: 119.99, priceUSD: 159.99 },
  "canvas_48x16": { id: "canvas_48x16", name: "Canvas print (48×16 in)",  priceGBP: 99.99,  priceUSD: 134.99 },
  "canvas_48x24": { id: "canvas_48x24", name: "Canvas print (48×24 in)",  priceGBP: 119.99, priceUSD: 159.99 },
  "canvas_48x32": { id: "canvas_48x32", name: "Canvas print (48×32 in)",  priceGBP: 159.99, priceUSD: 214.99 },
  "canvas_48x36": { id: "canvas_48x36", name: "Canvas print (48×36 in)",  priceGBP: 179.99, priceUSD: 239.99 },
  "canvas_60x20": { id: "canvas_60x20", name: "Canvas print (60×20 in)",  priceGBP: 149.99, priceUSD: 199.99 },
  "canvas_60x30": { id: "canvas_60x30", name: "Canvas print (60×30 in)",  priceGBP: 179.99, priceUSD: 239.99 },
  "canvas_60x40": { id: "canvas_60x40", name: "Canvas print (60×40 in)",  priceGBP: 219.99, priceUSD: 294.99 },
  // Vertical
  "canvas_8x10":  { id: "canvas_8x10",  name: "Canvas print (8×10 in)",   priceGBP: 29.99,  priceUSD: 39.99  },
  "canvas_9x12":  { id: "canvas_9x12",  name: "Canvas print (9×12 in)",   priceGBP: 34.99,  priceUSD: 49.99  },
  "canvas_10x20": { id: "canvas_10x20", name: "Canvas print (10×20 in)",  priceGBP: 49.99,  priceUSD: 69.99  },
  "canvas_11x14": { id: "canvas_11x14", name: "Canvas print (11×14 in)",  priceGBP: 39.99,  priceUSD: 54.99  },
  "canvas_12x16": { id: "canvas_12x16", name: "Canvas print (12×16 in)",  priceGBP: 44.99,  priceUSD: 59.99  },
  "canvas_12x18": { id: "canvas_12x18", name: "Canvas print (12×18 in)",  priceGBP: 49.99,  priceUSD: 69.99  },
  "canvas_12x36": { id: "canvas_12x36", name: "Canvas print (12×36 in)",  priceGBP: 79.99,  priceUSD: 109.99 },
  "canvas_15x30": { id: "canvas_15x30", name: "Canvas print (15×30 in)",  priceGBP: 74.99,  priceUSD: 99.99  },
  "canvas_16x20": { id: "canvas_16x20", name: "Canvas print (16×20 in)",  priceGBP: 54.99,  priceUSD: 74.99  },
  "canvas_16x24": { id: "canvas_16x24", name: "Canvas print (16×24 in)",  priceGBP: 59.99,  priceUSD: 79.99  },
  "canvas_16x48": { id: "canvas_16x48", name: "Canvas print (16×48 in)",  priceGBP: 99.99,  priceUSD: 134.99 },
  "canvas_18x24": { id: "canvas_18x24", name: "Canvas print (18×24 in)",  priceGBP: 64.99,  priceUSD: 89.99  },
  "canvas_20x24": { id: "canvas_20x24", name: "Canvas print (20×24 in)",  priceGBP: 69.99,  priceUSD: 94.99  },
  "canvas_20x30": { id: "canvas_20x30", name: "Canvas print (20×30 in)",  priceGBP: 74.99,  priceUSD: 99.99  },
  "canvas_20x40": { id: "canvas_20x40", name: "Canvas print (20×40 in)",  priceGBP: 99.99,  priceUSD: 134.99 },
  "canvas_20x60": { id: "canvas_20x60", name: "Canvas print (20×60 in)",  priceGBP: 149.99, priceUSD: 199.99 },
  "canvas_24x30": { id: "canvas_24x30", name: "Canvas print (24×30 in)",  priceGBP: 84.99,  priceUSD: 114.99 },
  "canvas_24x32": { id: "canvas_24x32", name: "Canvas print (24×32 in)",  priceGBP: 84.99,  priceUSD: 114.99 },
  "canvas_24x36": { id: "canvas_24x36", name: "Canvas print (24×36 in)",  priceGBP: 89.99,  priceUSD: 119.99 },
  "canvas_24x48": { id: "canvas_24x48", name: "Canvas print (24×48 in)",  priceGBP: 119.99, priceUSD: 159.99 },
  "canvas_30x40": { id: "canvas_30x40", name: "Canvas print (30×40 in)",  priceGBP: 119.99, priceUSD: 159.99 },
  "canvas_30x60": { id: "canvas_30x60", name: "Canvas print (30×60 in)",  priceGBP: 179.99, priceUSD: 239.99 },
  "canvas_32x48": { id: "canvas_32x48", name: "Canvas print (32×48 in)",  priceGBP: 159.99, priceUSD: 214.99 },
  "canvas_36x48": { id: "canvas_36x48", name: "Canvas print (36×48 in)",  priceGBP: 179.99, priceUSD: 239.99 },
  "canvas_40x60": { id: "canvas_40x60", name: "Canvas print (40×60 in)",  priceGBP: 219.99, priceUSD: 294.99 },
  // Square
  "canvas_6x6":   { id: "canvas_6x6",   name: "Canvas print (6×6 in)",    priceGBP: 29.99,  priceUSD: 39.99  },
  "canvas_10x10": { id: "canvas_10x10", name: "Canvas print (10×10 in)",  priceGBP: 34.99,  priceUSD: 49.99  },
  "canvas_12x12": { id: "canvas_12x12", name: "Canvas print (12×12 in)",  priceGBP: 39.99,  priceUSD: 54.99  },
  "canvas_14x14": { id: "canvas_14x14", name: "Canvas print (14×14 in)",  priceGBP: 44.99,  priceUSD: 59.99  },
  "canvas_16x16": { id: "canvas_16x16", name: "Canvas print (16×16 in)",  priceGBP: 49.99,  priceUSD: 69.99  },
  "canvas_20x20": { id: "canvas_20x20", name: "Canvas print (20×20 in)",  priceGBP: 69.99,  priceUSD: 94.99  },
  "canvas_24x24": { id: "canvas_24x24", name: "Canvas print (24×24 in)",  priceGBP: 89.99,  priceUSD: 119.99 },
  "canvas_30x30": { id: "canvas_30x30", name: "Canvas print (30×30 in)",  priceGBP: 109.99, priceUSD: 149.99 },
  "canvas_32x32": { id: "canvas_32x32", name: "Canvas print (32×32 in)",  priceGBP: 119.99, priceUSD: 159.99 },
  "canvas_36x36": { id: "canvas_36x36", name: "Canvas print (36×36 in)",  priceGBP: 159.99, priceUSD: 214.99 },
};

export const ALLOWED_SKUS = Object.keys(PRODUCT_CATALOG);
export const MAX_QUANTITY = 20;
export const MIN_QUANTITY = 1;
