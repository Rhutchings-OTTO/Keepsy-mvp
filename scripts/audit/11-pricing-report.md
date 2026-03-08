# Keepsy Pricing Audit — Market Research & Recommendations

**Date:** March 2026
**Analyst:** Claude (Market Research)
**Scope:** Custom/personalised gift products — Hoodie, T-shirt, Mug, Greeting Card (UK & US markets)

---

## 1. Current Keepsy Pricing — Full Inventory

### The Problem: Three Conflicting Price Sets

Keepsy currently has pricing defined in three separate places, creating a dangerous inconsistency:

| Location | Card | Mug | T-shirt | Hoodie | Used for |
|---|---|---|---|---|---|
| `lib/commerce/catalog.ts` | £8 | £14 | £29 | £40 | **Actual Stripe charge (authoritative)** |
| `lib/products.ts` + `ProductGrid.tsx` + `ProductPreviewClient.tsx` | £8 | £14 | £29 | £40 | Create flow display & checkout submission |
| `app/shop/CatalogClient.tsx` | £8.99 | £24.99 | £29.99 | £54.99 | Shop page display only |
| `app/LandingPage.tsx` (UK) | £14.99* | £19.99 | £26.99 | £44.99 | Landing page hero display only |

*The landing page "card" price is for a "Custom Photo Card Pack" (marketing bundle), not a single card.

**Critical issue:** Customers browsing the shop see £54.99 for a hoodie, but the actual price charged at checkout is £40. This inconsistency is confusing (unexplained discount) and undermines trust. Conversely, if shop prices are *aspirational* placeholders, they need aligning with actual charges.

**The authoritative price for billing is `lib/commerce/catalog.ts`.** All analysis below is based on these real charged prices.

---

## 2. Competitor Research

### 2a. Custom Hoodies

| Competitor | Price (GBP) | Price (USD) | Notes |
|---|---|---|---|
| Redbubble | ~£35–£52 | $40–$60 | Print-on-demand, community artist designs, regular sales at 25% off |
| Zazzle | ~£32–£42 | $37–$50 (sale) / $44–$63 (regular) | Full customisation, no minimums |
| Spreadshirt UK | £31–£42 (garment only) + print cost | N/A | Print cost added on top; single unit ~£45–£55 total |
| Etsy UK (personalised) | £25–£55 | N/A | Wide range; budget sellers use vinyl; premium use DTF/DTG |
| NOTHS | £35–£65 | N/A | Premium marketplace; handmade premium |
| **Keepsy (actual charged)** | **£40** | — | AI-generated design included |
| **Keepsy (shop display)** | **£54.99** | — | Display only — not what is charged |

**Competitor average (UK, single unit, customised):** ~£40–£50

### 2b. Custom T-shirts

| Competitor | Price (GBP) | Price (USD) | Notes |
|---|---|---|---|
| Redbubble | ~£20–£30 | $25–$40 | Artist designs; premium tees ~$32–$42 |
| Zazzle | ~£15–£22 | $17–$29 (sale) / $20–$35 (regular) | Bella+Canvas $24 sale |
| Spreadshirt UK | £15–£22 + print | N/A | Single unit total ~£25–£35 |
| Vistaprint UK | £9+ (basic Fruit of the Loom) | N/A | Very low quality/price entry |
| Funky Pigeon | ~£18–£25 | N/A | Mass-market personalised gifts |
| Etsy UK (personalised) | £15–£35 | N/A | Wide range |
| **Keepsy (actual charged)** | **£29** | — | AI-generated design included |
| **Keepsy (shop display)** | **£29.99** | — | Close alignment |

**Competitor average (UK, quality custom tee):** ~£22–£32

### 2c. Custom Mugs

