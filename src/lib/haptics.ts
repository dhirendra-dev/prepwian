// Lightweight haptics helper. Safely no-ops where unsupported.
export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 35,
  selection: 8,
  success: [12, 40, 18],
  warning: [20, 60, 20],
  error: [40, 30, 40, 30, 60],
};

export function haptic(pattern: HapticPattern = "light") {
  if (typeof window === "undefined") return;
  try {
    const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    if (typeof nav.vibrate === "function") nav.vibrate(PATTERNS[pattern]);
  } catch {
    // ignore
  }
}
