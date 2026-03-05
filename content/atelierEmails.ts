/**
 * Atelier Email Sequence — Evolution of the Artifact
 * Used when order status progresses. Integrate with Resend, SendGrid, or similar.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://keepsy.store";

export type AtelierEmailType = "creation" | "craft";

export type AtelierEmailParams = {
  customerName?: string;
  designPrompt?: string;
  orderRef?: string;
};

const EMAIL_1_CREATION = {
  type: "creation" as const,
  subject: "Your vision is taking form.",
  /** Asset: sketching animation GIF — the "Sketching" effect */
  heroAssetUrl: `${SITE_URL}/email-assets/sketching-animation.gif`,
  /** Fallback if GIF not supported */
  heroAssetAlt: "Your design is being created",
  body: (params: AtelierEmailParams) =>
    params.designPrompt
      ? `We have received your prompt. Our machines are currently calibrating the pigment density for your '${params.designPrompt}' design.`
      : "We have received your prompt. Our machines are currently calibrating the pigment density for your design.",
};

const EMAIL_2_CRAFT = {
  type: "craft" as const,
  subject: "Quality check complete.",
  /** Asset: close-up high-res hoodie weave texture (from the Loupe) */
  heroAssetUrl: `${SITE_URL}/mockups/hoodie-weave-closeup.jpg`,
  heroAssetAlt: "Hoodie fabric weave — quality verified",
  body: (params: AtelierEmailParams) =>
    "The ink has met the fabric. Our artisans have inspected the grain and confirmed the integrity of the design. It is now being prepared for transit.",
};

export const ATELIER_EMAILS = {
  creation: EMAIL_1_CREATION,
  craft: EMAIL_2_CRAFT,
} as const;

/** Plain text versions for non-HTML clients */
export function getAtelierEmailPlain(
  type: AtelierEmailType,
  params: AtelierEmailParams = {}
): { subject: string; body: string } {
  const email = ATELIER_EMAILS[type];
  return {
    subject: email.subject,
    body: [
      params.customerName ? `Hello ${params.customerName},` : "",
      "",
      email.body(params),
      "",
      "— The Keepsy Atelier",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