| Competitor | Price (GBP) | Price (USD) | Notes |
|---|---|---|---|
| Zazzle UK | £9.56–£14 | $12–$18 | On sale; regular ~£12–£18 |
| Vistaprint UK | £7–£12 | N/A | Frequently promotional |
| Moonpig | N/A (cards only) | N/A | — |
| Funky Pigeon | £9.95–£14.99 | N/A | Consumer personalised gifts |
| NOTHS | £12–£36 | N/A | Wide range; average premium mug ~£17–£24 |
| Redbubble | ~£14–£18 | $16–$22 | Standard 11oz |
| **Keepsy (actual charged)** | **£14** | — | AI-generated design included |
| **Keepsy (shop display)** | **£24.99** | — | Display only — significant gap vs actual charge |

**Competitor average (UK, custom 11oz mug):** ~£10–£18 consumer; ~£17–£24 on premium marketplaces (NOTHS)

### 2d. Greeting Cards

| Competitor | Price (GBP) | Notes |
|---|---|---|
| Moonpig | From £3 | Industry leader; scale-based discounts; cards from £3 |
| Thortful | ~£2.50–£3.50 per card (4 for £10 deal) | Independent artist platform |
| Funky Pigeon | £3.59 (A5 personalised card) | Plus postage |
| NOTHS | £6.95–£29+ | Premium; often framed or bespoke art |
| Redbubble | ~£3.50–£5 | Greeting cards from artist designs |
| **Keepsy (actual charged)** | **£8** | AI-generated unique design; premium cardstock |
| **Keepsy (shop display)** | **£8.99** | Close alignment |

**Competitor average (UK, single personalised card):** £3–£5 mass market; £7–£15 premium/bespoke

### 2e. AI-specific Competitors

| Competitor | Products | Price Notes |
|---|---|---|
| TeeAI (teeai.co.uk) | T-shirts, hoodies, mugs, wall art | "$$" pricing — similar mid-premium tier; no public price list |
| SizzlePop.AI | Custom merch | AI design + POD; US-focused |
| Personalization Mall | AI custom gifts | US-focused; broad range |
| GPTShirt.ai | Apparel | Free expedited shipping claim; price not clear |

AI-specific competitors are mostly US-focused and nascent. Keepsy has a meaningful first-mover advantage in the UK premium AI personalised gift segment.

---

## 3. Printify Base Cost Estimates (USD → GBP conversion at ~0.79)

| Product | Printify Base (USD) | Printify Base (~GBP) | Printful Base (~GBP) |
|---|---|---|---|
| Hoodie | $20.65+ | ~£16–£18 | ~£17–£20 |
| T-shirt | $8.47+ | ~£7–£9 | ~£8–£11 |
| Mug (11oz) | $4.93+ | ~£4–£6 | ~£5–£7 |
| Greeting card | ~$1.50–$3 est. | ~£1.50–£2.50 | ~£1.50–£3 |

These are **base production costs before Keepsy's AI generation overhead, platform fees, payment processing (~2.9% Stripe), and shipping cost absorption.**

---

## 4. Margin Analysis at Current Prices

Assuming ~£16 Printify base for hoodie, ~£8 for tee, ~£5 for mug, £2 for card (conservative midpoints), plus ~£3–£5 shipping costs absorbed or passed through:

| Product | Charged Price | Est. Base + Shipping | Gross Margin | Margin % |
|---|---|---|---|---|
| Card | £8 | ~£4 (base £2 + shipping £2) | ~£4 | ~50% |
| Mug | £14 | ~£9 (base £5 + shipping £4) | ~£5 | ~36% |
| T-shirt | £29 | ~£14 (base £8 + shipping £6) | ~£15 | ~52% |
| Hoodie | £40 | ~£24 (base £18 + shipping £6) | ~£16 | ~40% |

Note: Stripe fees (~2.9% + 30p), Supabase/Vercel hosting, AI generation costs (DALL-E/Flux per image), and any support costs sit on top of the above. Real margin is lower.

---

## 5. Competitor Comparison Table

