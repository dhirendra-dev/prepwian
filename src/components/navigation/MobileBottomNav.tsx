import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useBlocker, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, House, Search, BookOpen } from "lucide-react";
import { normalizePath, shouldShowMobileBottomNav } from "./mobileBottomNavRoutes";
import "./MobileBottomNav.css";

/** Single source of truth: edit tabs here only. */
const NAV_ITEMS = [
  {
    label: "Welcome",
    to: "/welcome",
    icon: House,
    match: (p: string) => p === "/" || p === "/welcome" || p === "/dashboard",
  },
  { label: "Search", to: "/searches", icon: Search, match: (p: string) => p === "/searches" },
  {
    label: "Articles",
    to: "/articles",
    icon: BookOpen,
    match: (p: string) => p === "/articles" || p.startsWith("/articles/"),
  },
] as const;

const BODY_CLASS = "has-mobile-glass-nav";

/** True while the on-screen keyboard is open for a text field. */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      setOpen(typing && window.innerHeight - vv.height > 150);
    };

    vv.addEventListener("resize", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);
    return () => {
      vv.removeEventListener("resize", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
    };
  }, []);

  return open;
}

/** Hide while scrolling down, show on scroll up / near the edges. */
function useScrollHidden(enabled: boolean, resetKey: string): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    setHidden(false);
    lastY.current = window.scrollY;
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.max(0, window.scrollY);
        const dy = y - lastY.current;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (y < 80 || y > max - 80 || dy < -6) setHidden(false);
        else if (dy > 10) setHidden(true);
        lastY.current = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return hidden;
}

interface MobileBottomNavProps {
  /** Slide the dock away while scrolling down. Default: true. */
  autoHide?: boolean;
}

export default function MobileBottomNav({ autoHide = true }: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const path = normalizePath(pathname);
  const routeAllowed = shouldShowMobileBottomNav(pathname);

  useBlocker({
    shouldBlockFn: ({ current, next }) => {
      if (current.pathname !== "/dashboard" || next.pathname !== "/welcome") return false;
      return !window.confirm("Leave the dashboard? Any unsaved work on this page may be lost.");
    },
  });

  const keyboardOpen = useKeyboardOpen();
  const scrollHidden = useScrollHidden(autoHide && routeAllowed, path);
  const tuckedAway = keyboardOpen || scrollHidden;
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  // Reserve space for the dock automatically so it never covers page content.
  useEffect(() => {
    if (!routeAllowed) return;
    document.body.classList.add(BODY_CLASS);
    return () => document.body.classList.remove(BODY_CLASS);
  }, [routeAllowed]);

  if (!routeAllowed) return null;

  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(path));

  return (
    <nav
      className={`mobile-glass-nav${tuckedAway ? " is-hidden" : ""}`}
      aria-label="Main mobile navigation"
      aria-hidden={tuckedAway || undefined}
    >
      <div
        className="mobile-glass-nav__inner"
        style={
          {
            "--count": NAV_ITEMS.length + 1,
            "--i": Math.max(activeIndex, 0),
          } as CSSProperties
        }
      >
        <span
          className={`mobile-glass-nav__indicator${activeIndex < 0 ? " is-none" : ""}`}
          aria-hidden="true"
        />
        {NAV_ITEMS.map((item, index) => {
          const active = index === activeIndex;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              preload="render"
              aria-current={active ? "page" : undefined}
              tabIndex={tuckedAway ? -1 : undefined}
              className={`mobile-glass-nav__item${active ? " is-active" : ""}`}
              onClick={() => {
                if (active) window.scrollTo({ top: 0, behavior: "smooth" });
                else if ("vibrate" in navigator) navigator.vibrate?.(8);
              }}
            >
              <span className="mobile-glass-nav__icon">
                <Icon size={23} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
              </span>
              <span className="mobile-glass-nav__label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`mobile-glass-nav__item mobile-glass-nav__back${!canGoBack ? " is-disabled" : ""}`}
          aria-label="Go back to the previous page"
          disabled={!canGoBack || tuckedAway}
          tabIndex={tuckedAway ? -1 : undefined}
          onClick={() => {
            if (!canGoBack) return;
            window.history.back();
          }}
        >
          <span className="mobile-glass-nav__icon">
            <ArrowLeft size={23} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="mobile-glass-nav__label">Back</span>
        </button>
      </div>
    </nav>
  );
}
