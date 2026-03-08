# Team 5: Hero Sections & Landing Areas — Visual Audit Report
**File:** `app/LandingPage.tsx`
**Date:** 2026-03-08

---

## Full File Overview

LandingPage.tsx is ~912 lines. It contains:

1. **Header** (lines 361–381) — sticky nav with logo, region button, Shop Now CTA
2. **Hero section** (lines 384–482) — editorial split: headline left, product image grid right
3. **Social proof marquee** (lines 484–515) — terracotta strip with scrolling text
4. **Featured Products** (lines 517–565) — "Most Loved This Month" 2×2 / 4-col grid
5. **Emotional storytelling** (lines 567–633) — split layout with image + copy
6. **How It Works** (lines 635–697) — numbered list, 3 steps
7. **Reviews** (line 700) — lazy-loaded `<ReviewsSection />`
8. **Trust Grid** (line 703) — lazy-loaded `<TrustSection />`
9. **Email capture** (lines 705–790) — forest green section
10. **Footer** (lines 793–895) — charcoal, accordion on mobile

---

## Issues Identified

### A) Section Spacing

| Section | Current padding | Issue |
|---|---|---|
| Hero | `py-10 lg:py-24` (on inner grid, not section) | Section wrapper has no vertical padding; inner grid drives all spacing. OK on desktop but `py-10` feels tight on mobile |
| Featured Products | `py-12 sm:py-20` (line 518) | Acceptable but could be `py-16 sm:py-24` for premium feel |
| Emotional storytelling | `py-12 sm:py-20` (line 569) | Same — slightly cramped on mobile |
| How It Works | `py-12 sm:py-20` (line 636) | Same |
| Email capture | `py-12 sm:py-20` (line 707) | Same |

**Fix:** Standardise all content sections to `py-16 sm:py-24` for a more premium feel.

### B) Trust Badges Section

Trust badges are rendered inside `<TrustSection />` (a sub-component we cannot touch). Nothing to fix here in LandingPage.tsx.

### C) Featured Product Cards

`FeaturedProductCard` (lines 205–274):
- Image wrapper (line 232): already has `style={{ aspectRatio: "4/5" }}` and `overflow-hidden` — **good**.
- Card container (line 221): has `group` class already — **good**.
- Image (line 236): has `group-hover:scale-105` — **good**.

One minor issue: the `rounded-2xl` is on the card container but the image wrapper div only has `overflow-hidden` without `rounded-2xl`, so images can clip the card border-radius on some browsers. The image wrapper at line 232 is missing `rounded-2xl`.

Actually looking more carefully: the card has `overflow-hidden rounded-2xl` on the outer wrapper which handles clipping. The inner image div does not need its own border radius.

No changes needed here beyond what's already in place.

### D) CTA Buttons

- Hero primary CTA (line 443): `min-h-[52px]` — **exceeds** the 44px requirement. Good.
- Hero secondary CTA (line 450): `min-h-[52px]` — **good**.
- Emotional storytelling CTA (line 622): `py-3.5` only, no explicit `min-h`. Actual height ~48px depending on font. Should add `min-h-[44px]` explicitly.
- Email submit button (line 770): `py-3.5` only, no `min-h`. Should add `min-h-[44px]`.
- Footer "Shop Now" header link (line 373): `py-2.5` — ~40px, slightly below target. Should add `min-h-[44px]`.

### E) Heading Sizes and Balance

- **Hero h1** (line 408): Uses `style={{ fontSize: "clamp(2.4rem, 7vw, 6.5rem)" }}` — this is fine and impactful. No class-based size to change, but `font-bold` is set. Could strengthen to `font-black` for more visual punch.
- **"Most Loved This Month" h2** (line 533): `text-3xl sm:text-5xl` — acceptable.
- **"Every Keepsake Tells a Story" h2** (line 611): `text-3xl sm:text-5xl lg:text-6xl` — **good**.
- **"Three Simple Steps" h2** (line 650): `text-3xl sm:text-5xl` — acceptable.
- **Email section h2** (line 721): `text-3xl sm:text-4xl sm:text-5xl` — has duplicate `sm:` prefix. The second `sm:text-5xl` overrides the first, making `sm:text-4xl` a dead class. Should be `text-3xl sm:text-5xl`.
- **`text-balance`** not applied to any headings — should add to h1 (hero), and key h2s for wrapping control.

### F) Whitespace at Page Bottom

- The last content section is the email capture, `py-12 sm:py-20` (line 707). After it comes the footer.
- Footer has `py-10 sm:py-14` (line 794).
- Combined this gives reasonable spacing but the last section could be `py-16 sm:py-24` to feel more generous before the footer.

---

## Planned Changes (Minimal & Targeted)

1. **Lines 518, 569, 636, 707** — Change `py-12 sm:py-20` → `py-16 sm:py-24` on all four content sections (Featured Products, Emotional Storytelling, How It Works, Email Capture).

2. **Line 408 hero h1** — Add `text-balance` class. Change `font-bold` → `font-black`.

3. **Line 533 "Most Loved" h2** — Add `text-balance`.

4. **Line 611 "Every Keepsake" h2** — Add `text-balance`.

5. **Line 650 "Three Simple Steps" h2** — Add `text-balance`.

6. **Line 721 email h2** — Fix duplicate `sm:text-4xl sm:text-5xl` → `sm:text-5xl`. Add `text-balance`.

7. **Line 622 "Create Your First Keepsake" CTA** — Add `min-h-[44px]` to the link.

8. **Line 770 email submit button** — Add `min-h-[44px]`.

9. **Line 373 header "Shop Now"** — Add `min-h-[44px]`.

---

## Summary

The landing page is well-structured. The primary issues are:
- **Section padding is slightly tight** (`py-12`) across 4 sections — standardising to `py-16 sm:py-24` will give the page more breathing room appropriate for a premium brand.
- **Hero h1 could be bolder** — `font-black` instead of `font-bold`.
- **`text-balance` missing** on all key headings — easy win for text wrapping.
- **Duplicate sm: class on email h2** — minor bug causing `sm:text-4xl` to be overridden.
- **A few CTAs missing `min-h-[44px]`** for tap target compliance.
