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
      className="rounded-2xl border border-[#E7DBCF] bg-white/85 p-3 sm:p-4"
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 rounded-xl bg-[#FCF8F3] px-3 py-2 text-sm text-[#5A4634]">
            <Icon className="h-4 w-4 text-[#7C644E]" aria-hidden="true" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustBarComponent;
export { TrustBarComponent as TrustBar };
