import { useCallback, useEffect, useState } from "react";

/**
 * Background colour-motion preferences. Stored purely in localStorage —
 * no account, no backend calls.
 */
export type BgMotion = {
  enabled: boolean;
  /** 0.2 – 1.4 : how visible the colour washes are */
  strength: number;
  /** seconds for one full drift cycle (higher = calmer) */
  speed: number;
  /** rotate through blue → green → violet → pink */
  hue: boolean;
};

export const BG_PRESETS = {
  default: { enabled: true, strength: 1, speed: 14, hue: true },
  soft: { enabled: true, strength: 0.45, speed: 34, hue: false },
  off: { enabled: false, strength: 0.45, speed: 34, hue: false },
} satisfies Record<string, BgMotion>;

export type BgPresetKey = keyof typeof BG_PRESETS;

const KEY = "bg-motion";
const EVT = "jph-bg-motion-change";

export function readBgMotion(): BgMotion {
  if (typeof window === "undefined") return BG_PRESETS.default;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return BG_PRESETS.default;
    const parsed = JSON.parse(raw) as Partial<BgMotion>;
    return {
      enabled: parsed.enabled ?? true,
      strength: clamp(Number(parsed.strength ?? 1), 0.2, 1.4),
      speed: clamp(Number(parsed.speed ?? 14), 6, 60),
      hue: parsed.hue ?? true,
    };
  } catch {
    return BG_PRESETS.default;
  }
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function applyBgMotion(m: BgMotion) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset["bgMotion"] = m.enabled ? "on" : "off";
  root.dataset["bgHue"] = m.enabled && m.hue ? "on" : "off";
  root.style.setProperty("--bg-strength", String(m.strength));
  root.style.setProperty("--bg-speed", `${m.speed}s`);
  root.style.setProperty("--bg-wash-speed", `${Math.max(5, m.speed * 0.8)}s`);
  root.style.setProperty("--bg-hue-speed", `${Math.max(5, m.speed * 0.7)}s`);
}

export function matchPreset(m: BgMotion): BgPresetKey | "custom" {
  for (const [key, preset] of Object.entries(BG_PRESETS) as [BgPresetKey, BgMotion][]) {
    if (
      preset.enabled === m.enabled &&
      preset.hue === m.hue &&
      Math.abs(preset.strength - m.strength) < 0.02 &&
      Math.abs(preset.speed - m.speed) < 0.5
    ) {
      return key;
    }
  }
  return "custom";
}

export function useBgMotion() {
  const [motion, setMotion] = useState<BgMotion>(BG_PRESETS.default);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readBgMotion();
    setMotion(initial);
    applyBgMotion(initial);
    setReady(true);
    const sync = () => {
      const next = readBgMotion();
      setMotion(next);
      applyBgMotion(next);
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key === KEY) sync();
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const update = useCallback((patch: Partial<BgMotion>) => {
    const next = { ...motion, ...patch };
    applyBgMotion(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // The CSS preference still applies for this visit if storage is unavailable.
    }
    setMotion(next);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
  }, [motion]);

  return { motion, update, ready, preset: matchPreset(motion) };
}
