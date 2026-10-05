/**
 * Welcome email: the promised welcome code (if one was issued), its expiry,
 * the plain conditions, and three honest ways to get started.
 * When no code could be issued (secret missing / not eligible) the queue
 * skips this template rather than sending an email without the promise.
 */
import * as React from "react";
import { welcomeConditionsText } from "@/lib/commerce/discountPolicy";
import type { Currency } from "@/lib/commerce/pricing";
import { EmailFrame, formatLongDate, styles, textFooter } from "./shared";

export type WelcomePayload = {
  code?: string | null;
  expiresAt?: string | null;
  siteUrl: string;
  currency?: Currency;
  firstName?: string | null;
};

export type RenderedContext = { unsubscribeUrl: string };

const REASON =
  "You're receiving this because you signed up for Keepsy emails and asked for your welcome code.";

const TILES = [
  {
    title: "Upload a photo",
    body: "A pet, a place, a face you love — we turn it into a print-ready design you approve first.",
    path: "/create?mode=upload",
  },
  {
    title: "Describe an idea",
    body: "Type a few words and see previews before you commit to anything.",
    path: "/create",
  },
  {
    title: "Pick a product and size",
    body: "Tees, hoodies, mugs, cards and more. Sizes and delivery times are shown on every product page.",
    path: "/shop",
  },
];

export function welcomeSubject(payload: WelcomePayload): string {
  return payload.code ? "Your Keepsy welcome code" : "Welcome to Keepsy";
}

export function WelcomeEmail({
  payload,
  ctx,
}: {
  payload: WelcomePayload;
  ctx: RenderedContext;
}) {
  const expires = formatLongDate(payload.expiresAt);
  const conditions = welcomeConditionsText(payload.currency ?? "gbp");
  const greeting = payload.firstName ? `Hi ${payload.firstName},` : "Hello,";
  return (
    <EmailFrame
      eyebrow="Welcome"
      title="Thanks for joining Keepsy."
      preheader={payload.code ? "Your welcome code is inside." : null}
      unsubscribeUrl={ctx.unsubscribeUrl}
      reason={REASON}
    >
      <p style={styles.body}>
        {greeting} we&rsquo;re glad you&rsquo;re here. Keepsy makes
        one-of-a-kind printed gifts from your photos and ideas, made to order
        with care.
      </p>

      {payload.code ? (
        <div
          style={{
            backgroundColor: "#F5EDE0",
            borderRadius: 12,
            padding: "24px 28px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(45,41,38,0.5)",
              margin: "0 0 12px",
            }}
          >
            Your welcome code
          </p>
          <p
            style={{
              fontFamily: "'Georgia', Georgia, serif",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#C4714A",
              margin: "0 0 10px",
            }}
          >
            {payload.code}
          </p>
          <p style={{ fontSize: 12, color: "rgba(45,41,38,0.55)", margin: 0 }}>
            {conditions}
          </p>
          {expires ? (
            <p
              style={{
                fontSize: 12,
                color: "rgba(45,41,38,0.55)",
                margin: "6px 0 0",
              }}
            >
              Valid until {expires}.
            </p>
          ) : null}
        </div>
      ) : null}

      <p style={styles.body}>Three ways to start:</p>
      {TILES.map((t) => (
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
          Start creating
        </a>
      </div>

      <p style={styles.body}>
        Enter the code at checkout with the same email address you signed up
        with. If anything is unclear, just reply — a person reads every message.
      </p>
    </EmailFrame>
  );
}

export function welcomeText(
  payload: WelcomePayload,
  ctx: RenderedContext,
): string {
  const expires = formatLongDate(payload.expiresAt);
  const lines = [
    payload.firstName ? `Hi ${payload.firstName},` : "Hello,",
    "",
    "Thanks for joining Keepsy. We make one-of-a-kind printed gifts from your photos and ideas, made to order with care.",
    "",
  ];
  if (payload.code) {
    lines.push(
      `Your welcome code: ${payload.code}`,
      welcomeConditionsText(payload.currency ?? "gbp"),
    );
    if (expires) lines.push(`Valid until ${expires}.`);
    lines.push("");
  }
  lines.push("Three ways to start:");
  for (const t of TILES)
    lines.push(`- ${t.title}: ${t.body} ${payload.siteUrl}${t.path}`);
  lines.push(
    "",
    `Start creating: ${payload.siteUrl}/create`,
    "",
    "Enter the code at checkout with the same email address you signed up with. Reply to this email if anything is unclear.",
  );
  lines.push(textFooter(REASON, ctx.unsubscribeUrl));
  return lines.join("\n");
}
