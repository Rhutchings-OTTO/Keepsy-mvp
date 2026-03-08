import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for purchasing from Keepsy, including your statutory consumer rights.",
};

const LAST_UPDATED = "8 March 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="mb-12 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-70"
        style={{ color: "var(--color-terracotta)" }}
      >
        ← Back to Keepsy
      </Link>

      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--color-terracotta)" }}>
          The Fine Print
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-xs" style={{ color: "rgba(45,41,38,0.45)" }}>
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          Please read these Terms and Conditions carefully before placing an order. By completing a purchase, you agree to be bound by these terms.
        </p>

        <div className="mt-10 space-y-10 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>

          {/* 1. About Us */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>1. About Us</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              These terms and conditions govern your use of keepsy.store and any purchase you make from Keepsy ("we", "us", "our"). For enquiries, please contact us at{" "}
              <a href="mailto:support@keepsy.store" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.store
              </a>.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>2. Eligibility</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              By placing an order, you confirm that you are at least 18 years of age and have the legal capacity to enter into a binding contract. If you are under 18, you may only use this site with the involvement and consent of a parent or guardian who agrees to these terms.
            </p>
          </section>

          {/* 3. How the Contract is Formed */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>3. How Your Contract with Us is Formed</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Browsing our website and placing items in your cart does not constitute a contract. A legally binding contract between you and Keepsy is formed when we send you an order confirmation email. We reserve the right to decline or cancel any order before confirmation — for example, if a product is unavailable, there is an error in the price or description, or we are unable to verify payment.
            </p>
          </section>

          {/* 4. Prices and Payment */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>4. Prices and Payment</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              All prices are displayed in GBP (British Pounds) for UK customers and USD for US customers. The total price including any applicable shipping costs will be shown before you complete payment. Payments are processed securely by Stripe. Your card details are handled directly by Stripe and never stored or accessed by Keepsy.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We reserve the right to correct pricing errors. If we discover a pricing error after your order is confirmed, we will contact you and give you the choice to proceed at the correct price or cancel for a full refund.
            </p>
          </section>

          {/* 5. Personalised Goods — Important Notice */}
          <section className="rounded-2xl border p-6" style={{ borderColor: "rgba(196,113,74,0.25)", backgroundColor: "rgba(196,113,74,0.04)" }}>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>5. Personalised Goods — Important Notice Before You Order</h2>
            <p className="mt-3 text-sm leading-7 font-medium" style={{ color: "rgba(45,41,38,0.85)" }}>
              All Keepsy products are made to order and are clearly personalised to your individual specifications (including your uploaded photos, custom prompts, chosen colours, and sizes). Because of this:
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Under Regulation 28(1)(b) of the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, the 14-day right to cancel that normally applies to distance sales does <strong style={{ color: "var(--color-charcoal)" }}>not apply</strong> to goods that are made to a consumer&apos;s specifications or are clearly personalised.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              This means that once your order is confirmed and production has begun, you cannot cancel it solely because you have changed your mind. We draw this to your attention before you complete your purchase, as required by Regulation 28(3).
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <strong style={{ color: "var(--color-charcoal)" }}>Your statutory rights for defective or damaged goods are not affected.</strong> Please see our{" "}
              <Link href="/refunds" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                Refund Policy
              </Link>{" "}
              for full details.
            </p>
          </section>

          {/* 6. Production and Delivery */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>6. Production and Delivery</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Standard production time is 2–4 business days. Estimated delivery times after dispatch are 2–3 business days for UK orders and 3–6 business days for US orders. These are estimates and not guaranteed delivery dates.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We are not liable for delivery delays caused by the carrier, customs, extreme weather, or other events outside our reasonable control. For full shipping details, please see our{" "}
              <Link href="/shipping" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                Shipping Policy
              </Link>.
            </p>
          </section>

          {/* 7. Defective / Damaged Goods */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>7. Defective or Damaged Goods</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose, and as described. If your order arrives damaged, mispriinted, or otherwise defective, you have the right to a repair, replacement, or refund. Please contact us within 30 days of delivery with photo evidence at{" "}
              <a href="mailto:support@keepsy.store" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.store
              </a>.
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>8. Intellectual Property and AI-Generated Designs</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Designs generated on Keepsy using our AI tools are created by you using our platform. To the extent that copyright or other intellectual property rights subsist in AI-generated outputs under applicable law, those rights belong to you as the person who directed the creative process.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              By placing an order, you grant Keepsy a non-exclusive licence to reproduce and print your design solely for the purpose of fulfilling your order.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              The Keepsy name, logo, website design, and all other brand elements are the intellectual property of Keepsy and may not be copied or used without our express written permission.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Note: The legal status of AI-generated works under UK copyright law is an evolving area. We cannot guarantee that AI-generated designs will be afforded full copyright protection.
            </p>
          </section>

          {/* 9. Acceptable Use */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>9. Acceptable Use / Content Policy</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              By uploading content or entering prompts on our platform, you confirm that:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>• You own or have the necessary rights to use any photos or other content you upload</li>
              <li>• Your content does not infringe any third-party copyright, trade mark, or other intellectual property rights</li>
              <li>• Your content does not contain illegal material, including images of child sexual abuse, incitement to violence, hate speech, or content that violates any applicable law</li>
              <li>• Your content does not reproduce recognisable third-party brand logos, characters, or trademarks without authorisation</li>
              <li>• You will not attempt to circumvent our content moderation systems</li>
            </ul>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We reserve the right to refuse, cancel, or remove any order or content that violates this policy. Keepsy is not liable for any third-party claims arising from your uploaded content.
            </p>
          </section>

          {/* 10. IP Infringement / Takedown */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>10. Intellectual Property Infringement Notifications</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              If you believe that content on our platform infringes your intellectual property rights, please notify us at{" "}
              <a href="mailto:privacy@keepsy.co" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                privacy@keepsy.co
              </a>{" "}
              with the subject line &quot;IP Infringement Notice.&quot; Please include: a description of the allegedly infringing content and its location on our site, your contact details, a statement that you have a good faith belief that the use is not authorised, and a statement under penalty of perjury that the information is accurate and that you are the rights holder or authorised to act on their behalf.
            </p>
          </section>

          {/* 11. Liability */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>11. Our Liability</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Nothing in these terms limits or excludes our liability for: death or personal injury caused by our negligence; fraud or fraudulent misrepresentation; any liability that cannot be limited or excluded by law.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Subject to the above, our total liability to you in connection with any order shall not exceed the total amount paid by you for that order.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We are not liable for indirect, consequential, or special losses, including loss of profit, loss of data, or loss of goodwill.
            </p>
            <p className="mt-3 text-sm leading-7 font-semibold" style={{ color: "rgba(45,41,38,0.80)" }}>
              Your statutory rights under the Consumer Rights Act 2015 and other applicable UK consumer protection legislation are not affected by these terms.
            </p>
          </section>

          {/* 12. Dispute Resolution */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>12. Dispute Resolution</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              If you have a dispute with us, please contact us first at{" "}
              <a href="mailto:support@keepsy.store" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.store
              </a>{" "}
              — we aim to resolve all complaints within 5 business days.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              If we cannot resolve your complaint, you may refer it to an approved Alternative Dispute Resolution (ADR) provider. The European Commission&apos;s Online Dispute Resolution platform is available at{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                ec.europa.eu/consumers/odr
              </a>.
            </p>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>13. Governing Law</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              These terms are governed by the laws of England and Wales. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales, except that consumers in Scotland, Northern Ireland, or other jurisdictions retain the right to bring proceedings in their local courts.
            </p>
          </section>

          {/* 14. Changes */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>14. Changes to These Terms</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We may update these terms from time to time. The current version will always be published on this page with the &quot;Last updated&quot; date. Changes do not affect orders already confirmed before the change takes effect.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "rgba(255,255,255,0.50)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-charcoal)" }}>Contact Us</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
              For questions about these terms, email us at{" "}
              <a href="mailto:support@keepsy.store" className="font-semibold underline underline-offset-2 hover:opacity-70" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.store
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
