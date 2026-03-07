# Legal & Compliance Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151) | **Compliance Score: 35/76 (46%)**

---

## Executive Summary

**VERDICT: NOT READY FOR COMMERCIAL LAUNCH**

Keepsy has good security foundations but **critical legal gaps** that expose the business to UK Trading Standards enforcement, ICO GDPR investigation, and enforceability failures. The most urgent: no cookie consent banner (PECR violation), inadequate privacy policy (GDPR Articles 13-14), unenforceable terms (Consumer Rights Act 2015), and no business registration details (Distance Selling Regulations).

**Estimated remediation: 150+ hours, £5–10K cost, 6–8 weeks**

---

## Findings

### 1. No Cookie Consent Banner
**Severity: CRITICAL**
**Legal basis: PECR 2003 (UK)**

No cookie consent mechanism exists anywhere on the site. This is a direct violation of the Privacy and Electronic Communications Regulations. The ICO has issued fines up to £500K for serious PECR violations.

**Fix:** Deploy a consent management platform (OneTrust, Cookiebot, or Termly) before any analytics or tracking is added. Create a `/cookie-policy` page documenting all cookies.

---

### 2. Privacy Policy — Inadequate
**Severity: CRITICAL**
**Legal basis: UK GDPR Articles 13-14**

The existing privacy policy is missing required disclosures:

| Missing Element | Requirement |
|---|---|
| All data processors listed (Stripe, OpenAI, Supabase, Cloudinary, Inngest) | Art. 13(2)(e) |
| Lawful basis for each processing activity | Art. 13(1)(c) |
| Data retention periods/schedule | Art. 5(1)(e) |
| International transfer safeguards (OpenAI = US) | Art. 46 |
| All data subject rights explained | Art. 13(2)(b) |
| Right to lodge complaint with ICO | Art. 13(2)(d) |

**Fix:** Full rewrite required — estimated 20 hours + legal review.

---

### 3. Terms of Service — Unenforceable
**Severity: CRITICAL**
**Legal basis: Consumer Rights Act 2015, Consumer Contracts Regulations 2013**

The current Terms are missing:

- **14-day cooling-off period** — required for distance sales. The narrow "bespoke goods" exception (Regulation 28(1)(b)) applies only to goods that are **fully personalised** — a standard AI design may not qualify.
- **Liability limitation clause** — no cap on Keepsy's liability
- **Dispute resolution process**
- **Age requirements** (18+ for contracts)
- **Statutory rights preservation statement** ("Your statutory rights are not affected")

**Fix:** Full rewrite required — estimated 25 hours + legal review.

---

### 4. No Business Registration Details
**Severity: CRITICAL**
**Legal basis: Companies Act 2006 / Distance Selling Regulations**

UK e-commerce law requires trading name, registered company name, registration number, and registered address to be displayed on the website. None of these appear anywhere on Keepsy.

**Fix:** Register as a company (if not done) and add to footer:
```
Keepsy Ltd | Company No. XXXXXXXX | Registered in England & Wales
Registered address: [address]
```

---

### 5. Refund Policy — Non-Compliant
**Severity: CRITICAL**
**Legal basis: Consumer Contracts Regulations 2013**

The 14-day right to cancel is not properly disclosed. The policy implies all sales are final due to the "bespoke" nature — but this exception is narrower than presented and may not hold for standard AI-generated designs.

**Fix:** Explicitly state the 14-day cancellation right. Separately, define which specific goods qualify for the bespoke exception with legal advice. Add return shipping process and refund timeline (legally required within 14 days of cancellation).

---

### 6. No Data Processing Agreements
**Severity: CRITICAL**
**Legal basis: UK GDPR Article 28**

Processing personal data (customer photos, emails, order data) via third-party processors requires a Data Processing Agreement with each. Missing DPAs:

- **Stripe** — handles payment card data
- **OpenAI** — receives customer-uploaded photos for generation
- **Supabase** — stores user profiles, orders, personal data
- **Cloudinary** — stores generated images (potentially with personal photos)
- **Inngest** — processes webhook events containing order/personal data

**Fix:** Execute DPAs with all processors before launch. Stripe and Supabase have standard DPAs — execute immediately. OpenAI and Cloudinary require negotiation.

---

### 7. VAT Transparency
**Severity: HIGH**
**Legal basis: Consumer Rights Act 2015**

Displayed prices (Card £8, Mug £14, Tee £29, Hoodie £40) don't indicate whether VAT is included or excluded. UK law requires prices to be shown inclusive of VAT.

**Fix:** Add "All prices include VAT" to product pages and checkout. If VAT-registered, display VAT number. If under the £85K threshold, add "VAT not applicable (below registration threshold)."

---

### 8. GDPR Data Rights — Partial Implementation
**Severity: HIGH**

| Right | Status |
|---|---|
| Right to deletion (Art. 17) | ✓ Implemented (`/api/delete-my-data`) |
| Right of access (Art. 15) | ✗ Not implemented |
| Right to rectification (Art. 16) | ✗ Not implemented |
| Right to portability (Art. 20) | ✗ Not implemented |
| Right to restrict (Art. 18) | ✗ Not implemented |
| Right to object (Art. 21) | ✗ Not implemented |

