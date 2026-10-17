import { useCallback, useEffect, useState } from "react";

export const BACKGROUND_COLORS = {
  default: { label: "Sky mist", color: "#dbeefc" },
  mint: { label: "Mint", color: "#e5f3eb" },
  lavender: { label: "Lavender", color: "#eee9f8" },
  sand: { label: "Sand", color: "#f4eee2" },
  rose: { label: "Rose", color: "#f7e9ed" },
  slate: { label: "Cloud gray", color: "#e9eef4" },
  peach: { label: "Peach", color: "#f6e7dd" },
  aqua: { label: "Aqua", color: "#e1f1f0" },
  lemon: { label: "Lemon", color: "#f4f1dc" },
  pistachio: { label: "Pistachio", color: "#ebf0df" },
  periwinkle: { label: "Periwinkle", color: "#e8eafa" },
  graphite: { label: "Graphite", color: "#e1e6ec" },
} as const;

export type BackgroundColorPreset = keyof typeof BACKGROUND_COLORS | "custom";
export type BackgroundColorPreference = { preset: BackgroundColorPreset; color: string; strength: number };
const KEY = "jph-background-color";
const EVT = "jph-background-color-change";
const DEFAULT: BackgroundColorPreference = { preset: "default", color: BACKGROUND_COLORS.default.color, strength: 72 };
const isHexColor = (value: unknown): value is string => typeof value === "string" && /^#[\da-f]{6}$/i.test(value);

export function readBackgroundColor(): BackgroundColorPreference {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<BackgroundColorPreference> | null;
    if (!parsed) return DEFAULT;
    const preset = parsed.preset && (parsed.preset === "custom" || parsed.preset in BACKGROUND_COLORS)
      ? parsed.preset
      : "default";
    const color = isHexColor(parsed.color) ? parsed.color : BACKGROUND_COLORS.default.color;
    const strength = Number(parsed.strength);
    return { preset, color, strength: Number.isFinite(strength) ? Math.min(100, Math.max(20, strength)) : DEFAULT.strength };
  } catch {
    return DEFAULT;
  }
}

export function applyBackgroundColor(preference: BackgroundColorPreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.backgroundColor = preference.preset;
  root.style.setProperty("--jph-page-bg-color", preference.color);
  root.style.setProperty("--jph-page-bg-strength", `${preference.strength}%`);
}

export function useBackgroundColor() {
  const [background, setBackground] = useState<BackgroundColorPreference>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readBackgroundColor();
    setBackground(initial);
    applyBackgroundColor(initial);
    setReady(true);
    const sync = () => {
      const next = readBackgroundColor();
      setBackground(next);
      applyBackgroundColor(next);
    };
    const syncStorage = (event: StorageEvent) => { if (event.key === KEY) sync(); };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const update = useCallback((patch: Partial<BackgroundColorPreference>) => {
    const next = { ...background, ...patch };
    if (!isHexColor(next.color)) return;
    applyBackgroundColor(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Current session still uses the selected color. */ }
    setBackground(next);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
  }, [background]);

  return { background, update, ready };
}
