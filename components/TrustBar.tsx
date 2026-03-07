"use client";

import { Heart, LockKeyhole, PackageCheck } from "lucide-react";

const ITEMS = [
  { icon: LockKeyhole, text: "Secure checkout" },
  { icon: PackageCheck, text: "Printed & shipped fast" },
  { icon: Heart, text: "Made to make someone smile" },
];

function TrustBarComponent() {
  return (
    <section
      aria-label="Trust highlights"
      className="rounded-2xl border border-charcoal/8 bg-white p-3 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-4"
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
            style={{ backgroundColor: "rgba(253,246,238,0.70)", color: "var(--color-charcoal)" }}
          >
            <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--color-terracotta)" }} aria-hidden="true" />
            <span className="font-medium">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustBarComponent;
export { TrustBarComponent as TrustBar };
