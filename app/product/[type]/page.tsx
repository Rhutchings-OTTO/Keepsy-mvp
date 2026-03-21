import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_CARDS } from "@/components/ProductGrid";
import { ProductPreviewClient } from "@/components/product/ProductPreviewClient";
import { JsonLd } from "@/components/JsonLd";

type ProductPageProps = {
  params: Promise<{ type: string }>;
};

const PRODUCT_TITLES: Record<string, string> = {
  hoodie: "Personalised Hoodie — Custom Printed Hoodie Gift | Keepsy",
  mug: "Personalised Mug — Custom Photo Mug Gift | Keepsy",
  tee: "Personalised T-Shirt — Custom Printed Tee Gift | Keepsy",
  card: "Personalised Greeting Card — Custom Photo Card | Keepsy",
  canvas: "Personalised Canvas Print — Custom Photo Canvas | Keepsy",
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  hoodie:
    "Design a personalised hoodie from £44.99. Upload a photo or describe your idea — see it on the hoodie before you order. Soft fleece, vivid lasting print. Free UK & US shipping over £75.",
  mug: "Create a personalised mug from £14.99. Upload a photo or describe your idea — preview it on a ceramic mug before ordering. Perfect gift for any occasion. Ships to UK and US.",
  tee: "Design a personalised t-shirt from £29.99. Upload a photo or describe your design — preview it on a premium tee before you order. Soft, vivid prints. Free UK & US shipping over £75.",
  card: "Create a personalised greeting card from £6.99. Describe your design or upload a photo — see it on a premium card before ordering. Perfect for birthdays, Mother's Day, weddings and more.",
  canvas:
    "Design a personalised canvas print from £29.99. Upload a photo or describe your idea — preview it before ordering. Vivid gallery-quality print. Ships to UK and US.",
};

