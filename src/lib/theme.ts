import { useCallback, useEffect, useState } from "react";

/**
 * Single source of truth for light/dark across the whole app (including Pulse).
 * Stored in localStorage under "theme" — no backend calls.
 */
export type Theme = "light" | "dark";

const KEY = "theme";
const EVT = "jph-theme-change";
const THEME_TRANSITION_MS = 140;
let themeTransitionTimer: ReturnType<typeof setTimeout> | undefined;

export function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme, withTransition = false) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (themeTransitionTimer !== undefined) {
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = undefined;
  }
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (withTransition && !reducedMotion) {
    root.classList.add("theme-transitioning");
    themeTransitionTimer = setTimeout(() => {
      root.classList.remove("theme-transitioning");
      themeTransitionTimer = undefined;
    }, THEME_TRANSITION_MS + 20);
  } else {
    root.classList.remove("theme-transitioning");
  }
  root.classList.toggle("dark", theme === "dark");
  root.dataset["theme"] = theme;
  root.style.colorScheme = theme;
}

export function setTheme(theme: Theme) {
  applyTheme(theme, true);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT, { detail: theme }));
  }
}

/** Shared hook — every surface toggling this stays in sync app-wide. */
export function useTheme() {
  const [theme, setLocal] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readTheme();
    setLocal(initial);
    applyTheme(initial);
    setReady(true);
    const onEvt = (e: Event) => setLocal(((e as CustomEvent).detail as Theme) ?? "light");
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        const next = readTheme();
        applyTheme(next, true);
        setLocal(next);
      }
    };
    window.addEventListener(EVT, onEvt);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onEvt);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, isDark: theme === "dark", ready, toggle, set: setTheme };
}
