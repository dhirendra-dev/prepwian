import { useCallback, useEffect, useState } from "react";

export type ColorPalette = "ocean" | "forest" | "coral" | "violet" | "rose" | "amber";

const KEY = "jph-color-palette";
const EVENT = "jph-color-palette-change";

export function readColorPalette(): ColorPalette {
  if (typeof window === "undefined") return "ocean";
  try {
    const value = localStorage.getItem(KEY);
    return value === "forest" || value === "coral" || value === "violet" || value === "rose" || value === "amber" ? value : "ocean";
  } catch {
    return "ocean";
  }
}

export function applyColorPalette(palette: ColorPalette) {
  if (typeof document !== "undefined") document.documentElement.dataset["palette"] = palette;
}

export function setColorPalette(palette: ColorPalette) {
  applyColorPalette(palette);
  try { localStorage.setItem(KEY, palette); } catch { /* storage may be unavailable */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: palette }));
}

export function useColorPalette() {
  const [palette, setPalette] = useState<ColorPalette>("ocean");
  useEffect(() => {
    const initial = readColorPalette();
    setPalette(initial);
    applyColorPalette(initial);
    const sync = (event: Event) => setPalette((event as CustomEvent<ColorPalette>).detail ?? "ocean");
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const set = useCallback((next: ColorPalette) => setColorPalette(next), []);
  return { palette, set };
}
