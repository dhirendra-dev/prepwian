import { useEffect } from "react";

import { subscribeToScroll } from "@/lib/scroll-coordinator";

const REVEAL_SELECTOR =
  "main > section, main > article, .community-feed-post, .community-doubt-card, .community-chat-message, [data-motion-reveal='true'], [data-motion-stagger-item='true']";
const MOTION_EXCLUSIONS =
  '[data-motion="none"], [data-motion-reveal="false"], [role="dialog"], [role="alertdialog"], [data-radix-portal], [data-scroll-header="true"]';

function isMotionExcluded(element: Element) {
  return (
    element.closest(MOTION_EXCLUSIONS) !== null ||
    window.location.pathname.startsWith("/tests/attempt/")
  );
}

/** One observer reveals meaningful page sections/cards without per-element scroll handlers. */
export function SiteMotion() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    let resetTimer = 0;
    let isScrolling = false;
    const unsubscribeFromScroll = subscribeToScroll(() => {
      if (!isScrolling) {
        isScrolling = true;
        root.classList.add("is-scrolling");
      }
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        isScrolling = false;
        root.classList.remove("is-scrolling");
      }, 120);
    });

    const cleanupScrollListener = () => {
      unsubscribeFromScroll();
      window.clearTimeout(resetTimer);
      root.classList.remove("is-scrolling");
    };

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return cleanupScrollListener;
    }

    const observedTargets = new WeakSet<Element>();
    const preparedStaggerContainers = new WeakSet<Element>();
    const visibleObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("motion-revealed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    const markStaggeredChild = (container: Element, child: Element, index: number) => {
      if (
        child.getAttribute("data-motion-reveal") === "false" ||
        child.hasAttribute("data-motion-stagger-item") ||
        isMotionExcluded(child)
      ) {
        return;
      }

      const rawStep = Number(container.getAttribute("data-motion-stagger"));
      const step = Number.isFinite(rawStep) ? Math.min(80, Math.max(0, rawStep)) : 32;
      const mobileStep = window.innerWidth <= 640 ? Math.min(step, 28) * 0.65 : step;

      child.setAttribute("data-motion-reveal", "true");
      child.setAttribute("data-motion-stagger-item", "true");
      if (!child.hasAttribute("data-motion-variant")) {
        child.setAttribute("data-motion-variant", "fade-up");
      }
      if (child instanceof HTMLElement) {
        child.style.setProperty(
          "--motion-item-delay",
          `${Math.round(Math.min(index, 5) * mobileStep)}ms`,
        );
      }
    };

    const prepareStaggerContainer = (container: Element) => {
      if (preparedStaggerContainers.has(container)) return;
      preparedStaggerContainers.add(container);
      Array.from(container.children).forEach((child, index) =>
        markStaggeredChild(container, child, index),
      );
    };

    const observeTarget = (element: Element) => {
      if (
        observedTargets.has(element) ||
        element.classList.contains("motion-revealed") ||
        isMotionExcluded(element)
      ) {
        return;
      }

      // IntersectionObserver reports already-visible targets before paint and
      // avoids a synchronous layout read for every element in a new subtree.
      element.classList.add("motion-reveal");
      observedTargets.add(element);
      visibleObserver.observe(element);
    };

    const observeTree = (parent: ParentNode) => {
      if (parent instanceof Element && parent.matches("[data-motion-stagger]")) {
        prepareStaggerContainer(parent);
      }
      for (const container of parent.querySelectorAll("[data-motion-stagger]")) {
        prepareStaggerContainer(container);
      }

      if (parent instanceof Element && parent.matches(REVEAL_SELECTOR)) observeTarget(parent);
      for (const element of parent.querySelectorAll(REVEAL_SELECTOR)) observeTarget(element);
    };

    root.classList.add("has-motion-system");
    observeTree(document);

    const pendingTrees = new Set<Element>();
    const pendingStaggerChildren = new Map<Element, Set<Element>>();
    let mutationFrame = 0;

    const flushMutations = () => {
      mutationFrame = 0;
      for (const [container, newChildren] of pendingStaggerChildren) {
        const positions = new Map(
          Array.from(container.children, (child, index) => [child, index] as const),
        );
        for (const child of newChildren) {
          const index = positions.get(child);
          if (index !== undefined) markStaggeredChild(container, child, index);
        }
      }
      pendingStaggerChildren.clear();

      const addedTrees = Array.from(pendingTrees);
      const addedTreeSet = new Set(addedTrees);
      pendingTrees.clear();
      for (const tree of addedTrees) {
        let ancestor = tree.parentElement;
        let coveredByAddedAncestor = false;
        while (ancestor) {
          if (addedTreeSet.has(ancestor)) {
            coveredByAddedAncestor = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (!coveredByAddedAncestor && tree.isConnected) observeTree(tree);
      }
    };

    const contentObserver = new MutationObserver((records) => {
      for (const record of records) {
        const parent = record.target instanceof Element ? record.target : null;
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          pendingTrees.add(node);
          if (parent?.matches("[data-motion-stagger]")) {
            let children = pendingStaggerChildren.get(parent);
            if (!children) {
              children = new Set<Element>();
              pendingStaggerChildren.set(parent, children);
            }
            children.add(node);
          }
        }
      }
      if (pendingTrees.size > 0 && !mutationFrame) {
        mutationFrame = window.requestAnimationFrame(flushMutations);
      }
    });
    contentObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      cleanupScrollListener();
      contentObserver.disconnect();
      if (mutationFrame) window.cancelAnimationFrame(mutationFrame);
      visibleObserver.disconnect();
      root.classList.remove("has-motion-system");
    };
  }, []);

  return null;
}
