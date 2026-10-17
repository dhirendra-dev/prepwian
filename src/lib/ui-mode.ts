import { useCallback, useEffect, useState } from "react";

/**
 * Site-wide skin switch.
 *  - "glass"  : the Liquid Glass skin (default)
 *  - "legacy" : Scholar Desk editorial skin; legacy value retained for saved preferences
 *  - "ios27"   : opt-in iOS-27-inspired beta skin for the whole site
 *
 * Browser-only (localStorage) — no account, no backend calls.
 */
export type UiMode = "glass" | "legacy" | "ios27";

const KEY = "jph-ui-mode";
const EVT = "jph-ui-mode-change";
export const UI_MODES: UiMode[] = ["glass", "ios27", "legacy"];

export function readUiMode(): UiMode {
  if (typeof window === "undefined") return "glass";
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "legacy" || saved === "ios27" ? saved : "glass";
  } catch {
    return "glass";
  }
}

export function applyUiMode(mode: UiMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset["ui"] = mode;
}

export function setUiMode(mode: UiMode) {
  applyUiMode(mode);
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT, { detail: mode }));
  }
}

export function useUiMode() {
  const [mode, setLocal] = useState<UiMode>("glass");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readUiMode();
    setLocal(initial);
    applyUiMode(initial);
    setReady(true);
    const onEvt = (e: Event) => setLocal(((e as CustomEvent).detail as UiMode) ?? "glass");
    window.addEventListener(EVT, onEvt);
    return () => window.removeEventListener(EVT, onEvt);
  }, []);

  const toggle = useCallback(() => {
    const current = readUiMode();
    const next = UI_MODES[(UI_MODES.indexOf(current) + 1) % UI_MODES.length];
    setUiMode(next);
  }, []);

  return {
    mode,
    isGlass: mode === "glass",
    isLegacy: mode === "legacy",
    isIos27: mode === "ios27",
    ready,
    toggle,
    set: setUiMode,
  };
}
