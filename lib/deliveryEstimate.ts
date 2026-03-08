/**
 * Delivery date estimator.
 *
 * Production time: 3 business days (same for all regions).
 * Shipping windows (business days):
 *   UK  → 1–4
 *   US  → 3–7
 *   EU  → 3–5
 */

export type DeliveryRegion = "uk" | "us" | "eu";

const PRODUCTION_DAYS = 3;

const SHIPPING_DAYS: Record<DeliveryRegion, { min: number; max: number }> = {
  uk: { min: 1, max: 4 },
  us: { min: 3, max: 7 },
  eu: { min: 3, max: 5 },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Add `n` business days (Mon–Fri) to `date`, returning a new Date. */
function addBusinessDays(date: Date, n: number): Date {
  const result = new Date(date);
  let remaining = n;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }
  return result;
}

/** Format a date as "Tue 18 Mar" */
function formatDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

export function getEstimatedDelivery(
  region: DeliveryRegion,
  today: Date = new Date()
): { from: string; to: string } {
  const shipping = SHIPPING_DAYS[region];

  const fromDate = addBusinessDays(today, PRODUCTION_DAYS + shipping.min);
  const toDate = addBusinessDays(today, PRODUCTION_DAYS + shipping.max);

  return {
    from: formatDate(fromDate),
    to: formatDate(toDate),
  };
}