**Fix:** Implement `/api/get-my-data` (access + portability) as minimum before launch. Others can follow post-beta.

---

### 9. No Breach Response Plan
**Severity: HIGH**
**Legal basis: UK GDPR Articles 33-34**

No documented incident response procedure exists. UK GDPR requires ICO notification within 72 hours of becoming aware of a personal data breach.

**Fix:** Create a breach response document covering: detection, team roles, ICO notification template, individual notification template, and post-incident review process.

---

### 10. Testimonial Verification Risk
**Severity: MEDIUM**
**Legal basis: ASA CAP Code, Consumer Protection from Unfair Trading Regulations**

The testimonials (Helen, Rachel, Emma) are unverified. If these are not from real customers, this constitutes misleading advertising under the CAP Code and can trigger ASA enforcement.

**Fix:** Either verify and document consent from real customers, add a "verified customer" label, or source testimonials from Trustpilot/Google Reviews.

---

### 11. Rate Limiting — Not Production-Ready
**Severity: HIGH**

The rate limiter in `app/api/generate-image/guardrails.ts` uses in-memory storage — meaning limits reset on every server restart and don't work across multiple Vercel instances. This allows unlimited generation abuse.

**Fix:** Migrate to Redis (Upstash is the simplest option) for persistent, multi-instance rate limiting. This is now made easier by the Supabase integration — could also use the `daily_usage` table already created.

Note: The `daily_usage` Supabase table is already implemented via the `check_and_increment_usage` RPC function — this just needs to be wired into the generation route as the primary limiter.

---

### 12. Image Upload — No Malware Scanning
**Severity: MEDIUM**

User-uploaded images are passed directly to OpenAI with no malware/exploit scanning. A maliciously crafted image could potentially exploit image processing libraries.

**Fix:** Add file type verification (magic bytes, not just extension), size limits (already present), and consider integrating a malware scanning service for production.

---

### 13. Accessibility Statement
**Severity: MEDIUM**
**Legal basis: Public Sector Bodies Accessibility Regulations (if applicable) / Best practice**

No accessibility statement exists. While not legally mandatory for private e-commerce, it demonstrates compliance intent and reduces legal risk.

**Fix:** Create `/accessibility` page documenting WCAG 2.1 AA target compliance and a contact for accessibility issues.

---

### 14. Security — Good Foundations ✓

- HTTP security headers present (CSP, HSTS, X-Frame-Options) ✓
- Input validation on API endpoints ✓
- Stripe webhook signature verification ✓
- No sensitive data in client-side code ✓
- Environment variables properly separated ✓

---

## Remediation Roadmap

### Phase 1: Before Any Payments (1–2 weeks)

| Task | Effort |
|---|---|
| Rewrite Privacy Policy (disclose all processors, lawful bases, retention) | 20 hrs + legal |
| Rewrite Terms of Service (14-day cancellation, liability, age) | 25 hrs + legal |
| Deploy Cookie Consent Banner | 20 hrs |
| Add business registration details to footer | 2 hrs |
| Rewrite Refund Policy (explicit 14-day right) | 10 hrs + legal |

**Estimated: £2–5K legal review, 1–2 weeks**

### Phase 2: Before Beta (2–4 weeks)

| Task | Effort |
|---|---|
| Execute DPAs with all processors | 40 hrs + legal |
| Implement `/api/get-my-data` (access + portability) | 15 hrs |
| Document breach response plan | 4 hrs |
| Add VAT transparency to pricing | 2 hrs |
| Migrate rate limiter to Supabase `daily_usage` | 8 hrs |

### Phase 3: Before Full Commercial Launch

| Task | Effort |
|---|---|
| Full WCAG 2.1 AA audit + accessibility statement | 20 hrs |
| Image malware scanning | 15 hrs |
| Implement remaining GDPR rights endpoints | 30 hrs |
| Full legal document version control process | 4 hrs |

---

## Priority Fix Order

| # | Issue | Severity | Blocking Launch? |
|---|---|---|---|
| 1 | Cookie consent banner | CRITICAL | Yes |
| 2 | Business registration details on site | CRITICAL | Yes |
| 3 | Privacy Policy rewrite | CRITICAL | Yes |
| 4 | Terms of Service rewrite | CRITICAL | Yes |
| 5 | Refund policy — 14-day cancellation | CRITICAL | Yes |
| 6 | DPAs with Stripe, OpenAI, Supabase | CRITICAL | Before beta |
| 7 | VAT transparency on pricing | HIGH | Before beta |
| 8 | `/api/get-my-data` endpoint | HIGH | Before beta |
| 9 | Breach response plan | HIGH | Before beta |
| 10 | Rate limiter → Supabase-backed | HIGH | Before beta |
| 11 | Accessibility statement | MEDIUM | Before commercial launch |
| 12 | Remaining GDPR rights endpoints | MEDIUM | Before commercial launch |