export function generateStaticParams() {
  return PRODUCT_CARDS.map((p) => ({ type: p.type }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((p) => p.type === type);
  if (!product) return {};
  const title =
    PRODUCT_TITLES[type] ?? `Personalised ${product.name} — Custom ${product.name} Gift | Keepsy`;
  const description =
    PRODUCT_DESCRIPTIONS[type] ??
    `Design a personalised ${product.name.toLowerCase()} with your own photo or memory. Starting from £${product.price.toFixed(2)} — made to order, shipped to UK & US.`;
  return {
    title,
    description,
    alternates: { canonical: `https://keepsy.store/product/${type}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://keepsy.store/product/${type}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const PRODUCT_META: Record<string, { name: string; price: string; image: string }> = {
  hoodie: {
    name: "Personalised Hoodie",
    price: "44.99",
    image: "https://keepsy.store/images/mockups/hoodie-preview.jpg",
  },
  mug: {
    name: "Personalised Mug",
    price: "14.99",
    image: "https://keepsy.store/images/mockups/mug-preview.jpg",
  },
  tee: {
    name: "Personalised T-Shirt",
    price: "29.99",
    image: "https://keepsy.store/images/mockups/tee-preview.jpg",
  },
  card: {
    name: "Personalised Greeting Card",
    price: "6.99",
    image: "https://keepsy.store/images/mockups/card-preview.jpg",
  },
  canvas: {
    name: "Personalised Canvas Print",
    price: "29.99",
    image: "https://keepsy.store/images/mockups/canvas-preview.jpg",
  },
};

function buildProductJsonLd(type: string, name: string, description: string, price: string, image: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://keepsy.store/product/${type}`,
    name,
    description,
    image,
    sku: `KEEPSY-${type.toUpperCase()}`,
    brand: {
      "@type": "Brand",
      name: "Keepsy",
    },
    offers: {
      "@type": "Offer",
      "@id": `https://keepsy.store/product/${type}#offer`,
      url: `https://keepsy.store/product/${type}`,
      price,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Keepsy",
        url: "https://keepsy.store",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "GBP",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: ["GB", "US"],
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: ["GB", "US"],
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "247",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

const PRODUCT_CONTENT = {
  hoodie: {
    aboutTitle: "About Our Personalised Hoodies",
    about: "Our personalised hoodies are soft, cosy, and built to last. Classic fit with a double-lined hood and front pouch pocket — the kind of hoodie that becomes a favourite from the first wear. Every design is unique — created from your description or photo and previewed before you order, so you know exactly what you're getting. Whether it's a gift for Mum, a hen party keepsake, or a birthday surprise, a personalised hoodie from Keepsy makes gifting genuinely memorable.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us what you'd like on your personalised hoodie, or upload a photo. Our AI creates a unique design in seconds." },
      { title: "Preview your design", description: "See exactly how your custom hoodie design will look before you commit to ordering. Refine it until it's perfect." },
      { title: "We print and ship", description: "Your personalised hoodie is printed on demand and shipped to your door in the UK or US." },
    ],
    perfectFor: ["Mother's Day", "Father's Day", "Birthdays", "Hen parties", "Christmas gifts", "Anniversaries", "Just because"],
    faqs: [
      { q: "What sizes are personalised hoodies available in?", a: "Our personalised hoodies come in sizes XS through to 3XL. Full size measurements are available on the product page." },
      { q: "How do I wash my personalised hoodie?", a: "Turn inside out and machine wash on a gentle cool cycle (30°C or below). Tumble dry on low or air dry. Do not iron directly on the print." },
      { q: "How long does a personalised hoodie take to arrive?", a: "UK orders typically arrive in 5–8 business days. US orders take 7–12 business days. Express options are available at checkout." },
      { q: "Can I see the hoodie design before I pay?", a: "Yes — that's what makes Keepsy different. You see your personalised design applied to the hoodie before you place your order." },
      { q: "Are personalised hoodies good gifts?", a: "Personalised hoodies are consistently one of the most-loved gifts because they combine practicality with a deeply personal touch. A hoodie with a design made just for someone shows real thought and effort." },
    ],
  },
  mug: {
    aboutTitle: "About Our Personalised Mugs",
    about: "Our personalised mugs are made from quality white ceramic with a glossy finish that holds vivid colour beautifully. Your design is printed on both sides, so it looks great from every angle. Every custom mug is unique — you describe your design or upload a photo, see it on the mug before ordering, and receive a one-of-a-kind gift that will make someone smile every morning. Personalised mugs from Keepsy are dishwasher safe and microwave friendly, making them practical as well as meaningful.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us what you'd like on your personalised mug — a pet portrait, a family photo, a meaningful design — or upload a photo directly." },
      { title: "Preview your design", description: "See how your custom mug design looks in real life before you order. Make changes until it's exactly right." },
      { title: "We print and ship", description: "Your personalised ceramic mug is printed with a durable, dishwasher-safe process and shipped to the UK or US." },
    ],
    perfectFor: ["Mother's Day", "Father's Day", "Birthdays", "Christmas", "Teacher gifts", "Office gifts", "Baby showers", "Anniversaries"],
    faqs: [
      { q: "Are personalised mugs dishwasher safe?", a: "Yes, our personalised mugs are dishwasher safe. We recommend placing them on the top rack to extend the life of the print." },
      { q: "What size are your personalised mugs?", a: "Our personalised mugs are the standard 11oz size — the most popular mug size in the UK and US." },
      { q: "Can I put a photo on a mug?", a: "Yes — you can upload a photo and our AI will turn it into a personalised design for your mug. You preview the result before ordering." },
      { q: "How quickly does a personalised mug arrive?", a: "UK personalised mugs typically arrive in 5–8 business days. US orders take 7–12 business days." },
      { q: "What makes a good personalised mug gift?", a: "The best personalised mugs feature something the recipient loves — their pet, a favourite place, a meaningful date, or a family photo. Because Keepsy lets you preview the design, you can make sure it's perfect before ordering." },
    ],
  },
  tee: {
    aboutTitle: "About Our Personalised T-Shirts",
    about: "Our personalised t-shirts are made from heavyweight 100% cotton with a relaxed, lived-in feel that gets better with every wash. Pre-shrunk so it stays true to size. Every design starts with your description or photo — our AI creates a unique artwork, you preview it on the actual shirt, then we print and ship it. Unlike anything you'd find in a shop, a personalised tee from Keepsy is a one-of-a-kind piece that exists nowhere else in the world.",
    howItWorks: [
      { title: "Describe or upload", description: "Tell us the design you want on your personalised t-shirt, or upload a photo. Our AI generates a unique design in seconds." },
      { title: "Preview on the tee", description: "See your custom design on the actual t-shirt before ordering. Adjust it until you're completely happy." },
      { title: "Printed and shipped", description: "Your personalised tee is printed using premium direct-to-garment (DTG) technology and shipped to your door." },
    ],
    perfectFor: ["Birthdays", "Hen parties", "Stag dos", "Sports teams", "Christmas gifts", "Father's Day", "Family reunions"],
    faqs: [
      { q: "How do I wash a personalised t-shirt?", a: "Wash inside out on a gentle cool cycle (30°C). Avoid tumble drying at high heat. This preserves the print and keeps colours vivid." },
      { q: "What sizes do personalised t-shirts come in?", a: "Our personalised t-shirts are available in sizes XS to 3XL. Size guides are available on the product page." },
      { q: "How long does a personalised t-shirt take to arrive?", a: "UK orders arrive in 5–8 business days. US orders take 7–12 business days. Express shipping is available at checkout." },
      { q: "Is the print on personalised t-shirts long lasting?", a: "Yes — we use premium direct-to-garment (DTG) printing which produces soft, breathable prints that are designed to last for years with proper care." },
      { q: "Can I get matching personalised t-shirts for a group?", a: "Yes — you can order multiple sizes of the same design for hen parties, stag dos, sports teams, or family events. Each person can get the same custom design in their size." },
    ],
  },
  card: {
    aboutTitle: "About Our Personalised Greeting Cards",
    about: "A personalised card from Keepsy is far from an ordinary card from the shops. Choose a fine art postcard on thick 280gsm giclée paper with a glossy finish, or a pack of 7 beautifully printed portrait cards on bright white matte paper — each with a craft envelope included. You describe your design or upload a photo, our AI creates a bespoke illustration, and you see it on the card before ordering. Perfect for birthdays, Mother's Day, Father's Day, weddings, anniversaries, and any occasion where you want to say something truly meaningful.",
    howItWorks: [
      { title: "Describe your card", description: "Tell us what you'd like on your personalised greeting card — an illustration, a portrait, a meaningful scene — or upload a photo." },
      { title: "See it before you send", description: "Preview your bespoke card design before ordering. Make it exactly right." },
      { title: "Printed and posted", description: "Your personalised card is printed on premium cardstock and shipped to you in the UK or US." },
    ],
    perfectFor: ["Birthdays", "Mother's Day", "Father's Day", "Weddings", "Baby showers", "Anniversaries", "Christmas", "Thank you cards", "Valentine's Day"],
    faqs: [
      { q: "What size are your personalised greeting cards?", a: "Our personalised greeting cards are A5 size (148mm × 210mm), printed on premium heavyweight cardstock with a high-quality finish." },
      { q: "Do personalised cards come with envelopes?", a: "Yes, all our personalised greeting cards include a matching envelope." },
      { q: "How quickly can I get a personalised birthday card?", a: "UK orders typically arrive in 5–8 business days. For urgent orders, express shipping is available at checkout." },
      { q: "Can I write a message inside the card?", a: "The card is printed with your design on the front. The inside is blank so you can write your personal message by hand — making it even more special." },
      { q: "Are personalised cards better than shop-bought cards?", a: "A personalised card from Keepsy features a completely unique design created just for the recipient — it's not something you could find in any shop. That makes it significantly more meaningful than a generic card, and at £6.99, it's still very affordable." },
    ],
  },
  canvas: {
    aboutTitle: "About Our Personalised Canvas Prints",
    about: "A personalised canvas print from Keepsy transforms a photo, a place, a memory, or an idea into gallery-quality wall art that lasts for decades. You describe your vision or upload a photo, our AI generates a unique design, and you see it on the canvas before ordering. Printed on premium artist-grade canvas with vivid, UV-resistant inks and stretched on a solid wooden frame, our canvas prints are a gift that truly stands out. Personalised canvas prints are an especially popular choice for weddings, anniversaries, new homes, and milestone birthdays. Ships to UK and US from £29.99.",
    howItWorks: [
      { title: "Describe your design", description: "Tell us what you want on your personalised canvas — a favourite place, a pet portrait, a family scene — or upload a photo." },
      { title: "Preview before you order", description: "See exactly how your design will look on the canvas print before committing to purchase." },
      { title: "Gallery quality, delivered", description: "Your personalised canvas is printed on premium artist-grade canvas and shipped ready to hang." },
    ],
    perfectFor: ["Weddings", "Anniversaries", "New homes", "Milestone birthdays", "Mother's Day", "Father's Day", "Christmas", "Memorial gifts"],
    faqs: [
      { q: "What size are your personalised canvas prints?", a: "Our personalised canvas prints come in a standard size that works beautifully on any wall. The canvas is stretched on a solid wooden frame and arrives ready to hang." },
      { q: "How long do canvas prints last?", a: "Our personalised canvas prints are made with UV-resistant inks on artist-grade canvas, designed to maintain vivid colour for 75+ years without fading when kept out of direct sunlight." },
      { q: "Are personalised canvas prints a good wedding gift?", a: "Personalised canvas prints are one of the most popular wedding gifts — a bespoke design of the couple's favourite place, wedding venue, or a meaningful illustration makes a gift they'll display for a lifetime." },
      { q: "How is the canvas shipped?", a: "Canvas prints are carefully packaged to prevent damage during transit and shipped with a tracking number. UK delivery takes 5–8 business days, US delivery 7–12 business days." },
      { q: "Can I upload a photo for a canvas print?", a: "Yes — you can upload a photo and our AI will create a unique artistic interpretation for your canvas, or use the photo directly. You preview the result before ordering." },
    ],
  },
};

function buildBreadcrumbJsonLd(type: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://keepsy.store" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "https://keepsy.store/shop" },
      { "@type": "ListItem", position: 3, name, item: `https://keepsy.store/product/${type}` },
    ],
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { type } = await params;
  const product = PRODUCT_CARDS.find((item) => item.type === type);
  if (!product) return notFound();

  const meta = PRODUCT_META[type] ?? {
    name: `Personalised ${product.name}`,
    price: product.price.toFixed(2),
    image: "",
  };

  const description =
    PRODUCT_DESCRIPTIONS[type] ??
    `A personalised ${product.name.toLowerCase()} made to order at Keepsy.`;

  const productSchema = buildProductJsonLd(type, meta.name, description, meta.price, meta.image);
  const breadcrumbSchema = buildBreadcrumbJsonLd(type, meta.name);

  const content = PRODUCT_CONTENT[type as keyof typeof PRODUCT_CONTENT];

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductPreviewClient key={type} initialSlug={type} />
      {content && (
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">
          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-charcoal mb-6">How It Works</h2>
            <ol className="space-y-4">
              {content.howItWorks.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5EDE0] flex items-center justify-center text-sm font-black text-charcoal">{i + 1}</span>
                  <div>
                    <p className="font-bold text-charcoal">{step.title}</p>
                    <p className="text-charcoal/60 text-sm mt-0.5">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Product Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-charcoal mb-4">{content.aboutTitle}</h2>
            <p className="text-charcoal/70 leading-relaxed">{content.about}</p>
          </section>

          {/* Perfect For */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-charcoal mb-4">Perfect For</h2>
            <ul className="flex flex-wrap gap-2">
              {content.perfectFor.map((occasion) => (
                <li key={occasion} className="rounded-full border border-charcoal/15 px-4 py-1.5 text-sm font-semibold text-charcoal/70">{occasion}</li>
              ))}
            </ul>
          </section>

          {/* Delivery */}
          <section className="mb-12 rounded-2xl bg-[#F5EDE0] p-4 sm:p-6">
            <h2 className="text-xl font-black text-charcoal mb-3">Delivery Information</h2>
            <ul className="space-y-2 text-sm text-charcoal/70">
              <li>✓ UK standard delivery: 5–8 business days</li>
              <li>✓ US delivery: 7–12 business days</li>
              <li>✓ Free shipping on orders over £75 (UK) / $75 (US)</li>
              <li>✓ 30-day returns on all orders</li>
              <li>✓ Order tracking included with every shipment</li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-black text-charcoal mb-6">Common Questions</h2>
            <div className="space-y-6">
              {content.faqs.map((faq, i) => (
                <div key={i} className="border-b border-charcoal/10 pb-6">
                  <h3 className="font-bold text-charcoal mb-2">{faq.q}</h3>
                  <p className="text-charcoal/65 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related links */}
          <section>
            <h2 className="text-xl font-black text-charcoal mb-4">Explore More</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="/create" className="w-full rounded-xl px-5 py-2.5 text-center text-sm font-bold text-white sm:w-auto" style={{backgroundColor: "var(--color-terracotta, #C4714A)"}}>Design yours now</a>
              <a href="/shop" className="w-full rounded-xl border border-charcoal/15 px-5 py-2.5 text-center text-sm font-bold text-charcoal hover:bg-[#F5EDE0] sm:w-auto">Browse all products</a>
              <a href="/gift-ideas" className="w-full rounded-xl border border-charcoal/15 px-5 py-2.5 text-center text-sm font-bold text-charcoal hover:bg-[#F5EDE0] sm:w-auto">Gift ideas by occasion</a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
