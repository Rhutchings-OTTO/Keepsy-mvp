import type { Metadata } from "next";
import Link from "next/link";
import { RevealObserver } from "@/components/RevealObserver";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Everything you need to know about Keepsy personalised gifts. How to order, delivery times, returns, product details, and more.",
  alternates: { canonical: "https://keepsy.store/faq" },
  openGraph: {
    title: "FAQ — Keepsy Personalised Gifts",
    description: "Answers to the most common questions about ordering personalised gifts from Keepsy.",
    type: "website",
    url: "https://keepsy.store/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Keepsy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy is an online personalised gift store where customers can describe a design idea or upload a photo and instantly see it previewed on a real product — including hoodies, t-shirts, mugs, greeting cards, and canvas prints — before placing an order. Every design is unique and made to order.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I get a personalised hoodie?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy offers personalised hoodies from £44.99. You describe your design or upload a photo, see it on the hoodie before ordering, and it arrives printed and ready to gift. Visit keepsy.store/product/hoodie to start designing.",
      },
    },
    {
      "@type": "Question",
      name: "What is a good personalised gift for Mum?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Great personalised gifts for Mum include a custom photo mug (£18.99) she can use every morning, a personalised hoodie (£44.99) with a design meaningful to your family, a personalised greeting card (£9.99) with a bespoke illustration, or a canvas print (£29.99) of a favourite memory. All are designed and previewed before ordering at Keepsy.",
      },
    },
    {
      "@type": "Question",
      name: "How do custom printed mugs work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "At Keepsy, you describe your design idea or upload a photo, and our AI generates a personalised design. You see it previewed on an 11oz ceramic mug before ordering. Once you confirm, we print it on premium ceramic with a durable glossy finish and ship it to you in the UK or US. Personalised mugs start from £18.99.",
      },
    },
    {
      "@type": "Question",
      name: "How long does delivery take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Standard UK delivery takes 5-8 business days. Express delivery is available at checkout for faster arrival. US orders typically arrive within 7-12 business days. All orders include a tracking number so you can follow your gift's journey.",
      },
    },
    {
      "@type": "Question",
      name: "Do you ship to the United States?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Keepsy ships to both the United Kingdom and the United States. Free shipping is available on orders over £75 (UK) or $75 (US). US orders typically arrive within 7-12 business days.",
      },
    },
    {
      "@type": "Question",
      name: "Can I return a personalised item?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy offers a 30-day returns policy. Because personalised items are made to order, we handle returns on a case-by-case basis. If your item arrives damaged or with a print quality issue, we will reprint or refund it. Visit our refund policy page for full details.",
      },
    },
    {
      "@type": "Question",
      name: "What products can I personalise at Keepsy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy offers five personalised product types: hoodies (from £44.99), t-shirts (from £29.99), ceramic mugs (from £18.99), greeting cards (from £9.99), and canvas prints (from £29.99). All products can be customised with AI-generated designs based on your description or photo upload.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI design preview work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy uses AI image generation to create a unique design based on what you describe or the photo you upload. You instantly see the design applied to your chosen product — mug, hoodie, t-shirt, card, or canvas — so you know exactly what you're ordering before you pay. The preview is accurate to the final printed product.",
      },
    },
    {
      "@type": "Question",
      name: "What makes Keepsy different from other personalised gift sites?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike most personalised gift sites where you upload a photo and hope for the best, Keepsy lets you see your design on the actual product before you order. Every design is AI-generated and completely unique — no two Keepsy gifts are alike. You can also refine the design until it's exactly right.",
      },
    },
    {
      "@type": "Question",
      name: "What are the best personalised gifts for Father's Day?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Popular Father's Day personalised gifts at Keepsy include a custom mug with a design based on his hobbies or a family photo, a personalised hoodie for a dad who loves comfortable clothing, or a canvas print of a meaningful moment. All gifts can be previewed before ordering and delivered to UK or US addresses.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get personalised hen party hoodies?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Keepsy is popular for hen do hoodies and hen party gifts. You can create a custom design for the whole group — describe the theme, include names or a fun slogan, and preview it on a hoodie before ordering. Personalised hoodies start from £44.99. Visit the create page to design yours.",
      },
    },
    {
      "@type": "Question",
      name: "Is Keepsy safe to buy from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Keepsy uses Stripe for secure payments (the same payment processor used by Amazon and millions of other sites). We offer a 30-day returns policy and have UK/US customer support available 7 days a week. All products are printed by verified fulfilment partners.",
      },
    },
    {
      "@type": "Question",
      name: "What photo quality do I need to upload?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For best results, upload a clear photo with good lighting. The AI works well with most standard smartphone photos. If your photo is low quality, our system will still generate a design but the result may be more artistic or stylised rather than photorealistic. You can always refine the design before ordering.",
      },
    },
    {
      "@type": "Question",
      name: "Can I personalise a gift for a wedding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy is a popular choice for wedding gifts. You can create a personalised canvas print of a couple's favourite place, a custom mug set with their wedding date, or a personalised card with a bespoke illustration. All designs are unique and can be previewed before ordering.",
      },
    },
    {
      "@type": "Question",
      name: "How much does personalised printing cost at Keepsy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy's personalised products start from £9.99 for greeting cards, £18.99 for mugs, £29.99 for t-shirts, £29.99 for canvas prints, and £44.99 for hoodies. Free shipping is available on orders over £75 in the UK or $75 in the US.",
      },
    },
    {
      "@type": "Question",
      name: "Do the prints fade or wash out?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keepsy uses premium direct-to-garment (DTG) printing for clothing and dye-sublimation for mugs, which produces vivid, long-lasting prints. Garments should be washed inside out on a gentle cycle in cold water to preserve the design. Mugs are dishwasher safe on the top rack.",
      },
    },
    {
      "@type": "Question",
      name: "Can I order multiple sizes of the same personalised design?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, once you have created a design you are happy with, you can select your size and quantity at checkout. Hoodies and t-shirts are available in a range of sizes from XS to 3XL. Mugs, cards, and canvas prints come in standard sizes.",
      },
    },
  ],
};

const faqs = faqSchema.mainEntity;

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-charcoal/50">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-charcoal">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-charcoal font-medium">FAQ</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black text-charcoal sm:text-4xl mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-charcoal/60 text-base mb-10 max-w-xl">
          Everything you need to know about ordering personalised gifts from Keepsy. Can&apos;t find your answer?{" "}
          <a href="mailto:support@keepsy.store" className="underline hover:text-charcoal">
            Email our team
          </a>.
        </p>

        <RevealObserver />
        <div className="space-y-8">
          {faqs.map((faq, i) => (
            <div key={i} className="reveal-on-scroll border-b border-charcoal/10 pb-8">
              <h2 className="text-lg font-bold text-charcoal mb-2">{faq.name}</h2>
              <p className="text-charcoal/70 leading-relaxed">{faq.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>

        <div className="reveal-on-scroll mt-12 rounded-2xl bg-[#F5EDE0] p-6">
          <h2 className="text-xl font-bold text-charcoal mb-2">Ready to create a personalised gift?</h2>
          <p className="text-charcoal/70 mb-4">
            Design something unique in seconds — describe your idea or upload a photo and see it on a hoodie, mug, card, t-shirt, or canvas before you order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-terracotta, #C4714A)" }}
            >
              Start designing
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 px-5 py-3 text-sm font-bold text-charcoal hover:bg-white transition-colors"
            >
              Browse products
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
