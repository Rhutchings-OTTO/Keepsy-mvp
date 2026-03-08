# Legal & Compliance Audit — Keepsy
**Audit Date:** 2026-03-08
**Auditor:** Legal Compliance Specialist (UK E-Commerce & GDPR)
**Branch:** main
**Scope:** Full codebase review — all pages, components, API routes, and data flows

---

## Executive Summary

Keepsy has the **skeleton** of a legally compliant e-commerce site — legal pages exist and are linked from the footer — but the **content** of those pages is critically inadequate for a live UK B2C business. Several pages read more like brand copy than enforceable legal documents.

**Overall compliance status: PARTIALLY COMPLIANT — NOT READY FOR COMMERCIAL LAUNCH**

Key gaps:
- No cookie consent banner (PECR violation — first-party cookies set without consent)
- Privacy Policy missing 80% of required GDPR disclosures
- Terms of Service is brand copy masquerading as a legal document — missing all mandatory consumer rights provisions
- Refund Policy does not correctly state the 14-day statutory right to cancel
- No Cookie Policy page
- No business registration details (Companies Act 2006 / Distance Selling Regulations)
- No VAT transparency on displayed prices
- Email marketing signup with no explicit consent language or privacy notice link
- Prices shown in USD on the landing page despite being a UK-targeting business

---

## Section 1: Required Legal Pages

### 1.1 Privacy Policy
**Path:** `/privacy`
**Status:** EXISTS — CRITICALLY INADEQUATE
**Risk Level:** CRITICAL

**What exists:** A brief four-section page covering: what is collected, how it is used, your rights (deletion only), and a contact email.

**What is missing (UK GDPR Articles 13–14 requirements):**

| Required Element | Present? |
|---|---|
| Identity and contact details of data controller | No — no company name, address, or registration number |
| Lawful basis for each processing activity | No — basis not stated for any processing |
| Legitimate interests basis (if used) | No |
| All data processors listed | Partial — OpenAI and Stripe mentioned; Supabase, Printify, Resend/email provider, Inngest, Cloudinary absent |
| Data retention periods for each category | No |
| International transfer safeguards (OpenAI = US processor) | No |
| Right to access (Art. 15) | No |
| Right to rectification (Art. 16) | No |
| Right to restrict processing (Art. 18) | No |
| Right to portability (Art. 20) | No |
| Right to object (Art. 21) | No |
| Right to withdraw consent | No |
| Right to lodge complaint with ICO (Art. 13(2)(d)) | No |
| Whether provision of data is statutory/contractual requirement | No |
| Automated decision-making / profiling disclosures | No |
| Last updated date | No |

**Note:** Footer says "Fulfilled by Printful" but code references Printify throughout (`app/api/webhooks/printify/`). Either the footer is inaccurate or both are used. Both must be disclosed in the Privacy Policy as data processors.

**Recommended action:** Full rewrite required. See replacement page created at `app/privacy/page.tsx`.

---

### 1.2 Terms of Service / Terms & Conditions
**Path:** `/terms`
**Status:** EXISTS — CRITICALLY INADEQUATE (unenforceable)
**Risk Level:** CRITICAL

**What exists:** Four aesthetic sections: "The Uniqueness Clause," "The Material Guarantee," "The Atelier Process," and a brief IP/usage note. This reads as brand manifesto, not legal terms.

**What is missing:**

| Required Element | Legal Basis | Present? |
|---|---|---|
| 14-day right to cancel (cooling-off period) | Consumer Contracts Regulations 2013, Reg. 29 | No |
| Bespoke goods exception — clearly explained | Consumer Contracts Regulations 2013, Reg. 28(1)(b) | No — unclear language about "bespoke" without legal framing |
| Statutory rights preservation statement | Consumer Rights Act 2015 | No |
| Dispute resolution process | ADR Regulations 2015 | No |
| Identity and contact details of trader | Electronic Commerce Regulations 2002 | No |
| Age requirement for contracting (18+) | Contract law | No |
| Liability limitation clause | Best practice / CRA 2015 | No |
| Governing law and jurisdiction clause | Best practice | No |
| How the contract is formed | Electronic Commerce Regulations 2002 | No |
| Right to cancel order before production | Best practice | No |
| Process for defective / damaged goods claims | Consumer Rights Act 2015 | No |
| Price and payment terms | Consumer Rights Act 2015 | No |
| Delivery terms (incorporated from shipping page) | Consumer Rights Act 2015 | No |
| Variation of terms notice | Best practice | No |

