# Premium Mockup System — Manual Test Steps

## Overview
Run these 12 steps to verify the premium mockup system across all products and colours, with and without artwork.

---

### 1. T‑shirt (white) — no artwork
- Go to `/create`
- Select **T‑shirt** (Premium tee)
- Ensure **white** is selected
- Do not generate or upload
- **Expected**: Glass overlay "Your design will appear here" / "Generate or upload to preview" in the correct print area; no dashed border; clean studio background

### 2. T‑shirt (white) — with artwork
- From step 1, enter a prompt and generate (or upload an image)
- **Expected**: Artwork appears on the tee in the print area; glass overlay is hidden; artwork is crisp and not tinted

### 3. T‑shirt (black) — no artwork
- Select **T‑shirt**
- Switch colour to **black**
- If possible, clear/reset so no artwork
- **Expected**: Same glass overlay placement; black tee base image; no artwork tint

### 4. T‑shirt (black) — with artwork (colour switch)
- With artwork visible from step 2, switch to **black**
- **Expected**: Artwork remains identical (no tint); same placement; only the base tee changes

### 5. T‑shirt (blue) — with artwork
- Switch to **blue**
- **Expected**: Artwork unchanged; blue tee base; crisp artwork

### 6. Hoodie — no artwork
- Select **Hoodie**
- Ensure no artwork
- **Expected**: Glass overlay on hoodie print area; correct placement for hoodie

### 7. Hoodie — with artwork
- Generate or upload artwork while on Hoodie
- **Expected**: Artwork on hoodie; overlay hidden; crisp

### 8. Hoodie — colour switch with artwork
- Switch hoodie between white, black, blue
- **Expected**: Artwork stays identical; no tint; only base changes

### 9. Mug — no artwork
- Select **Mug**
- No artwork
- **Expected**: Glass overlay on mug face; correct placement

### 10. Mug — with artwork
- Generate artwork for mug
- **Expected**: Artwork on mug; overlay hidden; placement correct

### 11. Card — no artwork
- Select **Greeting card**
- No artwork
- **Expected**: Glass overlay "Your message / artwork here" on card face

### 12. Card — with artwork
- Generate artwork for card
- **Expected**: Artwork on card; overlay hidden; placement correct

---

## Additional checks
- **Responsive**: Resize to mobile; preview scales without overflow; controls remain usable
- **Accessibility**: Tab through product/colour controls; keyboard works
- **Reduced motion**: Enable prefers-reduced-motion; overlay transitions are minimal
- **Checkout**: Add to cart and complete checkout; Stripe flow unaffected
