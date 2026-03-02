"use client";

import { useEffect, useState } from "react";

export function useScrollSpy(
  sectionIds: string[],
  options?: { rootMargin?: string; threshold?: number }
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || sectionIds.length === 0) return;

    const rootMargin = options?.rootMargin ?? "-20% 0px -70% 0px";
    const threshold = options?.threshold ?? 0;

    const observers: IntersectionObserver[] = [];
    const visibility: Record<string, number> = {};

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visibility[id] = entry.intersectionRatio;
          });
          const visible = Object.entries(visibility)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a);
          setActiveId(visible[0]?.[0] ?? null);
        },
        { rootMargin, threshold }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sectionIds.join(","), options?.rootMargin, options?.threshold]);

  return activeId;
}