**Critical concern:** The existing language "Refunds are offered for damaged or defective items" actively misrepresents UK consumer rights. Under the Consumer Contracts Regulations 2013, consumers have a 14-day right to cancel most distance sales and receive a full refund regardless of damage/defect status. The narrow exception for personalised goods (Reg. 28(1)(b)) applies only where goods are "made to the consumer's specifications or clearly personalised" — and even then must be explicitly communicated before the contract is concluded. The current terms do neither.

**Recommended action:** Full rewrite required. See replacement page created at `app/terms/page.tsx`.

---

### 1.3 Refund & Returns Policy
**Path:** `/refunds`
**Status:** EXISTS — NON-COMPLIANT
**Risk Level:** CRITICAL

**What exists:** A page stating refunds are offered for damaged/mispriinted/wrong items within 14 days of delivery. States custom items cannot be returned for "change of mind."

**Issues:**
1. **Does not state the 14-day statutory right to cancel** under the Consumer Contracts Regulations 2013. The policy presents refunds as a discretionary business decision ("our promise") rather than a legal right.
2. **The personalised goods exception must be disclosed pre-contract** (Regulation 28(3)) — it cannot simply appear in a refund policy. Consumers must be informed before placing the order.
3. **Confusing "14 days" framing:** The existing policy mentions "14 days" but in the context of reporting a defect, not exercising the cancellation right. This could be seen as misrepresenting the right as narrower than it is.
4. **No refund processing timeline:** Under Regulation 34, refunds must be issued within 14 days of cancellation — this deadline is not stated.
5. **No return shipping instructions:** How to return an item is not explained.
6. **Trust badge inconsistency:** The landing page and about page promote "30-Day Returns" but the refund policy only mentions 14 days. This is potentially misleading under the Consumer Protection from Unfair Trading Regulations 2008.

**Recommended action:** Rewrite with explicit statutory rights language. See replacement page at `app/refunds/page.tsx`.

---

### 1.4 Shipping Policy
**Path:** `/shipping`
**Status:** EXISTS — ADEQUATE with minor gaps
**Risk Level:** LOW-MEDIUM

**What is good:** Delivery timeframes for UK and US are stated. Seasonal cutoffs are mentioned. Free shipping threshold is stated.

**Minor gaps:**
- No tracking information or how customers will receive tracking updates
- Shipping costs are not shown until checkout ("calculated at checkout") — while this is common, best practice is to show an indicative range
- No mention of lost/undelivered order process
- No mention that production time (2-4 days) is separate from shipping time (2-3 days UK / 3-6 days US), making the total delivery window 4-9 business days UK and 5-10 days US — this should be communicated clearly

**Risk:** Low, but the footer states "Fulfilled by Printful" while code uses Printify — if this is inaccurate and causes delivery issues, it undermines trust and creates dispute risk.

---

### 1.5 Cookie Policy
**Path:** N/A
**Status:** MISSING
**Risk Level:** CRITICAL

No Cookie Policy page exists anywhere in the codebase. The site sets a `keepsy_region` cookie via `lib/region.ts` without any prior notice or consent. This cookie is set on page load and persisted for one year.

**Legal basis:** Privacy and Electronic Communications Regulations (PECR) 2003 require:
- Clear and comprehensive information about cookies before they are set
- Consent for non-essential cookies

**Is the region cookie strictly necessary?** Potentially yes for functionality — but it is set before the user has been informed about it, and stored for one year (exceeding functional necessity). Additionally, it mirrors the value to `localStorage`, which may constitute a separate tracking mechanism.

**Action:** Create a Cookie Policy page and a cookie consent banner. See new page at `app/cookies/page.tsx`.

---

## Section 2: GDPR Compliance

