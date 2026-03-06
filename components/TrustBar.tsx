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
      className="rounded-[1.5rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,244,238,0.88))] p-3 shadow-warm-sm backdrop-blur-sm sm:p-4"
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
