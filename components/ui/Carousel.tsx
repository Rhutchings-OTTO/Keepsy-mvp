"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type CarouselProps = {
  children: React.ReactNode[];
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
};

export function Carousel({ children, className = "", showArrows = true, showDots = true }: CarouselProps) {
  const reduceMotion = useReducedMotionPref();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const count = Array.isArray(children) ? children.length : 0;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, count]);

  const scrollToIndex = useCallback(
    (i: number) => {
      const el = scrollRef.current;
      if (!el || reduceMotion) return;
      const item = el.querySelector(`[data-carousel-index="${i}"]`);
      item?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setIndex(Math.max(0, Math.min(i, count - 1)));
    },
    [count, reduceMotion]
  );

  const handlePrev = () => scrollToIndex(Math.max(0, index - 1));
  const handleNext = () => scrollToIndex(Math.min(count - 1, index + 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    else if (e.key === "ArrowRight") handleNext();
  };

  return (
    <div className={`relative ${className}`} onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Carousel">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          const i = Math.round(el.scrollLeft / (el.scrollWidth / count));
          setIndex(Math.max(0, Math.min(i, count - 1)));
        }}
      >
        {Array.isArray(children) &&
          children.map((child, i) => (
            <div
              key={i}
              data-carousel-index={i}
              className="min-w-[85%] flex-shrink-0 snap-center sm:min-w-[45%] lg:min-w-[30%]"
            >
              {child}
            </div>
          ))}
      </div>
      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canScrollLeft}
            aria-label="Previous slide"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white/90 p-2 shadow-md transition hover:bg-white disabled:opacity-30 disabled:hover:bg-white/90"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canScrollRight}
            aria-label="Next slide"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white/90 p-2 shadow-md transition hover:bg-white disabled:opacity-30 disabled:hover:bg-white/90"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
      {showDots && count > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition ${i === index ? "w-6 bg-black/70" : "w-2 bg-black/25 hover:bg-black/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