### 2.1 Cookie Consent Banner
**Status:** MISSING
**Risk Level:** CRITICAL

No cookie consent mechanism exists. The site sets cookies (region preference) on first load without any notice or consent mechanism. While a functional region cookie may qualify as strictly necessary, the user is never informed it is being set.

**ICO guidance:** Even strictly necessary cookies require an information notice (though not consent). Non-essential cookies require explicit prior consent.

**Recommended action:** Implement a cookie banner that:
- Informs users on first visit that cookies are used
- Links to the Cookie Policy
- For any analytics/tracking cookies added in future, provides granular opt-in/opt-out by category (Strictly Necessary / Analytics / Marketing)

**Note:** A cookie consent banner component has been created at `components/CookieBanner.tsx` and added to `SiteChrome`.

---

### 2.2 Granular Consent
**Status:** NOT APPLICABLE (no tracking cookies currently)
**Risk Level:** LOW (for now)

Currently the site only sets a functional region preference cookie. No analytics (GA4, Mixpanel, Hotjar, PostHog) or marketing tracking has been identified in the codebase. If analytics is added in future, granular consent will be required.

**Note:** The region cookie stored in `localStorage` (as a fallback in `lib/region.ts`) technically does not require PECR consent (localStorage is not covered by PECR), but under UK GDPR it may still require a lawful basis if it enables individual tracking.

---

### 2.3 Data Deletion
**Status:** PARTIALLY COMPLIANT
**Risk Level:** MEDIUM

A `Delete My Data` button exists in the create/generator page (`MerchGeneratorPlatform.tsx`, line 1539) and calls `/api/delete-my-data`. The Privacy Policy references this.

**Issues:**
- The button is buried in the product generator — not accessible from the main navigation or account area
- There is no data deletion option for customers who have completed orders (they may not return to the create page)
- The right to erasure under Article 17 has legitimate grounds exceptions (e.g., order records may need to be retained for tax purposes) — the policy does not explain these exceptions
- The 30-day response commitment in the Privacy Policy exceeds the legal requirement of "without undue delay, and in any event within one month" (Article 12(3)) — technically compliant but worth reviewing

**Recommended action:** Add a data deletion request link to the footer and account page. Clarify retention obligations in the Privacy Policy.

---

### 2.4 Other GDPR Data Subject Rights
**Status:** LARGELY UNIMPLEMENTED
**Risk Level:** HIGH

| Right | Article | Status |
|---|---|---|
| Right to erasure | Art. 17 | Implemented (partial) |
| Right of access / Subject Access Request | Art. 15 | Not implemented |
| Right to rectification | Art. 16 | Not implemented |
| Right to portability | Art. 20 | Not implemented |
| Right to restrict processing | Art. 18 | Not implemented |
| Right to object | Art. 21 | Not implemented |

**Recommended action:** At minimum before commercial launch, implement a Subject Access Request process (even if manual by email). Add all rights to the Privacy Policy with instructions for how to exercise them.

---

### 2.5 Data Processing Agreements with Third Parties
**Status:** NOT VERIFIABLE FROM CODE — likely missing
**Risk Level:** CRITICAL

The site processes personal data (customer photos, order data, email addresses, shipping addresses) through multiple third-party processors. UK GDPR Article 28 requires a written Data Processing Agreement (DPA) with each processor.

**Processors identified:**
| Processor | Data Processed | DPA Available? | Status |
|---|---|---|---|
| Stripe | Payment data, email, billing address | Yes — Stripe Data Processing Agreement (auto-accepted on account creation) | Likely OK if Stripe account terms accepted |
| OpenAI | Customer-uploaded photos, prompts | Yes — OpenAI DPA (must be explicitly executed for business use) | Unknown — must verify |
| Supabase | All order data, user sessions, personal data | Yes — Supabase DPA available | Unknown — must verify |
| Printify | Shipping address, order details, product images | Yes — Printify DPA | Unknown — must verify |
| Resend | Email address, order details for transactional email | Yes — Resend DPA | Unknown — must verify |
| Inngest | Webhook payloads containing personal data | DPA available on request | Unknown |

