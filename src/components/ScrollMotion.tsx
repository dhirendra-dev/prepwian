import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

import { useScrollDirection } from "@/hooks/useScrollDirection";

export type ScrollRevealVariant = "fade-up" | "slide-up" | "scale-in" | "fade";

type MotionElementProps = HTMLAttributes<HTMLDivElement>;

/** Adds a semantic target to the shared IntersectionObserver reveal system. */
export function ScrollReveal({
  children,
  variant = "fade-up",
  ...props
}: MotionElementProps & { variant?: ScrollRevealVariant }) {
  return (
    <div {...props} data-motion-reveal="true" data-motion-variant={variant}>
      {children}
    </div>
  );
}

/** Reveals direct children in a short, capped sequence as they enter view. */
export function StaggerContainer({
  children,
  delayStep = 32,
  ...props
}: MotionElementProps & { delayStep?: number }) {
  const safeDelayStep = Number.isFinite(delayStep) ? Math.min(80, Math.max(0, delayStep)) : 32;

  return (
    <div {...props} data-motion-stagger={safeDelayStep}>
      {children}
    </div>
  );
}

/** Keeps the existing sticky header stable while exposing scroll state for polish. */
export function ScrollHeader({ children, ...props }: MotionElementProps & { children: ReactNode }) {
  const ref = useScrollDirection<HTMLDivElement>();

  return (
    <div {...props} ref={ref} data-scroll-header="true" data-motion="none">
      {children}
    </div>
  );
}

/** Shared route-entry transition; leaves content visible and native scrolling untouched. */
export function PageTransition({
  pathKey,
  disabled = false,
  children,
  ...props
}: MotionElementProps & { pathKey: string; disabled?: boolean }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const activeAnimation = useRef<Animation | null>(null);
  const previousPath = useRef(pathKey);

  useEffect(() => {
    const pathChanged = previousPath.current !== pathKey;
    previousPath.current = pathKey;
    if (!pathChanged || disabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const page = pageRef.current;
    if (!page || typeof page.animate !== "function") return;

    const root = document.documentElement;
    root.classList.add("route-transitioning");
    const isLargeDevice = window.matchMedia("(min-width: 768px)").matches;
    const animation = page.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(0, ${isLargeDevice ? 14 : 8}px, 0) scale(${isLargeDevice ? 0.99 : 0.995})`,
        },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      { duration: isLargeDevice ? 280 : 240, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" },
    );
    activeAnimation.current = animation;

    const clearAnimationState = () => {
      if (activeAnimation.current !== animation) return;
      activeAnimation.current = null;
      root.classList.remove("route-transitioning");
    };
    animation.finished.then(clearAnimationState, clearAnimationState);

    return () => {
      animation.cancel();
      clearAnimationState();
    };
  }, [disabled, pathKey]);

  return (
    <div {...props} ref={pageRef} data-route-content>
      {children}
    </div>
  );
}
