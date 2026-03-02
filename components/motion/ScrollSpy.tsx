"use client";

import { useScrollSpy } from "@/lib/motion/useScrollSpy";

type ScrollSpyProps = {
  sectionIds: string[];
  render: (activeId: string | null) => React.ReactNode;
};

export function ScrollSpy({ sectionIds, render }: ScrollSpyProps) {
  const activeId = useScrollSpy(sectionIds);
  return <>{render(activeId)}</>;
}