**Note:** The footer says "Fulfilled by Printful" but the codebase references Printify throughout. The Privacy Policy must name the actual processor. This discrepancy should be resolved.

**Recommended action:** Execute or confirm DPAs with all processors. Add all processors to the Privacy Policy with their role, data accessed, and country of processing.

---

### 2.6 Email Marketing Consent
**Status:** NON-COMPLIANT
**Risk Level:** HIGH

The footer contains an email signup form offering "10% off your first order + early access to new designs." The form:
- Has no privacy notice or link to Privacy Policy
- Has no indication of what the subscriber is signing up for (newsletter? transactional only?)
- Has no opt-in checkbox — submission is the only mechanism
- Appears to not actually submit the email anywhere (the `handleSignup` function only sets `submitted: true` — no API call is visible in the footer component)

If emails are collected and stored (even if the current implementation is a front-end stub), this requires:
1. A clear statement of what the email will be used for
2. A link to the Privacy Policy
3. The lawful basis for processing (legitimate interests or explicit consent — for marketing, consent is required under PECR)

**Recommended action:**
1. If email marketing is implemented, add a checkbox or explicit consent statement and link to Privacy Policy
2. If the form is not yet connected to a backend, remove it or clearly mark it as "coming soon"
3. Example consent text: *"By subscribing, you agree to receive marketing emails from Keepsy. You can unsubscribe at any time. View our [Privacy Policy]."*

---

### 2.7 International Data Transfers
**Status:** NOT DISCLOSED
**Risk Level:** HIGH

OpenAI is a US-based processor. Customer-uploaded photos sent to OpenAI's API are transferred outside the UK/EEA. Under UK GDPR (post-Brexit), transfers to the US require either:
- An adequacy decision (the UK-US Data Bridge adequacy decision applies if the recipient is certified)
- Standard Contractual Clauses (SCCs/IDTA — UK addendum)
- Other appropriate safeguards

OpenAI is certified under the UK-US Data Bridge. However, this must be disclosed in the Privacy Policy.

**Recommended action:** Add an international transfers section to the Privacy Policy disclosing the OpenAI transfer and the legal mechanism relied upon.

---

## Section 3: UK Consumer Law

### 3.1 Business Name and Address
**Status:** MISSING
**Risk Level:** CRITICAL

Under the Electronic Commerce (EC Directive) Regulations 2002 (Regulation 6) and the Companies Act 2006, a UK e-commerce business must display:
- The legal name of the business (not just a trading name)
- Registered address
- Company registration number (if a limited company)
- VAT number (if VAT-registered)

**Current state:** The footer shows only "Keepsy" with a support email. No registered company name, address, or registration number appears anywhere on the site.

**Recommended action:** Add to the site footer:
```
Keepsy Ltd (or Keepsy — [full legal name])
Company No. [XXXXXXXX] | Registered in England & Wales
Registered address: [address]
VAT No. [XXXXXXXXX] (if VAT-registered) | support@keepsy.store
```
If not yet incorporated, the founder's trading name and address are required.

---

### 3.2 VAT Transparency
**Status:** NON-COMPLIANT (for UK customers)
**Risk Level:** HIGH

UK consumer law (Price Marking Order 2004 and Consumer Rights Act 2015) requires prices to be shown inclusive of VAT for B2C sales.

**Current state:**
- UK prices are shown in GBP on the landing page (£19.99, £14.99, etc.) — good
- But there is no indication whether these prices include or exclude VAT
- The product catalog (`lib/commerce/catalog.ts`) lists prices as `priceGBP: 8, 14, 29, 40` with no VAT annotation
- The landing page primarily shows USD prices first (e.g., "From $24"), with UK prices secondary

**If below the VAT registration threshold (currently £90,000 turnover):**
Add: "Prices shown are exclusive of VAT (business below VAT registration threshold)" or confirm prices are VAT-inclusive.

**If VAT-registered:**
Add: "All prices include VAT at the prevailing rate" and display VAT number.

---

### 3.3 14-Day Cooling-Off Period
**Status:** NOT CORRECTLY STATED
**Risk Level:** CRITICAL

