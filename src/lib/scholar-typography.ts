import { useCallback, useEffect, useState } from "react";

export const SCHOLAR_FONTS = [
  { id: "editorial", label: "Editorial Serif", description: "Book-like headings and a classic reading feel", family: "Georgia, 'Times New Roman', serif" },
  { id: "epilogue", label: "Epilogue", description: "The clean JEE Prep Hub sans-serif", family: "'Epilogue', system-ui, sans-serif" },
  { id: "urbanist", label: "Urbanist", description: "Geometric, modern and slightly softer", family: "'Urbanist', system-ui, sans-serif" },
  { id: "system", label: "System UI", description: "Fast native fonts from this device", family: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: "mono", label: "Mono Focus", description: "A technical, code-like study notebook", family: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace" },
] as const;

export type ScholarFont = (typeof SCHOLAR_FONTS)[number]["id"];
export type ScholarTypographyPreference = { font: ScholarFont; scale: number };

export const SCHOLAR_TYPOGRAPHY_KEY = "jph-scholar-typography";
const CHANGE_EVENT = "jph-scholar-typography-change";
const DEFAULT_PREFERENCE: ScholarTypographyPreference = { font: "editorial", scale: 1 };
const SIZE_FACTORS: Record<string, number> = {
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  "2xl": 1.5,
  "3xl": 1.875,
  "4xl": 2.25,
  "5xl": 3,
  "6xl": 3.75,
  "7xl": 4.5,
  "8xl": 6,
  "9xl": 8,
};

function normalizePreference(value: unknown): ScholarTypographyPreference {
  if (!value || typeof value !== "object") return DEFAULT_PREFERENCE;
  const candidate = value as Partial<ScholarTypographyPreference>;
  const font = SCHOLAR_FONTS.some((option) => option.id === candidate.font)
    ? candidate.font as ScholarFont
    : DEFAULT_PREFERENCE.font;
  const scale = Number(candidate.scale);
  return {
    font,
    scale: Number.isFinite(scale) ? Math.round(Math.min(1.2, Math.max(0.85, scale)) * 100) / 100 : DEFAULT_PREFERENCE.scale,
  };
}

export function readScholarTypography(): ScholarTypographyPreference {
  if (typeof window === "undefined") return DEFAULT_PREFERENCE;
  try {
    return normalizePreference(JSON.parse(localStorage.getItem(SCHOLAR_TYPOGRAPHY_KEY) ?? "null"));
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

export function applyScholarTypography(value: unknown) {
  if (typeof document === "undefined") return;
  const preference = normalizePreference(value);
  const font = SCHOLAR_FONTS.find((option) => option.id === preference.font) ?? SCHOLAR_FONTS[0];
  const root = document.documentElement;
  root.style.setProperty("--scholar-font-family", font.family);
  root.style.setProperty("--scholar-display-family", font.family);
  for (const [size, factor] of Object.entries(SIZE_FACTORS)) {
    root.style.setProperty(`--scholar-text-${size}`, `${(16 * factor * preference.scale).toFixed(2)}px`);
  }
}

export function useScholarTypography() {
  const [preference, setPreference] = useState<ScholarTypographyPreference>(DEFAULT_PREFERENCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readScholarTypography();
    setPreference(initial);
    applyScholarTypography(initial);
    setReady(true);
    const sync = (event?: Event) => {
      const detail = (event as CustomEvent<ScholarTypographyPreference> | undefined)?.detail;
      const next = normalizePreference(detail ?? readScholarTypography());
      setPreference(next);
      applyScholarTypography(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SCHOLAR_TYPOGRAPHY_KEY) sync();
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((patch: Partial<ScholarTypographyPreference>) => {
    const next = normalizePreference({ ...preference, ...patch });
    applyScholarTypography(next);
    try {
      localStorage.setItem(SCHOLAR_TYPOGRAPHY_KEY, JSON.stringify(next));
    } catch {
      // Keep the selected typography active for this visit when storage is unavailable.
    }
    setPreference(next);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, [preference]);

  const reset = useCallback(() => update(DEFAULT_PREFERENCE), [update]);
  return { preference, update, reset, ready };
}
