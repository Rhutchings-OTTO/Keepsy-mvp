/**
 * Generic campaign: headline / body paragraphs / optional CTA, all from the
 * campaign's stored content. Body is plain text (paragraphs split on blank
 * lines) — no HTML injection surface from the admin form.
 */
import * as React from "react";
import { EmailFrame, styles, textFooter } from "./shared";
import type { RenderedContext } from "./welcome";

export type CampaignGenericPayload = {
  subject: string;
  preheader?: string | null;
  headline: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  eyebrow?: string | null;
  siteUrl: string;
};

const REASON = "You're receiving this because you opted in to Keepsy emails.";

export function paragraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function safeUrl(
  url: string | null | undefined,
  siteUrl: string,
): string | null {
  if (!url) return null;
  const u = url.trim();
  if (u.startsWith("/")) return `${siteUrl}${u}`;
  if (/^https:\/\//i.test(u)) return u;
  return null;
}

export function CampaignGenericEmail({
  payload,
  ctx,
}: {
  payload: CampaignGenericPayload;
  ctx: RenderedContext;
}) {
  const cta = safeUrl(payload.ctaUrl, payload.siteUrl);
  return (
    <EmailFrame
      eyebrow={payload.eyebrow || "From Keepsy"}
      title={payload.headline}
      preheader={payload.preheader}
      unsubscribeUrl={ctx.unsubscribeUrl}
      reason={REASON}
    >
      {paragraphs(payload.body).map((p, i) => (
        <p key={i} style={styles.body}>
          {p}
        </p>
      ))}
      {cta && payload.ctaLabel ? (
        <a href={cta} style={styles.button}>
          {payload.ctaLabel}
        </a>
      ) : null}
    </EmailFrame>
  );
}

export function campaignGenericText(
  payload: CampaignGenericPayload,
  ctx: RenderedContext,
): string {
  const cta = safeUrl(payload.ctaUrl, payload.siteUrl);
  const lines = [
    payload.headline,
    "",
    ...paragraphs(payload.body).flatMap((p) => [p, ""]),
  ];
  if (cta && payload.ctaLabel) lines.push(`${payload.ctaLabel}: ${cta}`);
  lines.push(textFooter(REASON, ctx.unsubscribeUrl));
  return lines.join("\n");
}