Under the Consumer Contracts Regulations 2013 (implementing the EU Consumer Rights Directive in UK law), consumers have a 14-day right to cancel distance sales and receive a full refund.

**Exception for personalised goods (Regulation 28(1)(b)):** The right to cancel does not apply to "goods that are made to the consumer's specifications or are clearly personalised." However:
1. This exception must be **explicitly drawn to the consumer's attention before the contract is concluded** (Regulation 28(3))
2. The exception's scope is narrow — generic AI style outputs that could be applied to any customer's order may not qualify
3. The Refund Policy's current framing ("change of mind" returns not accepted) does not properly engage with this legal framework

**Required action:** The Terms of Service and Refund Policy must:
- State the 14-day right to cancel plainly
- If relying on the personalised goods exception, state so explicitly before checkout is completed
- Inform customers at pre-contract stage (before they click "Place Order") that the cancellation right does not apply because the goods are personalised to their specifications

A pre-order notice has been added to the checkout flow language in the updated Terms.

---

### 3.4 "30-Day Returns" Trust Badge
**Status:** MISLEADING — INCONSISTENT
**Risk Level:** HIGH

The landing page social proof bar (`LandingPage.tsx` line 72) and the About page promise section display "30-Day Returns" and "Easy 30-Day Returns." The Refund Policy states refunds are available within 14 days of delivery for defects.

These are inconsistent. If the business is not offering 30-day returns, this trust badge should be removed or changed. Displaying it while the policy only offers 14 days for defects is potentially misleading under the Consumer Protection from Unfair Trading Regulations 2008.

**Recommended action:** Either:
(a) Update the Refund Policy to offer 30-day returns for defective items (aligning policy with marketing), or
(b) Remove the "30-Day Returns" trust badge from the landing page and about page

---

## Section 4: Payment and Pricing

### 4.1 Currency Display
**Status:** PARTIALLY COMPLIANT
**Risk Level:** MEDIUM

- UK prices are shown in GBP on landing page and product pages — good
- The landing page hero product images show USD prices first ("From $24", "From $4") — these will be seen by UK users before region is detected
- The region cookie/localStorage mechanic means first-time UK visitors may see USD prices briefly

**Recommended action:** Ensure UK users always see GBP pricing. The currency symbol alone is insufficient — prices should explicitly state "GBP" or "£" consistently.

---

### 4.2 Price Clarity Before Checkout
**Status:** PARTIAL — ACCEPTABLE
**Risk Level:** LOW-MEDIUM

Shipping costs are "calculated at checkout" — this is common practice and generally acceptable provided the final total (including shipping) is clearly shown before payment is confirmed. Stripe Checkout typically handles this.

**Note:** The free shipping threshold (£75 UK / $75 US) is stated on the shipping page but not prominently on product pages or at the start of checkout. Best practice is to surface this earlier.

---

## Section 5: AI Content Disclosure

### 5.1 Disclosure of AI-Generated Designs
**Status:** PARTIALLY COMPLIANT
**Risk Level:** MEDIUM

- The footer bottom bar states "Powered by AI" — this is a disclosure
- Product pages and checkout reference "AI-generated design" — adequate disclosure
- The Terms section in the generator (`MerchGeneratorPlatform.tsx`) states designs are AI-generated

**Gap:** The site does not disclose which AI model/provider generates the designs (OpenAI). For informed consent purposes, customers uploading personal photos should know they are sending those photos to OpenAI's API.

**Recommended action:** Add to the Privacy Policy and/or a pre-upload notice: "Your photos are processed by OpenAI to generate your design. OpenAI's Privacy Policy applies to this processing."

---

### 5.2 Copyright Implications of AI-Generated Designs
**Status:** PARTIALLY ADDRESSED
**Risk Level:** MEDIUM

The in-app Terms (`MerchGeneratorPlatform.tsx` line 1406) state: "AI-generated designs created on Keepsy remain the property of the creator."

