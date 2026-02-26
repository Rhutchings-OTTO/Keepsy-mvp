export type AnalyticsEventName =
  | "StartCreate"
  | "UploadPhoto"
  | "SelectStyle"
  | "SelectProduct"
  | "CheckoutStart"
  | "PurchaseComplete";

export function trackEvent(name: AnalyticsEventName, payload?: Record<string, unknown>): void {
  // Placeholder analytics hook. Replace with PostHog/GA/Segment later.
  if (process.env.NODE_ENV !== "production") {
    console.log("[analytics]", name, payload ?? {});
  }
}
