import { useCallback, useEffect, useState } from "react";
import { canNotify } from "@/lib/jee360/notifications";

export const JEE_ALERT_PREFERENCE_KEY = "jph-jee-alert-preferences";
const CHANGE_EVENT = "jph-jee-alert-preferences-change";

export const JEE_ALERT_SOUNDS = [
  { id: "bell", label: "Study bell", description: "A clear two-note chime" },
  { id: "double", label: "Double ping", description: "Two short, focused tones" },
  { id: "pulse", label: "Urgent pulse", description: "Three brisk alert notes" },
] as const;

export type JeeAlertSound = (typeof JEE_ALERT_SOUNDS)[number]["id"];
export type JeeAlertPreferences = {
  soundEnabled: boolean;
  desktopEnabled: boolean;
  sound: JeeAlertSound;
};
export type HighPriorityAlert = {
  id: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

const DEFAULT_PREFERENCES: JeeAlertPreferences = {
  soundEnabled: false,
  desktopEnabled: false,
  sound: "bell",
};

function normalizePreferences(value: unknown): JeeAlertPreferences {
  if (!value || typeof value !== "object") return DEFAULT_PREFERENCES;
  const candidate = value as Partial<JeeAlertPreferences>;
  const sound = JEE_ALERT_SOUNDS.some((option) => option.id === candidate.sound)
    ? candidate.sound as JeeAlertSound
    : DEFAULT_PREFERENCES.sound;
  return {
    soundEnabled: candidate.soundEnabled === true,
    desktopEnabled: candidate.desktopEnabled === true,
    sound,
  };
}

export function readJeeAlertPreferences(): JeeAlertPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(JEE_ALERT_PREFERENCE_KEY) ?? "null"));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function useJeeAlertPreferences() {
  const [preferences, setPreferences] = useState<JeeAlertPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = (event?: Event) => {
      const detail = (event as CustomEvent<JeeAlertPreferences> | undefined)?.detail;
      setPreferences(normalizePreferences(detail ?? readJeeAlertPreferences()));
    };
    sync();
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === JEE_ALERT_PREFERENCE_KEY) sync();
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((patch: Partial<JeeAlertPreferences>) => {
    const next = normalizePreferences({ ...preferences, ...patch });
    try {
      localStorage.setItem(JEE_ALERT_PREFERENCE_KEY, JSON.stringify(next));
    } catch {
      // The new preference remains active in this page if browser storage is blocked.
    }
    setPreferences(next);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, [preferences]);

  return { preferences, update, ready };
}

const SOUND_PATTERNS: Record<JeeAlertSound, { frequency: number; start: number; duration: number }[]> = {
  bell: [
    { frequency: 880, start: 0, duration: 0.22 },
    { frequency: 1174.66, start: 0.19, duration: 0.32 },
  ],
  double: [
    { frequency: 659.25, start: 0, duration: 0.13 },
    { frequency: 880, start: 0.2, duration: 0.16 },
  ],
  pulse: [
    { frequency: 740, start: 0, duration: 0.12 },
    { frequency: 932.33, start: 0.16, duration: 0.12 },
    { frequency: 1108.73, start: 0.32, duration: 0.2 },
  ],
};

let sharedAudioContext: AudioContext | null = null;

export function playJeeAlertSound(sound: JeeAlertSound = "bell") {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    sharedAudioContext ??= new AudioContextCtor();
    const context = sharedAudioContext;
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    const now = context.currentTime;
    for (const note of SOUND_PATTERNS[sound]) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = now + note.start;
      const end = start + note.duration;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note.frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.14, start + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.025);
    }
  } catch {
    // Web Audio may be unavailable in embedded browsers; alerts still appear in-app.
  }
}

export function deliverHighPriorityDesktopAlert(
  alert: HighPriorityAlert,
  onClick?: () => void,
) {
  if (!canNotify() || Notification.permission !== "granted") return;
  try {
    const notification = new Notification(`High-priority JEE alert: ${alert.title}`, {
      body: alert.body || "Open JEE Prep Hub to view the details.",
      icon: "/favicon.png",
      tag: `jph-high-priority-${alert.id}`,
    });
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  } catch {
    // Some browsers only allow system notifications through a service worker.
  }
}