**Issues:**
1. The legal status of AI-generated works under UK copyright law is uncertain — the Copyright, Designs and Patents Act 1988 (s.9(3)) provides protection for computer-generated works to the "person by whom the arrangements necessary for the creation of the work are undertaken," but this area is actively being litigated
2. Claiming customers "own" AI-generated designs may be legally untested
3. OpenAI's terms of service grant the user ownership of outputs subject to their policies — but Keepsy's terms should reference this dependency

**Recommended action:** Add nuanced IP language to the Terms acknowledging the uncertainty and clarifying the grant of licence to Keepsy to produce the physical product.

---

### 5.3 Content Policy / Acceptable Use Policy for AI Generator
**Status:** PARTIAL — IN CODE, NOT PROMINENT
**Risk Level:** MEDIUM

The API routes reference copyright/trademark restrictions (lines 58 in `generate-image/route.ts`). The in-app terms state users must not upload illegal/unsafe/copyrighted material.

**Gap:** There is no formal Acceptable Use Policy (AUP) that users see and acknowledge before using the AI generator. The restriction language in the generator's legal view is not easily discoverable.

**Recommended action:** Add an AUP section to the Terms of Service listing prohibited content categories. At minimum, reference it in the pre-order consent statement.

---

## Section 6: Intellectual Property

### 6.1 Ownership of AI-Generated Designs
**Status:** PARTIALLY ADDRESSED (see 5.2 above)
**Risk Level:** MEDIUM

The in-app legal view claims customer ownership of outputs. The `/terms` page is silent on this. These two should be consistent.

---

### 6.2 DMCA / Takedown Process
**Status:** MISSING
**Risk Level:** MEDIUM

No DMCA or IP takedown process exists on the site. While DMCA is a US law, UK-targeting businesses should have an equivalent IP infringement notification process under the UK Intellectual Property Act.

**Recommended action:** Add an IP takedown contact (e.g., legal@keepsy.co or the same privacy email) and a brief process to the Terms of Service or a separate IP Policy page.

---

## Section 7: Miscellaneous Issues

### 7.1 Testimonials — Verification
**Status:** UNVERIFIED
**Risk Level:** MEDIUM

The landing page (`LandingPage.tsx`) contains named customer testimonials (Sarah M., Jennifer K., Diane R., and others). If these are fabricated or unverified, this constitutes a misleading commercial practice under the Consumer Protection from Unfair Trading Regulations 2008.

**ASA CAP Code 3.45:** "Marketers should hold documentary evidence that a testimonial or endorsement used in a marketing communication is genuine."

**Recommended action:** Verify all testimonials, obtain written consent, and retain documentation. Add "verified customer" labels or source from Trustpilot/Google Reviews.

---

### 7.2 Email Communications — Privacy Notice
**Status:** NON-COMPLIANT
**Risk Level:** MEDIUM

Order confirmation and tracking emails are sent via Resend. Under UK GDPR, transactional emails sent in the context of a sale are lawful under the legitimate interests basis. However:
- The privacy policy does not mention Resend as a data processor
- The emails should contain an unsubscribe option for any marketing content, and a link to the Privacy Policy

---

### 7.3 Children and Minors
**Status:** NOT ADDRESSED
**Risk Level:** LOW-MEDIUM

No age requirement is stated anywhere. Under UK contract law, contracts with minors (under 18) are voidable. The Terms should state that the service is for users aged 18 or over, or that minors require parental consent.

---

## Summary Table

