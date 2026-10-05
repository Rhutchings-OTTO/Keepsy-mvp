/**
 * Template registry. Each template renders to { subject, html, text } from
 * the queue row's payload plus the per-recipient context (unsubscribe URL).
 *
 * `consent` says what the queue must verify at send time:
 *   "signup"    — allowed unless the contact is opted_out/suppressed
 *                 (welcome: the signup itself was the explicit opt-in)
 *   "opted_in"  — marketing_status must be exactly opted_in
 */
import * as React from "react";
import { render } from "@react-email/render";
import {
  WelcomeEmail,
  welcomeSubject,
  welcomeText,
  type WelcomePayload,
  type RenderedContext,
} from "./welcome";
import {
  OnboardingTipsEmail,
  onboardingTipsSubject,
  onboardingTipsText,
  type OnboardingTipsPayload,
} from "./onboardingTips";
import {
  CampaignGenericEmail,
  campaignGenericText,
  type CampaignGenericPayload,
} from "./campaignGeneric";

export type TemplateKey = "welcome" | "onboarding-tips" | "campaign-generic";

export type RenderedEmail = { subject: string; html: string; text: string };

export type TemplateSpec = {
  key: TemplateKey;
  label: string;
  consent: "signup" | "opted_in";
  render: (
    payload: Record<string, unknown>,
    ctx: RenderedContext,
  ) => Promise<RenderedEmail>;
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export const TEMPLATES: Record<TemplateKey, TemplateSpec> = {
  welcome: {
    key: "welcome",
    label: "Welcome (code + onboarding tiles)",
    consent: "signup",
    async render(raw, ctx) {
      const payload: WelcomePayload = {
        code: str(raw.code) || null,
        expiresAt: str(raw.expiresAt) || null,
        siteUrl: str(raw.siteUrl, "https://keepsy.store"),
        currency: raw.currency === "usd" ? "usd" : "gbp",
        firstName: str(raw.firstName) || null,
      };
      const html = await render(
        React.createElement(WelcomeEmail, { payload, ctx }),
      );
      return {
        subject: welcomeSubject(payload),
        html,
        text: welcomeText(payload, ctx),
      };
    },
  },
  "onboarding-tips": {
    key: "onboarding-tips",
    label: "Onboarding tips (day 3)",
    consent: "opted_in",
    async render(raw, ctx) {
      const payload: OnboardingTipsPayload = {
        siteUrl: str(raw.siteUrl, "https://keepsy.store"),
        firstName: str(raw.firstName) || null,
      };
      const html = await render(
        React.createElement(OnboardingTipsEmail, { payload, ctx }),
      );
      return {
        subject: onboardingTipsSubject,
        html,
        text: onboardingTipsText(payload, ctx),
      };
    },
  },
  "campaign-generic": {
    key: "campaign-generic",
    label: "Campaign (headline / body / CTA)",
    consent: "opted_in",
    async render(raw, ctx) {
      const payload: CampaignGenericPayload = {
        subject: str(raw.subject, "A note from Keepsy"),
        preheader: str(raw.preheader) || null,
        headline: str(raw.headline, str(raw.subject, "A note from Keepsy")),
        body: str(raw.body),
        ctaLabel: str(raw.ctaLabel) || null,
        ctaUrl: str(raw.ctaUrl) || null,
        eyebrow: str(raw.eyebrow) || null,
        siteUrl: str(raw.siteUrl, "https://keepsy.store"),
      };
      const html = await render(
        React.createElement(CampaignGenericEmail, { payload, ctx }),
      );
      return {
        subject: payload.subject,
        html,
        text: campaignGenericText(payload, ctx),
      };
    },
  },
};

export function isTemplateKey(v: unknown): v is TemplateKey {
  return (
    typeof v === "string" && Object.prototype.hasOwnProperty.call(TEMPLATES, v)
  );
}

export async function renderTemplate(
  key: string,
  payload: Record<string, unknown>,
  ctx: RenderedContext,
): Promise<RenderedEmail> {
  if (!isTemplateKey(key)) throw new Error(`Unknown email template: ${key}`);
  return TEMPLATES[key].render(payload, ctx);
}
