import { useEffect } from "react";

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === "undefined") return;

    const body = document.body;
    const html = document.documentElement;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const previousTouchAction = body.style.touchAction;
    const scrollBarWidth = window.innerWidth - html.clientWidth;

    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      body.style.touchAction = previousTouchAction;
    };
  }, [locked]);
}
