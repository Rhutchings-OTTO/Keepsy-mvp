import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | Keepsy",
  description: "How Keepsy uses cookies and similar technologies on our website.",
};

const LAST_UPDATED = "8 March 2026";

export default function CookiesPage() {
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
          Transparency
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Cookie Policy
        </h1>
        <p className="mt-2 text-xs" style={{ color: "rgba(45,41,38,0.45)" }}>
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          This Cookie Policy explains what cookies are, which cookies Keepsy uses, and how you can control them.
        </p>

        <div className="mt-10 space-y-10 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>

          {/* What are cookies */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>What Are Cookies?</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work, to improve performance, and to provide information to site owners.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Similar technologies such as local storage (a browser feature that stores data locally on your device) work in a comparable way and are covered by this policy.
            </p>
          </section>

          {/* Legal basis */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Legal Basis</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Our use of cookies is governed by the Privacy and Electronic Communications Regulations (PECR) 2003 and UK GDPR. We only set strictly necessary cookies without your prior consent. If we add any non-essential cookies (such as analytics or marketing cookies) in the future, we will obtain your consent first via a cookie consent banner.
            </p>
          </section>

          {/* Cookies we use */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Cookies and Local Storage We Currently Use</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Keepsy currently uses only strictly necessary cookies and local storage entries:
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-charcoal)" }}>keepsy_region</p>
                    <p className="mt-1 text-xs leading-6" style={{ color: "rgba(45,41,38,0.65)" }}>
                      Stores your region preference (UK or US) to display the correct currency and pricing. Set as both a cookie and in local storage as a fallback.
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(44,74,62,0.10)", color: "var(--color-forest)" }}>
                      Strictly Necessary
                    </span>
                    <p className="mt-1 text-xs" style={{ color: "rgba(45,41,38,0.50)" }}>12 months</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-charcoal)" }}>cookie_notice_dismissed</p>
                    <p className="mt-1 text-xs leading-6" style={{ color: "rgba(45,41,38,0.65)" }}>
                      Records that you have seen and dismissed the cookie notice, so we do not show it to you repeatedly.
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(44,74,62,0.10)", color: "var(--color-forest)" }}>
                      Strictly Necessary
                    </span>
                    <p className="mt-1 text-xs" style={{ color: "rgba(45,41,38,0.50)" }}>12 months</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-charcoal)" }}>Stripe cookies</p>
                    <p className="mt-1 text-xs leading-6" style={{ color: "rgba(45,41,38,0.65)" }}>
                      When you proceed to checkout, Stripe (our payment processor) may set cookies on its own domain (stripe.com) for fraud prevention and payment security purposes. These are set by Stripe directly and governed by{" "}
                      <a href="https://stripe.com/gb/cookie-settings" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-terracotta)" }}>
                        Stripe&apos;s Cookie Settings
                      </a>.
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(44,74,62,0.10)", color: "var(--color-forest)" }}>
                      Strictly Necessary
                    </span>
                    <p className="mt-1 text-xs" style={{ color: "rgba(45,41,38,0.50)" }}>Session / Stripe-defined</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "rgba(245,237,224,0.5)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>Analytics and Marketing Cookies</p>
              <p className="mt-1 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
                We do not currently use any analytics cookies (e.g., Google Analytics) or marketing/tracking cookies. If we add such cookies in the future, we will update this policy and ask for your consent before setting them.
              </p>
            </div>
          </section>

          {/* How to control */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>How to Control and Delete Cookies</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              You can control and delete cookies using your browser settings. Instructions for the most common browsers:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Chrome:</span>{" "}
                Settings &gt; Privacy and security &gt; Cookies and other site data
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Safari:</span>{" "}
                Preferences &gt; Privacy &gt; Manage Website Data
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Firefox:</span>{" "}
                Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Edge:</span>{" "}
                Settings &gt; Cookies and site permissions
              </li>
            </ul>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Please note that deleting or blocking the region preference cookie may mean the site does not display the correct currency for your location. Blocking Stripe&apos;s cookies may prevent the checkout from functioning correctly.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              For more information about cookies and how to manage them, visit{" "}
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                allaboutcookies.org
              </a>{" "}
              or the{" "}
              <a href="https://ico.org.uk/for-the-public/online/cookies/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                ICO&apos;s guide to cookies
              </a>.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Changes to This Policy</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              We will update this Cookie Policy if we change the cookies we use. We recommend checking this page periodically for updates.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "rgba(255,255,255,0.50)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-charcoal)" }}>Questions?</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
              For any questions about our use of cookies, contact us at{" "}
              <a href="mailto:privacy@keepsy.co" className="font-semibold underline underline-offset-2 hover:opacity-70" style={{ color: "var(--color-terracotta)" }}>
                privacy@keepsy.co
              </a>.
            </p>
            <p className="mt-2 text-sm" style={{ color: "rgba(45,41,38,0.70)" }}>
              Also see our{" "}
              <Link href="/privacy" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                Privacy Policy
              </Link>{" "}
              for full information on how we handle your personal data.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
