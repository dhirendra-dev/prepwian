import { useEffect, useRef } from "react";

import { subscribeToScroll } from "@/lib/scroll-coordinator";

/**
 * Tracks meaningful window-scroll direction on an element without React state
 * updates. All consumers share one passive listener and one animation frame.
 */
export function useScrollDirection<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof window === "undefined") return;

    element.dataset.scrollPosition = window.scrollY > 4 ? "scrolled" : "top";
    return subscribeToScroll(({ y, direction }) => {
      const position = y > 4 ? "scrolled" : "top";
      if (element.dataset.scrollPosition !== position) {
        element.dataset.scrollPosition = position;
      }
      if (direction && element.dataset.scrollDirection !== direction) {
        element.dataset.scrollDirection = direction;
      }
    });
  }, []);

  return elementRef;
}