| # | Issue | Regulation | Status | Risk | Action |
|---|---|---|---|---|---|
| 1 | Cookie consent banner | PECR 2003 | Missing | CRITICAL | Implement banner |
| 2 | Privacy Policy — inadequate | UK GDPR Arts. 13-14 | Non-compliant | CRITICAL | Rewrite (done) |
| 3 | Terms of Service — unenforceable | Consumer Contracts Regs 2013; CRA 2015 | Non-compliant | CRITICAL | Rewrite (done) |
| 4 | Refund Policy — missing cancellation right | Consumer Contracts Regs 2013 | Non-compliant | CRITICAL | Rewrite (done) |
| 5 | Cookie Policy — missing | PECR 2003 | Missing | CRITICAL | Create (done) |
| 6 | Business name/address/reg number | Companies Act 2006; E-Commerce Regs 2002 | Missing | CRITICAL | Add to footer |
| 7 | 14-day cooling-off period not stated | Consumer Contracts Regs 2013, Reg. 29 | Missing | CRITICAL | Added to Terms |
| 8 | DPAs with processors | UK GDPR Art. 28 | Unverified | CRITICAL | Execute DPAs |
| 9 | VAT transparency | Price Marking Order 2004 | Missing | HIGH | Add VAT note |
| 10 | Email marketing — no consent | PECR 2003; UK GDPR | Non-compliant | HIGH | Add consent text |
| 11 | "30-Day Returns" vs 14-day policy | CPUTR 2008 | Inconsistent | HIGH | Align or remove |
| 12 | International transfer (OpenAI → US) | UK GDPR Art. 46 | Not disclosed | HIGH | Add to Privacy Policy |
| 13 | Other GDPR rights not implemented | UK GDPR Arts. 15-21 | Partial | HIGH | Implement SAR process |
| 14 | AI provider not disclosed in privacy notice | UK GDPR Art. 13 | Missing | MEDIUM | Add to Privacy Policy |
| 15 | DMCA / IP takedown process | UKIPA 1988 | Missing | MEDIUM | Add to Terms |
| 16 | Testimonials — verification | ASA CAP Code 3.45 | Unverified | MEDIUM | Verify or remove |
| 17 | Children — no age requirement | Contract law | Missing | MEDIUM | Add to Terms |
| 18 | Footer says "Printful" — code uses Printify | Accuracy / consumer trust | Inconsistent | MEDIUM | Correct footer |
| 19 | Pricing — USD shown first to all users | Price Marking Order 2004 | Partial | MEDIUM | Region-gate prices |
| 20 | Email signup — no API call | Consumer trust | Placeholder | LOW | Connect or remove |

---

## Actions Taken in This Audit

The following pages have been **rewritten or created** to address critical legal gaps:

1. **`/app/privacy/page.tsx`** — Complete rewrite with all required GDPR disclosures (Art. 13-14), all processors, lawful bases, retention periods, all data subject rights, ICO complaint right, international transfers
2. **`/app/terms/page.tsx`** — Complete rewrite with consumer law provisions: 14-day cancellation right, personalised goods exception (pre-contract notice), liability limitation, governing law, dispute resolution, age requirement, IP ownership
3. **`/app/refunds/page.tsx`** — Rewrite with explicit statutory cancellation rights, refund timeline, return process
4. **`/app/cookies/page.tsx`** — New page: full Cookie Policy documenting all cookies set, their purpose, duration, and opt-out mechanisms
5. **`/components/CookieBanner.tsx`** — New component: cookie notice banner with accept/dismiss and link to Cookie Policy
6. **`/components/SiteFooter.tsx`** — Added Cookie Policy link to footer navigation
7. **`/components/SiteChrome.tsx`** — Added CookieBanner to global layout

---

## Remaining Actions Required (Not Done in This Audit)

These require business decisions, legal advice, or backend implementation:

1. **Register company / confirm legal entity** — Add company registration number and registered address to footer
2. **Execute DPAs** — Contact Stripe, OpenAI, Supabase, Printify, Resend and confirm/execute Data Processing Agreements
3. **VAT determination** — Confirm VAT registration status; update pricing display accordingly
4. **Fix footer "Printful" vs "Printify"** — Correct the inaccuracy
5. **Remove or fix "30-Day Returns" badge** — Align marketing with policy
6. **Connect email signup form** — Or remove from footer until backend is ready
7. **Implement Subject Access Request process** — Minimum: email to privacy@keepsy.co with response within 30 days
8. **Add OpenAI disclosure to pre-upload UI** — Inform users their photos go to OpenAI
9. **Verify or replace testimonials** — Document consent from real customers
10. **Add age requirement notice** — To checkout flow or Terms acceptance
11. **Granular cookie consent** — Required before adding any analytics/tracking

---

*Report prepared 2026-03-08. UK law references current as of that date. This report does not constitute legal advice — a qualified solicitor should review all legal documents before commercial launch.*
