# Atelier Email Assets

The Atelier email sequence requires these assets in `public/`:

## Email 1 — The Creation
- **Path:** `public/email-assets/sketching-animation.gif`
- **Description:** High-end "Sketching" effect animation (lines appearing, design taking form)
- **Usage:** Hero image in "Your vision is taking form" email

## Email 2 — The Craft
- **Path:** `public/mockups/hoodie-weave-closeup.jpg`
- **Description:** Close-up, high-res photo of hoodie fabric weave (same texture shown in the TextureLoupe)
- **Usage:** Hero image in "Quality check complete" email

## Integration

1. Add assets to the paths above
2. Wire `content/atelierEmails.ts` and `lib/emails/atelierTemplates.tsx` to your email provider (Resend, SendGrid, etc.)
3. Trigger emails from the Stripe webhook when order status changes, or on a scheduled job after order confirmation
