import { useEffect } from "react";

/**
 * Drives the beta skin's ambient light field from pointer position.
 * It is deliberately browser-only and disabled for touch/reduced-motion users.
 */
export function IOS27SpatialLight() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    let frame = 0;
    let x = 0.5;
    let y = 0.18;

    const paint = () => {
      frame = 0;
      root.style.setProperty("--ios27-pointer-x", `${x * 100}%`);
      root.style.setProperty("--ios27-pointer-y", `${y * 100}%`);
    };

    const onPointerMove = (event: PointerEvent) => {
      x = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
      y = Math.min(1, Math.max(0, event.clientY / window.innerHeight));
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onPointerLeave = () => {
      x = 0.5;
      y = 0.18;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--ios27-pointer-x");
      root.style.removeProperty("--ios27-pointer-y");
    };
  }, []);

  return null;
}
