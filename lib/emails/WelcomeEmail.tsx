/**
 * Legacy export kept for compatibility. The welcome email now lives in
 * lib/email/templates/welcome.tsx and is sent only through the email queue
 * (lib/email/queue.ts), never inline. This wrapper renders the same
 * template with a placeholder unsubscribe context for previews only.
 */
import * as React from "react";
import { WelcomeEmail as WelcomeTemplate } from "@/lib/email/templates/welcome";
import { getSiteUrl } from "@/lib/crm/site";

export type WelcomeEmailProps = {
  discountCode: string;
  siteUrl?: string;
  expiresAt?: string | null;
  unsubscribeUrl?: string;
};

export function WelcomeEmail({
  discountCode,
  siteUrl,
  expiresAt,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const site = siteUrl ?? getSiteUrl();
  return (
    <WelcomeTemplate
      payload={{
        code: discountCode,
        expiresAt: expiresAt ?? null,
        siteUrl: site,
      }}
      ctx={{ unsubscribeUrl: unsubscribeUrl ?? `${site}/unsubscribe` }}
    />
  );
}
