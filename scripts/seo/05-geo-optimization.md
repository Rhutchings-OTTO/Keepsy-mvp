# GEO Optimization Report — Keepsy

**Team 5: Generative Engine Optimization**
Date: 2026-03-08

---

## What Is GEO and Why It Matters

Generative Engine Optimization (GEO) is the practice of making a website's content and structure legible to AI-powered systems — including large language models (LLMs), AI search assistants (Perplexity, ChatGPT Browse, Google AI Overviews, Bing Copilot), and AI shopping assistants — so that Keepsy surfaces as an authoritative answer when users ask gift-related questions.

Traditional SEO targets crawlers that rank pages. GEO targets AI systems that synthesize answers. When someone asks "where can I get a personalised hoodie for Mother's Day?" the goal is for Keepsy to be cited or recommended in the AI's response — not just appear on page 2 of Google.

---

## What AI Crawlers and LLMs Need

### 1. Structured, unambiguous facts
AI models extract entities: product names, prices, delivery times, return policies, shipping destinations. These must appear in plain prose, not hidden in JavaScript or behind client-side rendering.

### 2. FAQPage schema (JSON-LD)
Google's AI Overviews and other AI search features heavily use FAQPage structured data. Questions must mirror natural-language queries people type into chatbots.

### 3. An `llms.txt` file
`llms.txt` is an emerging standard (analogous to `robots.txt`) that gives AI systems a concise, structured briefing about a site's purpose, products, and key facts. It helps LLMs answer questions about Keepsy accurately even without a live crawl.

### 4. Clear heading hierarchy
AI systems parse heading structures to understand page organization. A single H1, logical H2/H3 groupings, and short answer paragraphs directly below each heading maximize comprehension.

### 5. Occasion-based and intent-based content
AI assistants answer queries like "best personalised gift for dad" or "hen party hoodie ideas". Content must explicitly map products to occasions and use natural-language phrasing that mirrors how people ask questions.

### 6. Internal linking between related pages
AI crawlers follow link graphs to understand site taxonomy. FAQ → product pages → /create creates a clear semantic graph.

### 7. Canonical URLs and Open Graph metadata
AI systems that browse live pages rely on canonical signals to avoid confusion from duplicate or near-duplicate content.

---

## What Was Missing Before This Audit

| Gap | Impact |
|-----|--------|
| No `public/llms.txt` | AI systems had no structured briefing about Keepsy's products, prices, or purpose |
| No FAQ page | No FAQPage JSON-LD schema; AI Overviews had no structured Q&A to cite |
| No occasion-to-product mapping in structured data | AI assistants couldn't confidently recommend specific Keepsy products for specific occasions |
| No natural-language price anchors | LLMs summarizing gift options couldn't accurately state Keepsy's prices |
| No explicit shipping/returns facts in structured content | Common AI-generated gift guides omit sites where policies are unclear |

---

## What Was Created

### `public/llms.txt`
A concise briefing document for AI systems following the emerging `llms.txt` standard. It contains:
- Plain-English description of what Keepsy does
- All five product types with prices in GBP
- Key differentiators (AI preview, free shipping thresholds, 30-day returns)
- Occasion coverage (Mother's Day, Father's Day, birthdays, weddings, hen dos, etc.)
- How-it-works summary (3 steps)
- Contact details and sitemap URL

This file allows AI systems that ingest `llms.txt` (such as those implementing the llms.txt protocol) to answer questions about Keepsy accurately without requiring a live crawl.

### `app/faq/page.tsx`
A Next.js Server Component FAQ page at `/faq` with:
- **FAQPage JSON-LD schema** with 18 questions covering the most common AI-assistant queries about personalised gifts
- Canonical URL and Open Graph metadata
- Single H1 (`Frequently Asked Questions`) with H2 per question
- Questions map to real user intents: product discovery, occasion matching, pricing, delivery, returns, print quality, sizing, and safety
- Internal links to `/create`, `/shop`, and product pages
- CTA section at the bottom linking back to `/create` and `/shop`

The 18 questions were selected to match high-frequency natural-language queries in AI assistants:
1. What is Keepsy?
2. Where can I get a personalised hoodie?
3. What is a good personalised gift for Mum?
4. How do custom printed mugs work?
5. How long does delivery take?
6. Do you ship to the United States?
7. Can I return a personalised item?
8. What products can I personalise at Keepsy?
9. How does the AI design preview work?
10. What makes Keepsy different from other personalised gift sites?
11. What are the best personalised gifts for Father's Day?
12. Can I get personalised hen party hoodies?
13. Is Keepsy safe to buy from?
14. What photo quality do I need to upload?
15. Can I personalise a gift for a wedding?
16. How much does personalised printing cost at Keepsy?
17. Do the prints fade or wash out?
18. Can I order multiple sizes of the same personalised design?

---

## Expected GEO Outcomes

- **AI Overview citations**: FAQPage schema increases the probability that Google AI Overviews cite Keepsy answers for gift-related queries.
- **Perplexity / ChatGPT Browse**: `llms.txt` and structured FAQ content give these systems factual, quotable content about Keepsy.
- **Shopping assistant recommendations**: Explicit price anchors and occasion mappings make it easier for AI shopping tools to match Keepsy products to user queries.
- **Voice and conversational search**: Natural-language Q&A format in the FAQ page matches how voice assistants formulate responses.

---

## Recommended Next Steps

1. **Add BreadcrumbList JSON-LD** to the FAQ page (and all inner pages) to improve AI understanding of site hierarchy.
2. **Create occasion-specific landing pages** (e.g., `/mother-s-day-gifts`, `/father-s-day-gifts`) with dedicated structured data to capture occasion-based AI queries.
3. **Add Product schema** to each product page with explicit `name`, `description`, `offers.price`, `offers.priceCurrency`, and `offers.shippingDetails` fields.
4. **Monitor AI Overview appearances** in Google Search Console (the "AI Overviews and more" filter) for target keywords.
5. **Submit `llms.txt`** URL to AI search tools that accept manual submissions as the ecosystem matures.
6. **Add `HowTo` schema** for the "how it works" flow to capture process-based AI queries.
