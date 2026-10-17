import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FOCUS_TIMER_KEY } from "@/lib/focus-timer-storage";

type Mode = "pomodoro" | "stopwatch";
type Subject = "physics" | "chemistry" | "mathematics" | "general";

interface FocusTimerState {
  mode: Mode;
  pomoMinutes: number;
  subject: Subject;
  running: boolean;
  startedAt: number | null;
  initialSeconds: number;
  accumulatedElapsed: number;
  note: string;
}

interface FocusTimerContextValue extends FocusTimerState {
  secondsRemaining: number;
  elapsed: number;
  display: string;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
  setMode: (mode: Mode) => void;
  setPomoMinutes: (minutes: number) => void;
  setSubject: (subject: Subject) => void;
  setNote: (note: string) => void;
  saveSession: () => Promise<void>;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

const defaultState: FocusTimerState = {
  mode: "pomodoro",
  pomoMinutes: 25,
  subject: "physics",
  running: false,
  startedAt: null,
  initialSeconds: 25 * 60,
  accumulatedElapsed: 0,
  note: "",
};

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState<FocusTimerState>(defaultState);
  const [now, setNow] = useState(Date.now());
  const stateRef = useRef(state);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted state when a user is available.
  useEffect(() => {
    if (!user) return;
    userIdRef.current = user.id;
    try {
      const raw = localStorage.getItem(FOCUS_TIMER_KEY(user.id));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FocusTimerState>;
        const restored: FocusTimerState = { ...defaultState, ...parsed };
        if (restored.running && restored.startedAt) {
          const away = Math.floor((Date.now() - restored.startedAt) / 1000);
          if (restored.mode === "pomodoro") {
            const remaining = Math.max(0, restored.initialSeconds - away);
            if (remaining === 0) {
              void saveSessionInternal(restored, restored.initialSeconds).then((saved) => {
                if (saved) toast.success("Pomodoro complete! Session saved while you were away.");
              });
              restored.running = false;
              restored.startedAt = null;
              restored.accumulatedElapsed = 0;
            } else {
              restored.accumulatedElapsed = away;
              restored.startedAt = Date.now();
            }
          } else {
            restored.accumulatedElapsed = (restored.accumulatedElapsed || 0) + away;
            restored.startedAt = Date.now();
          }
        }
        setState(restored);
      }
    } catch {
      /* ignore corrupted storage */
    }
  }, [user?.id]);

  // Persist state on every change.
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(FOCUS_TIMER_KEY(user.id), JSON.stringify(state));
    } catch {
      /* ignore storage errors */
    }
  }, [state, user?.id]);

  // Clear state when the user signs out.
  useEffect(() => {
    if (!user && userIdRef.current) {
      try {
        localStorage.removeItem(FOCUS_TIMER_KEY(userIdRef.current));
      } catch {
        /* ignore */
      }
      userIdRef.current = undefined;
      setState(defaultState);
    }
  }, [user]);

  // Global interval: keeps ticking even when individual timer components unmount.
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  const secondsSinceStart =
    state.running && state.startedAt ? Math.floor((now - state.startedAt) / 1000) : 0;
  const elapsed = state.accumulatedElapsed + secondsSinceStart;
  const secondsRemaining =
    state.mode === "pomodoro" ? Math.max(0, state.initialSeconds - elapsed) : 0;
  const display = state.mode === "pomodoro" ? fmt(secondsRemaining) : fmt(elapsed);
  const progress =
    state.mode === "pomodoro"
      ? ((state.initialSeconds - secondsRemaining) / state.initialSeconds) * 100
      : 0;

  // Save when a pomodoro reaches zero.
  useEffect(() => {
    if (state.mode === "pomodoro" && state.running && secondsRemaining === 0) {
      const current = stateRef.current;
      setState((prev) => ({
        ...prev,
        running: false,
        startedAt: null,
        accumulatedElapsed: 0,
      }));
      void saveSessionInternal(current, current.initialSeconds).then((saved) => {
        if (saved) toast.success("Pomodoro complete! Session saved.");
      });
    }
  }, [state.mode, state.running, secondsRemaining]);

  async function saveSessionInternal(
    currentState: FocusTimerState,
    durationSeconds: number,
  ): Promise<boolean> {
    if (!user) {
      toast.error("Please sign in to save sessions");
      return false;
    }
    // Save EVERY session, no matter how short — even a single second counts.
    const duration = Math.max(1, Math.floor(durationSeconds));
    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      duration_seconds: duration,
      session_type: currentState.mode,
      subject: currentState.subject,
      note: currentState.note.trim() || null,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    qc.invalidateQueries({ queryKey: ["recent-sessions"] });
    qc.invalidateQueries({ queryKey: ["session-stats"] });
    qc.invalidateQueries({ queryKey: ["pomodoro-streak"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
    qc.invalidateQueries({ queryKey: ["leaderboard-all"] });
    return true;
  }

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, running: true, startedAt: Date.now() }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.running || !prev.startedAt) return prev;
      const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
      return {
        ...prev,
        running: false,
        startedAt: null,
        accumulatedElapsed: prev.accumulatedElapsed + elapsed,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      running: false,
      startedAt: null,
      accumulatedElapsed: 0,
      initialSeconds: prev.pomoMinutes * 60,
    }));
  }, []);

  const toggle = useCallback(() => {
    if (stateRef.current.running) {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  const setMode = useCallback((mode: Mode) => {
    setState((prev) => ({
      ...prev,
      mode,
      running: false,
      startedAt: null,
      accumulatedElapsed: 0,
      initialSeconds: mode === "pomodoro" ? prev.pomoMinutes * 60 : prev.initialSeconds,
    }));
  }, []);

  const setPomoMinutes = useCallback((minutes: number) => {
    setState((prev) => ({
      ...prev,
      pomoMinutes: minutes,
      ...(prev.mode === "pomodoro" && !prev.running
        ? { initialSeconds: minutes * 60 }
        : {}),
    }));
  }, []);

  const setSubject = useCallback((subject: Subject) => {
    setState((prev) => ({ ...prev, subject }));
  }, []);

  const setNote = useCallback((note: string) => {
    setState((prev) => ({ ...prev, note }));
  }, []);

  const saveSession = async () => {
    const current = stateRef.current;
    const liveSecondsSinceStart =
      current.running && current.startedAt
        ? Math.floor((Date.now() - current.startedAt) / 1000)
        : 0;
    const duration = current.accumulatedElapsed + liveSecondsSinceStart;
    if (duration <= 0) {
      toast.error("Start the timer first");
      return;
    }
    const saved = await saveSessionInternal(current, duration);
    if (!saved) return;
    setState((prev) => ({
      ...prev,
      running: false,
      startedAt: null,
      accumulatedElapsed: 0,
    }));
    const mins = Math.max(1, Math.round(duration / 60));
    toast.success(`✅ Session saved · ${mins} min`);
  };

  const value: FocusTimerContextValue = {
    ...state,
    secondsRemaining,
    elapsed,
    display,
    progress,
    start,
    pause,
    reset,
    toggle,
    setMode,
    setPomoMinutes,
    setSubject,
    setNote,
    saveSession,
  };

  return (
    <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) {
    throw new Error("useFocusTimer must be used within a FocusTimerProvider");
  }
  return ctx;
}