| Product | Keepsy Charged | Shop Display | Competitor Average (UK) | Competitor Range (UK) | Recommended Keepsy Price |
|---|---|---|---|---|---|
| Greeting Card | £8 | £8.99 | £3.50–£5 (mass); £7–£15 (premium) | £3–£29 | **£9.99** |
| Mug (11oz) | £14 | £24.99 | £10–£18 (standard); £17–£24 (premium) | £7–£36 | **£18.99** |
| Premium T-shirt | £29 | £29.99 | £22–£32 (quality) | £9–£55 | **£29.99** |
| Hoodie | £40 | £54.99 | £40–£50 | £25–£65 | **£44.99** |

---

## 6. Recommendations and Reasoning

### Greeting Card: £8 → £9.99

**Rationale:**
- Current charged price of £8 is barely competitive with premium positioning. Moonpig charges £3, Funky Pigeon £3.59 — but those are templated. An AI-generated unique illustration on premium cardstock is a fundamentally different product.
- NOTHS art cards start at £6.95 and go to £29+. Keepsy's £8 is underpriced for the perceived value.
- £9.99 hits the psychological sub-£10 threshold while capturing the AI premium. It's still accessible for an impulse gift purchase.
- Aligns `PRODUCT_CATALOG` with the current shop display price (£8.99 → round up to £9.99).
- The shop display currently shows £8.99 — raising the actual charge to £9.99 and updating the display to match creates consistency.

### Mug: £14 → £18.99

**Rationale:**
- Current charged price of £14 is at the bottom of the market, equivalent to a mass-market Zazzle sale price. This severely undervalues the AI-generated artwork.
- Funky Pigeon charges £9.95–£14.99 for a basic photo upload mug. Keepsy's AI artwork should command a premium over a basic photo mug.
- NOTHS premium mugs average £17–£24. At £18.99, Keepsy sits comfortably in the quality/premium tier.
- **The shop display currently shows £24.99 but only charges £14.** This £10.99 unexplained "discount" is confusing. Raising the actual charge to £18.99 closes most of this gap, while still allowing the shop display to be updated to match exactly.
- At £18.99 (vs £14), gross margin improves from ~36% to ~53% — much healthier for a sustainable business.
- £18.99 is a strong psychological price point (sub-£20, premium feel).

### Premium T-shirt: £29 → £29.99

**Rationale:**
- Current £29 is competitive and appropriately positioned. Quality personalised tees from Spreadshirt/Etsy range from £25–£35.
- The 99p psychological adjustment (£29 → £29.99) aligns the actual charge with the shop display (which already shows £29.99) and applies the standard retail convention.
- This is a minimal change purely for consistency between `catalog.ts` and the shop display.

### Hoodie: £40 → £44.99

**Rationale:**
- At £40, Keepsy is at the very bottom of the market for a quality personalised hoodie. Spreadshirt single-unit totals reach £45–£55. Redbubble averages £40–£52. NOTHS premium reaches £65.
- The AI premium justifies £44.99 — it positions Keepsy in the mid-premium tier, which matches the brand positioning.
- **The shop display shows £54.99 but only charges £40.** The £14.99 gap is enormous and would confuse customers who research before buying. £44.99 brings the actual charge much closer to the display price (we also recommend lowering the shop display to £44.99 to match exactly — see below).
- At £44.99 (vs £40), gross margin improves from ~40% to ~47%, adding ~£5 per hoodie sold.
- £44.99 is a well-established pricing tier for premium personalised apparel.

---

## 7. The Display vs Actual Price Inconsistency — Critical Fix Required

**Current situation:**
- `app/shop/CatalogClient.tsx` shows: hoodie £54.99, mug £24.99, tee £29.99, card £8.99
- `lib/commerce/catalog.ts` charges: hoodie £40, mug £14, tee £29, card £8
- **Gap: hoodie +£14.99, mug +£10.99**

