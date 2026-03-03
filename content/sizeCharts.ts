/**
 * Size chart data for T-shirt and Hoodie products.
 * Measurements are exact per spec—no rounding.
 */

export type SizeLabel = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";

export interface SizeRow {
  label: string;
  key: "width" | "length" | "sleeve" | "tolerance";
}

export interface SizeChartData {
  sizes: SizeLabel[];
  rows: SizeRow[];
  /** Indexed by row key, then by size index */
  values: Record<string, number[]>;
}

/** T-shirt — Imperial (inches) */
export const TSHIRT_IMPERIAL: SizeChartData = {
  sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
  rows: [
    { label: "Width", key: "width" },
    { label: "Length", key: "length" },
    { label: "Sleeve length from center back", key: "sleeve" },
    { label: "Size tolerance", key: "tolerance" },
  ],
  values: {
    width: [20.08, 22.05, 24.02, 25.98, 27.99, 29.92, 31.89, 33.86],
    length: [27.17, 27.95, 29.13, 29.92, 31.1, 31.89, 33.07, 33.86],
    sleeve: [33.5, 34.5, 35.5, 36.5, 37.5, 38.5, 39.5, 40.5],
    tolerance: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5],
  },
};

/** T-shirt — Metric (cm) */
export const TSHIRT_METRIC: SizeChartData = {
  sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
  rows: [
    { label: "Width", key: "width" },
    { label: "Length", key: "length" },
    { label: "Sleeve length from center back", key: "sleeve" },
    { label: "Size tolerance", key: "tolerance" },
  ],
  values: {
    width: [51.0, 56.0, 61.0, 66.0, 71.1, 76.0, 81.0, 86.0],
    length: [69.0, 71.0, 74.0, 76.0, 79.0, 81.0, 84.0, 86.0],
    sleeve: [85.09, 87.63, 90.17, 92.71, 95.25, 97.79, 100.33, 102.87],
    tolerance: [3.81, 3.81, 3.81, 3.81, 3.81, 3.81, 3.81, 3.81],
  },
};

/** Hoodie — Imperial (inches), sizes S–4XL */
export const HOODIE_IMPERIAL: SizeChartData = {
  sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  rows: [
    { label: "Width", key: "width" },
    { label: "Length", key: "length" },
    { label: "Sleeve length from center back", key: "sleeve" },
    { label: "Size tolerance", key: "tolerance" },
  ],
  values: {
    width: [18.25, 20.25, 22.0, 24.0, 26.0, 27.75, 29.75],
    length: [26.62, 28.0, 29.37, 30.75, 31.62, 32.5, 33.5],
    sleeve: [16.25, 17.75, 19.0, 20.5, 21.75, 23.25, 24.63],
    tolerance: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5],
  },
};

/** Hoodie — Metric (cm) */
export const HOODIE_METRIC: SizeChartData = {
  sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  rows: [
    { label: "Width", key: "width" },
    { label: "Length", key: "length" },
    { label: "Sleeve length from center back", key: "sleeve" },
    { label: "Size tolerance", key: "tolerance" },
  ],
  values: {
    width: [46.36, 51.44, 55.88, 60.96, 66.04, 70.48, 75.56],
    length: [67.63, 71.12, 74.61, 78.11, 80.33, 82.55, 85.09],
    sleeve: [41.28, 45.09, 48.26, 52.07, 55.25, 59.05, 62.56],
    tolerance: [3.81, 3.81, 3.81, 3.81, 3.81, 3.81, 3.81],
  },
};
