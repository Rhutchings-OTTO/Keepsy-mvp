# Keepsy premium storefront and owner tools
Release candidate, 5 October 2026. Repository: Rhutchings-OTTO/Keepsy-mvp. Site: https://www.keepsy.store/.

## Release status
This branch is a release candidate. The earlier shopping/account repair is on main (721a767). The premium UI, CRM, marketing and owner-operations changes are uploaded in PR https://github.com/Rhutchings-OTTO/Keepsy-mvp/pull/3 and verified in the Vercel preview https://keepsy-4e7bacccz-rhutchings-ottos-projects.vercel.app/. Production remains on the main commit until the Supabase migration and server-only environment rollout checks below are completed.

## What changed
- Roomier storefront, simpler navigation, a static background, restrained motion and photo/idea walkthroughs. Existing Fraunces/Manrope fonts and cream, terracotta and forest colours are preserved. Fonts are self-hosted with their OFL licences.
- Ten GPT-generated blank mockup assets, optimised as WebP, replace the apparel, mug and card photos. The calibrated placement numbers are unchanged. Cards use the existing regional card renderer; the watermark remains. Canvas previews retain their responsive CSS geometry.
- One final bag review for both create-page and shop checkout: delivery country, welcome code, email and optional marketing checkbox. Stripe shipping is locked to that country. Unsupported country/product combinations fail before a payment session is created.
- Signed 10% welcome codes, bound to one canonical email and one offer. Eligibility checks include historic guest orders and account orders. Codes are reserved during checkout and redeemed after payment. A reused code or destination mismatch stops automatic printing and flags the order for review.
- Owner-only contacts, linked addresses/orders, consent history, CSV export, account capture and historical import. Purchases and account creation do not infer marketing permission.
- Branded welcome and day-three getting-started emails, plus an owner campaign composer with save/review/send steps. Durable queues, provider idempotency, signed bounce/complaint callbacks and one-click unsubscribe are implemented.
- Keepsy Studio at /admin: order timeline, actual recorded payment totals, Printify references, review flags and customer addresses. Signed provider callbacks are deduplicated and older callbacks cannot regress a delivered order. Carrier details use Printify’s documented resource.data payload. Split shipments stay open until the provider confirms all parcels are delivered; unrelated shop orders are acknowledged without altering Keepsy.
- Owner email and Web Push alerts, delivery history, device setup and manual queue processing. iPhone installation and permission must be completed on the actual phone. No phone subscription has been activated by this release.
- Explicit landed-cost arithmetic includes production, supplier shipping, customer shipping revenue, VAT/sales tax, other landed costs, processing fees, FX and contingency after discounts.

## What is intentionally not enabled
Only GB and US remain sellable. Premium phone cases and an AS Colour cotton tote are research candidates, not live SKUs. No claimed margin is based on a public “from” price. New variants/countries require account-level production and shipping quotes, tax treatment, current FX, per-variant artwork proofs and a verified fulfilment test. The desired contribution-margin range is 25–40%; the lower bound must also hold for the welcome discount, expensive sizes and shipping combinations.

No Stripe payout schedule, bank/card configuration or Stripe-to-Monzo transfer was changed. The user deferred that work. Printify's separate production charge still needs funding.

## Rollout order
1. Apply and record migrations in order: 202609090001_phase2_core, 202609090002_crm, 202609090003_owner_ops, 202610040001_dispatch, 202610040002_contacts. Test on an isolated Supabase environment first. Verify that anonymous/customer sessions cannot read contacts, consent, discount, queue or owner tables; service role alone can invoke dispatch/count RPCs.
2. Configure server-only OWNER_EMAILS using the founders' confirmed Supabase Auth email addresses. Empty means no owner access. Set WELCOME_CODE_SECRET, CRM_IP_SALT, CRON_SECRET, RESEND_WEBHOOK_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT. See .env.example. Keep EMAIL_QUEUE_ENABLED=false initially. Keep preview separate from live recipients and Printify production.
3. Verify the Resend sender and register the signed /api/email/webhook endpoint for email.delivered, email.bounced and email.complained. Retain existing Printify hooks and unrelated integrations; confirm their signature secret matches /api/webhooks/printify.
4. Configure and verify the scheduled dispatcher at /api/owner/notifications/drain using CRON_SECRET. vercel.json supplies a daily 09:00 UTC fallback suitable for limited schedules. Immediate signup/payment callbacks also trigger dispatch. Each run processes up to ten marketing emails and ten owner notices. A daily schedule can leave backlog and deliver a day-three email up to a day later: use a verified frequent worker (e.g. every five minutes on a supported plan) before enabling a substantial campaign. No plan upgrade has been purchased.
5. Retry keys are fixed per message. Automatic retry stops after six attempts or 23 hours from first attempt, before Resend's 24-hour idempotency window expires. Review provider acknowledgement before any manual requeue beyond that window; never blindly reset failed rows. Do not rotate sender/payload during an active retry.
6. Run preview checks on desktop and a real narrow mobile viewport: homepage, shop, photo-only create, AI history, product previews in all colours, canvas ratios, multiple apparel sizes, add-ons, bag, both delivery countries, invalid/expired/reused/wrong-email codes and all account flows. Check keyboard focus and reduced motion.
7. With test payment credentials, verify paid-order persistence, discount consumption, one owner alert, CRM linkage, consent, exactly-once Printify submission behaviour and webhook retries. Verify account-email capture against actual Supabase Auth. Do not send a paid production order merely to exercise a test.
8. Test welcome, delayed tips, unsubscribe, bounce and complaint using controlled test recipients only. Enable EMAIL_QUEUE_ENABLED only once delivery and suppression are verified.
9. Deploy the verified release, import historical customers through /admin/crm (unknown consent stays unknown), and verify live read-only pages. Set up phone push through /admin/settings on each founder's device. Purchase/funding changes remain a separate task.

## Sources and catalogue candidates
- [Printify API reference](https://developers.printify.com/) — provider, variant, shipping and mockup data must be verified against the account.
- [Tough Phone Cases, blueprint 269](https://printify.com/app/products/269/generic-brand/tough-phone-cases), [Impact-Resistant Cases, blueprint 841](https://printify.com/app/products/841/generic-brand/impact-resistant-cases) — each phone model needs its own safe-area/camera-cutout proof.
- [AS Colour Cotton Tote, blueprint 553](https://printify.com/app/products/553/as-colour/cotton-tote-bag/) — candidate for a restrained central print.
- [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests) and [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [WebKit iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) — Home Screen installation and device permission are required.
- [ICO electronic mail marketing guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/) — historic purchases alone do not establish the required marketing permission or soft-opt-in evidence.
- [Printify payment process](https://help.printify.com/hc/en-us/articles/4483601124113-How-does-the-payment-process-work) — customer payment and Printify production billing are separate.

## Verification limits
Local automated tests, type checking, lint, the production build, secret scan and mockup geometry audit are run for this candidate; exact results are recorded in the accompanying handover. Unit tests use provider/database fakes and do not validate deployed SQL, real email delivery, browser layout, a physical print or phone delivery.

The October 5 release session uploaded the branch through the GitHub connector and verified a READY Vercel preview. Production migrations, server-only environment changes, live email/phone testing and new supplier-route validation remain pending; the live Supabase project currently has only the earlier migration set applied.
