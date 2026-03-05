"use client";

import { usePathname } from "next/navigation";
import { RingCursor } from "@/components/ui/RingCursor";

/** Ring cursor + other premium effects. Only on create/landing. */
export function PremiumEffects() {
  const pathname = usePathname();
  const isCreate = pathname.startsWith("/create");
  const isLanding = pathname === "/";

  if (!isCreate && !isLanding) return null;

  return (
    <>
      <RingCursor />
    </>
  );
}