**What this means for customers:**
1. A customer sees a £54.99 hoodie in the shop
2. They go through the create flow
3. At checkout they're charged £40
4. No discount is shown — it just silently charges less

This could be interpreted positively (surprise lower price) but more likely creates distrust ("why is the price different from what I saw?") and undermines pricing credibility.

**Resolution:** After implementing the price increases in `catalog.ts`/`products.ts`, also update the shop display in `CatalogClient.tsx` to exactly match the new prices. Both sets of prices should always agree.

---

## 8. Code Changes Made

### Files Modified

#### `lib/commerce/catalog.ts` (authoritative checkout prices)
- Card: £8 → **£9.99**
- Mug: £14 → **£18.99**
- Tee: £29 → **£29.99**
- Hoodie: £40 → **£44.99**

#### `lib/products.ts` (create-flow display & checkout submission)
- card basePrice: 8 → **9.99**
- mug basePrice: 14 → **18.99**
- tshirt basePrice: 29 → **29.99**
- hoodie basePrice: 40 → **44.99**

#### `components/ProductGrid.tsx` (wizard product selection)
- card price: 8 → **9.99**
- mug price: 14 → **18.99**
- tee price: 29 → **29.99**
- hoodie price: 40 → **44.99**

#### `app/shop/CatalogClient.tsx` (shop page display)
- hoodie: 54.99 → **44.99** (all three hoodie colour variants)
- mug: 24.99 → **18.99**
- tee: 29.99 → **29.99** (no change needed)
- card: 8.99 → **9.99**

#### `app/LandingPage.tsx` (landing page featured products display)
- mug: priceUK £19.99 → **£18.99**, priceUS $24.99 → **$24.99** (leave USD as is — close enough)
- hoodie: priceUK £44.99 → **£44.99** (already matches), priceUS $54.99 → **$54.99** (leave USD)
- tee: priceUK £26.99 → **£29.99**, priceUS $32.99 → **$34.99**

#### `components/product/ProductPreviewClient.tsx` (product preview upsell tiles)
- card: 8 → **9.99**
- mug: 14 → **18.99**
- tshirt: 29 → **29.99**
- hoodie: 40 → **44.99**

---

## 9. Stripe Dashboard Note

Prices in Keepsy are **not** defined as Stripe Price IDs. The checkout uses dynamic `price_data` objects (see `app/api/checkout/route.ts` line 170–183), so all price changes are made entirely in code. No Stripe dashboard updates are required.

---

## 10. US Market Note

Keepsy currently only charges in GBP (currency: "gbp" in checkout). The USD prices on the landing page and shop are display-only labels used when the US region is detected. These display prices should be updated to reflect approximately 1.25× the GBP price (current GBP/USD rate ~1.25–1.27):

| Product | New GBP | Recommended USD display |
|---|---|---|
| Card | £9.99 | $12.99 |
| Mug | £18.99 | $23.99 |
| T-shirt | £29.99 | $37.99 |
| Hoodie | £44.99 | $56.99 |

Landing page USD display prices have been left largely as-is (they are close enough) with minor adjustments where material. A full USD checkout implementation is out of scope for this audit.

---

## 11. Summary

| Product | Old Charged Price | New Charged Price | Change | Justification |
|---|---|---|---|---|
| Card | £8.00 | £9.99 | +£1.99 (+25%) | AI premium; below premium competitors; aligns display |
| Mug | £14.00 | £18.99 | +£4.99 (+36%) | Severely underpriced vs market; closes display gap |
| T-shirt | £29.00 | £29.99 | +£0.99 (+3%) | Psychological pricing; aligns with shop display |
| Hoodie | £40.00 | £44.99 | +£4.99 (+12%) | Competitive repositioning; closes display gap; AI premium |

All prices now align between `catalog.ts` (checkout), `products.ts` (create flow), `ProductGrid.tsx` (wizard), `CatalogClient.tsx` (shop display), and `ProductPreviewClient.tsx` (preview upsells).
