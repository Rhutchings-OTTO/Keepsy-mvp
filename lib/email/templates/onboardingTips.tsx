/**
 * Day-3 onboarding: how previews work, sizes, delivery times. No discount,
 * no urgency, no invented claims. Requires marketing_status = opted_in at
 * send time (re-checked by the queue).
 */
import * as React from "react";
import { EmailFrame, styles, textFooter } from "./shared";
import type { RenderedContext } from "./welcome";

export type OnboardingTipsPayload = {
  siteUrl: string;
  firstName?: string | null;
};

const REASON = "You're receiving this because you signed up for Keepsy emails.";

const TIPS = [
  {
    title: "Previews come first",
    body: "Upload a photo or describe an idea and you'll see a preview on the product before you pay. Nothing is printed until you approve it.",
    path: "/create",
  },
  {
    title: "Sizes and fit",
    body: "Every product page lists the sizes available and what they measure. Prints are made to order, so please check the size guide before you buy.",
    path: "/shop",
  },
  {
    title: "Delivery times",
    body: "Each piece is printed after you order. Estimated production and delivery times are shown at checkout and on the shipping page for your country.",
    path: "/shipping",
  },
];

export const onboardingTipsSubject =
  "How Keepsy works: previews, sizes and delivery";

export function OnboardingTipsEmail({
  payload,
  ctx,
}: {
  payload: OnboardingTipsPayload;
  ctx: RenderedContext;
}) {
  return (
    <EmailFrame
      eyebrow="Getting started"
      title="A few things worth knowing."
      unsubscribeUrl={ctx.unsubscribeUrl}
      reason={REASON}
    >
      <p style={styles.body}>
        {payload.firstName ? `Hi ${payload.firstName},` : "Hello,"} here&rsquo;s
        how Keepsy works, in three short notes.
      </p>
      {TIPS.map((t) => (
        <div key={t.title} style={styles.tile}>
          <p style={styles.tileTitle}>
            <a
              href={`${payload.siteUrl}${t.path}`}
              style={{ color: "#2C4A3E", textDecoration: "none" }}
            >
              {t.title}
            </a>
          </p>
          <p style={styles.tileBody}>{t.body}</p>
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <a href={`${payload.siteUrl}/create`} style={styles.button}>
          Try a preview
        </a>
      </div>
      <p style={styles.body}>
        Questions about a gift idea? Reply to this email and we&rsquo;ll help
        you work it out.
      </p>
    </EmailFrame>
  );
}

export function onboardingTipsText(
  payload: OnboardingTipsPayload,
  ctx: RenderedContext,
): string {
  const lines = [
    payload.firstName ? `Hi ${payload.firstName},` : "Hello,",
    "",
    "Here's how Keepsy works, in three short notes.",
    "",
  ];
  for (const t of TIPS)
    lines.push(`${t.title}: ${t.body} ${payload.siteUrl}${t.path}`, "");
  lines.push(
    `Try a preview: ${payload.siteUrl}/create`,
    "",
    "Questions about a gift idea? Reply to this email and we'll help you work it out.",
  );
  lines.push(textFooter(REASON, ctx.unsubscribeUrl));
  return lines.join("\n");
}
