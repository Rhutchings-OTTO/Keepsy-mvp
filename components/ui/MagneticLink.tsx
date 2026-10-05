"use client";

import React from "react";
import Link from "next/link";

type MagneticLinkProps = React.ComponentProps<typeof Link> & {
  children: React.ReactNode;
  /** Kept for API compatibility; no magnetic effect is applied. */
  strength?: number;
  /** Kept for API compatibility; no magnetic effect is applied. */
  radius?: number;
};

/** Plain Next link (historical name). No hover lift or magnetic pull. */
export function MagneticLink({
  children,
  className = "",
  strength,
  radius,
  ...props
}: MagneticLinkProps) {
  void strength;
  void radius;
  return (
    <Link className={className} {...props}>
      {children}
    </Link>
  );
}
