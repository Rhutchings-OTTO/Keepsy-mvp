import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "How Keepsy handles your personal data and uploaded photos. Full GDPR-compliant disclosure.",
};

const LAST_UPDATED = "8 March 2026";

export default function PrivacyPage() {
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
          Your Privacy
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs" style={{ color: "rgba(45,41,38,0.45)" }}>
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          This policy explains how Keepsy ("we", "us", "our") collects, uses, and protects your personal data when you use our website and purchase products. We are committed to handling your information transparently and in accordance with UK GDPR and the Data Protection Act 2018.
        </p>

        <div className="mt-10 space-y-10 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>

          {/* 1. Data Controller */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>1. Who We Are (Data Controller)</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              The data controller responsible for your personal data is Keepsy (trading as Keepsy). Our contact email for all data privacy matters is{" "}
              <a href="mailto:privacy@keepsy.co" className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                privacy@keepsy.co
              </a>.
            </p>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              If you have a complaint about how we handle your data, you have the right to complain to the Information Commissioner&apos;s Office (ICO) at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                ico.org.uk
              </a>{" "}
              or by calling 0303 123 1113.
            </p>
          </section>

          {/* 2. What We Collect */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>2. What Personal Data We Collect</h2>
            <div className="mt-3 space-y-4 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>When you place an order:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Name and email address</li>
                  <li>• Delivery address (street, city, postcode, country)</li>
                  <li>• Payment information (processed directly by Stripe — we never see or store your card details)</li>
                  <li>• Order details (products, quantities, design specifications)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>When you use the AI design generator:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Photos and images you choose to upload</li>
                  <li>• Text prompts and design descriptions you enter</li>
                  <li>• Generated design images created during your session</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Automatically collected:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Region preference (UK or US) stored in a cookie and browser local storage</li>
                  <li>• Session data necessary for the website to function</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>If you subscribe to our mailing list:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Email address</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Lawful Basis */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>3. Lawful Basis for Processing</h2>
            <div className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <p>We process your personal data on the following legal bases under UK GDPR Article 6:</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Contract performance (Art. 6(1)(b))</p>
                  <p className="mt-1">Processing your name, address, email, and order details to fulfil your order, arrange delivery, and provide customer support.</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Legitimate interests (Art. 6(1)(f))</p>
                  <p className="mt-1">Processing session data and region preferences to provide a functional website experience. Sending transactional emails (order confirmations, dispatch notifications) to customers who have placed orders.</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Consent (Art. 6(1)(a))</p>
                  <p className="mt-1">Sending marketing emails to subscribers who have opted in. You may withdraw consent at any time by clicking &quot;Unsubscribe&quot; in any email or emailing privacy@keepsy.co.</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Legal obligation (Art. 6(1)(c))</p>
                  <p className="mt-1">Retaining financial records and order data to comply with tax and accounting obligations.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. How We Use Your Data */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>4. How We Use Your Data</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>• To process and fulfil your order and arrange delivery</li>
              <li>• To send order confirmation, dispatch, and tracking emails</li>
              <li>• To handle returns, refunds, and customer support queries</li>
              <li>• To generate AI designs using your uploaded photos and prompts (via OpenAI)</li>
              <li>• To maintain a secure session on our website</li>
              <li>• To send marketing emails if you have subscribed and consented</li>
              <li>• To comply with our legal and financial obligations</li>
            </ul>
            <p className="mt-4 text-sm leading-7 font-semibold" style={{ color: "rgba(45,41,38,0.75)" }}>
              We do not sell, rent, or share your personal data with third parties for their own marketing purposes.
            </p>
          </section>

          {/* 5. Third-Party Processors */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>5. Third-Party Data Processors</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We use the following third-party services to operate our business. Each acts as a data processor on our behalf and is subject to data processing agreements and their own privacy policies:
            </p>
            <div className="mt-4 space-y-3 text-sm" style={{ color: "rgba(45,41,38,0.75)" }}>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Stripe (Payment Processing)</p>
                <p className="mt-1">Processes your payment card data. Located in the USA. Stripe is certified under the UK-US Data Bridge. We never receive or store your card details. <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>Stripe Privacy Policy</a>.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>OpenAI (AI Design Generation)</p>
                <p className="mt-1">Receives your uploaded photos and text prompts to generate custom designs. Located in the USA. OpenAI is certified under the UK-US Data Bridge. Your photos are processed solely for the purpose of generating your requested design and are not used to train AI models (under the API terms). <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>OpenAI Privacy Policy</a>.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Printify (Print & Fulfilment)</p>
                <p className="mt-1">Receives your shipping address, product specifications, and design files to print and dispatch your order. Located in the USA and EU. <a href="https://printify.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>Printify Privacy Policy</a>.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Supabase (Database)</p>
                <p className="mt-1">Stores order records, session data, and design history. Located in the EU. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>Supabase Privacy Policy</a>.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Resend (Transactional Email)</p>
                <p className="mt-1">Sends order confirmation and dispatch notification emails. Receives your email address and order information for this purpose. Located in the USA. <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>Resend Privacy Policy</a>.</p>
              </div>
            </div>
          </section>

          {/* 6. International Transfers */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>6. International Data Transfers</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Some of our processors (Stripe, OpenAI, Resend, Printify) are based in the United States. When we transfer your personal data to the USA, we rely on the UK-US Data Bridge adequacy framework, Standard Contractual Clauses (UK IDTA addendum), or other appropriate safeguards as applicable. Details of the transfer mechanism for each processor are available in their respective privacy policies.
            </p>
          </section>

          {/* 7. Retention */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>7. How Long We Keep Your Data</h2>
            <div className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Order records</p>
                  <p className="mt-1">7 years (HMRC tax record requirement)</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Uploaded photos &amp; designs</p>
                  <p className="mt-1">90 days after order, then deleted unless you have saved them to your vault</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Marketing email list</p>
                  <p className="mt-1">Until you unsubscribe or withdraw consent</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                  <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Session / preference cookies</p>
                  <p className="mt-1">12 months from last visit</p>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>8. Your Rights Under UK GDPR</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              You have the following rights regarding your personal data. To exercise any of these rights, please email{" "}
              <a href="mailto:privacy@keepsy.co" className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                privacy@keepsy.co
              </a>. We will respond within one month.
            </p>
            <div className="mt-4 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right of access (Art. 15)</p>
                <p className="mt-1">Request a copy of the personal data we hold about you.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to rectification (Art. 16)</p>
                <p className="mt-1">Ask us to correct inaccurate or incomplete data.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to erasure (Art. 17)</p>
                <p className="mt-1">Ask us to delete your personal data. You can use the &quot;Delete My Data&quot; button on the Create page, or email us directly. Note: we may need to retain certain records for legal/financial compliance (e.g., order records for tax purposes).</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to restrict processing (Art. 18)</p>
                <p className="mt-1">Ask us to limit how we use your data in certain circumstances.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to data portability (Art. 20)</p>
                <p className="mt-1">Request your data in a structured, machine-readable format.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to object (Art. 21)</p>
                <p className="mt-1">Object to our processing of your data where we rely on legitimate interests, including for direct marketing.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to withdraw consent</p>
                <p className="mt-1">Where we process your data based on consent (e.g., marketing emails), you may withdraw consent at any time without affecting the lawfulness of prior processing.</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to lodge a complaint</p>
                <p className="mt-1">You have the right to complain to the ICO at <a href="https://ico.org.uk/concerns" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>ico.org.uk/concerns</a> or by calling 0303 123 1113.</p>
              </div>
            </div>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>9. Cookies</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We use a small number of cookies to make our website function. For full details of the cookies we set, their purpose, and how to manage them, please see our{" "}
              <Link href="/cookies" className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                Cookie Policy
              </Link>.
            </p>
          </section>

          {/* 10. Security */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>10. Security</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We implement appropriate technical and organisational measures to protect your personal data, including HTTPS encryption, secure API authentication, and access controls. Payment data is handled entirely by Stripe and never passes through our systems. In the event of a data breach that affects your rights and freedoms, we will notify the ICO within 72 hours and you directly where required.
            </p>
          </section>

          {/* 11. Changes */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>11. Changes to This Policy</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We may update this Privacy Policy from time to time. Material changes will be notified by updating the &quot;Last updated&quot; date at the top of this page. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "rgba(255,255,255,0.50)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-charcoal)" }}>Contact Us</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
              For any privacy-related questions or to exercise your rights, contact us at{" "}
              <a href="mailto:privacy@keepsy.co" className="font-semibold underline underline-offset-2 hover:opacity-70" style={{ color: "var(--color-terracotta)" }}>
                privacy@keepsy.co
              </a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
