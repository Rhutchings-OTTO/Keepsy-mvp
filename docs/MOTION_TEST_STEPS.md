# Premium Motion System – Manual Test Steps

## 12 Manual Test Steps

1. **Mobile scroll performance**  
   On a mobile device or Chrome DevTools mobile emulation: scroll the landing page, gift-ideas, and create page. Ensure smooth scrolling, no jank, and animations run at a steady frame rate.

2. **Reduced motion**  
   Enable "Reduce motion" in OS settings (macOS: System Settings → Accessibility → Display → Reduce motion). Reload the site. Confirm animations are disabled or minimized: no parallax, no hover scale, no scroll reveals.

3. **Hover interactions (desktop)**  
   On landing page: hover floating product cards – confirm subtle lift and shadow. On gift-ideas: hover occasion tiles – confirm hover lift and optional tilt. On create page: hover catalog/product cards – confirm hover feedback.

4. **Carousel drag + keyboard**  
   On create page: find the "What our creators say" testimonials carousel. Drag horizontally to scroll. Use Arrow Left / Arrow Right to change slides. Click pagination dots. Verify arrows and dots update correctly.

5. **Generation still works**  
   Go to /create. Enter a prompt and click "Generate Design". Confirm image generation completes and the preview appears. No regression in the generation flow.

6. **Placement still correct**  
   Generate a design, select a product (tee, mug, card, hoodie). Confirm the mockup shows the design placed correctly. Change colors – verify placement remains accurate. No layout shifts.

7. **Stripe checkout still works**  
   Add a design to cart or proceed to checkout. Click "Pay £X" and complete the Stripe checkout flow (or use a test card). Confirm redirect to success page and order confirmation.

8. **Region selector still works**  
   On landing page: click "US · Change region" (or equivalent). Select a region. Confirm selection persists and region-specific content updates where applicable.

9. **Reveal on scroll**  
   Scroll the landing page hero – headline/subtext/CTA should fade up when entering view. Scroll gift-ideas – section titles and occasion tiles should reveal. Scroll create page – sections should reveal as they enter viewport.

10. **Success page reveal**  
    Complete a checkout (or visit /success directly with `?session_id=...` if available). Confirm the order confirmation card fades up on load.

11. **Interactive cards on gift-ideas**  
    Visit /gift-ideas. Hover occasion tiles – confirm glass-style hover and optional tilt. Click a tile – confirm navigation to /create with the correct occasion params.

12. **Lighthouse / performance**  
    Run Lighthouse (Performance) on landing, create, and gift-ideas. Ensure no significant regression. Animations should not block main thread excessively.
