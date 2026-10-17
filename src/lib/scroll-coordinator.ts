export type ScrollDirection = "up" | "down";

export interface ScrollSnapshot {
  y: number;
  direction: ScrollDirection | null;
}

type ScrollListener = (snapshot: ScrollSnapshot) => void;

const listeners = new Set<ScrollListener>();
let installed = false;
let frame = 0;
let lastY = 0;
let direction: ScrollDirection | null = null;

function publishScroll() {
  frame = 0;
  const y = Math.max(0, window.scrollY);
  const delta = y - lastY;
  if (Math.abs(delta) >= 4) {
    direction = delta > 0 ? "down" : "up";
    lastY = y;
  }

  const snapshot = { y, direction };
  for (const listener of listeners) listener(snapshot);
}

function onScroll() {
  if (frame) return;
  frame = window.requestAnimationFrame(publishScroll);
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  lastY = Math.max(0, window.scrollY);
  window.addEventListener("scroll", onScroll, { passive: true });
}

function uninstall() {
  if (!installed || typeof window === "undefined") return;
  installed = false;
  window.removeEventListener("scroll", onScroll);
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
}

/** Shares one passive native listener and one animation frame among all consumers. */
export function subscribeToScroll(listener: ScrollListener) {
  if (typeof window === "undefined") return () => {};

  listeners.add(listener);
  install();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) uninstall();
  };
}
