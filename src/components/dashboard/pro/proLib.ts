// src/components/dashboard/pro/proLib.ts
// Helpers for the Pro dashboard: local storage state, status timer, ambience sounds.

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Small utils                                                         */
/* ------------------------------------------------------------------ */

export const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fmtClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function fmtDur(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function fmtHM(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmt12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m || 0)} ${suffix}`;
}

export function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ------------------------------------------------------------------ */
/* localStorage-backed state (safe for SSR)                            */
/* ------------------------------------------------------------------ */

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : initial);
    } catch {
      setValue(initial);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* storage full or blocked */
        }
        return v;
      });
    },
    [key],
  );

  return [value, set, ready] as const;
}

/* ------------------------------------------------------------------ */
/* Statuses + the running timer                                        */
/* ------------------------------------------------------------------ */

export type StatusId =
  | "available"
  | "deep"
  | "meeting"
  | "break"
  | "lunch"
  | "lecture"
  | "practice"
  | "revision";

export type StatusDef = {
  id: StatusId;
  label: string;
  color: string;
  study: boolean; // counts as study time (saved to study_sessions)
  more?: boolean;
};

export const STATUSES: StatusDef[] = [
  { id: "available", label: "Available", color: "#22c55e", study: false },
  { id: "deep", label: "Deep Work", color: "#8b5cf6", study: true },
  { id: "meeting", label: "Meeting", color: "#3b82f6", study: false },
  { id: "break", label: "Break", color: "#f59e0b", study: false },
  { id: "lunch", label: "Lunch", color: "#fb923c", study: false },
  { id: "lecture", label: "Lecture", color: "#ec4899", study: true, more: true },
  { id: "practice", label: "Practice", color: "#14b8a6", study: true, more: true },
  { id: "revision", label: "Revision", color: "#06b6d4", study: true, more: true },
];

export const statusOf = (id: string) =>
  STATUSES.find((s) => s.id === id) ?? STATUSES[0];

export type Running = { id: StatusId; startedAt: number; flushed: number };
export type Segment = { id: StatusId; start: number; end: number };

const STALE_MS = 12 * 3600 * 1000;

export function useStatusTimer(
  onStudy: (seconds: number, label: string) => void,
) {
  const [running, setRunning, ready] = useLocalState<Running | null>(
    "jph:pro:running",
    null,
  );
  const [log, setLog] = useLocalState<Segment[]>(`jph:pro:log:${dayKey()}`, []);
  const [now, setNow] = useState(() => Date.now());

  const runningRef = useRef(running);
  runningRef.current = running;
  const onStudyRef = useRef(onStudy);
  onStudyRef.current = onStudy;

  // start (or restart if stale) once storage is loaded
  useEffect(() => {
    if (!ready) return;
    const cur = runningRef.current;
    if (!cur || Date.now() - cur.startedAt > STALE_MS) {
      setRunning({ id: "available", startedAt: Date.now(), flushed: 0 });
    }
  }, [ready, setRunning]);

  // tick every second + flush study time every 5 minutes
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const cur = runningRef.current;
      if (!cur) return;
      const st = statusOf(cur.id);
      if (!st.study) return;
      const elapsed = Math.floor((n - cur.startedAt) / 1000);
      const delta = elapsed - cur.flushed;
      if (delta >= 300 && elapsed < STALE_MS / 1000) {
        onStudyRef.current(delta, st.label);
        setRunning({ ...cur, flushed: cur.flushed + delta });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [setRunning]);

  const switchTo = useCallback(
    (id: StatusId) => {
      const cur = runningRef.current;
      const t = Date.now();
      if (cur && cur.id === id) return;
      if (cur) {
        const secs = Math.floor((t - cur.startedAt) / 1000);
        const fresh = secs < STALE_MS / 1000;
        if (fresh && secs >= 5) {
          setLog((l) => [...l, { id: cur.id, start: cur.startedAt, end: t }]);
        }
        const st = statusOf(cur.id);
        const remaining = secs - cur.flushed;
        if (fresh && st.study && remaining >= 30) {
          onStudyRef.current(remaining, st.label);
        }
      }
      setRunning({ id, startedAt: t, flushed: 0 });
    },
    [setLog, setRunning],
  );

  const current: Running = running ?? { id: "available", startedAt: now, flushed: 0 };
  const elapsed = Math.max(0, Math.floor((now - current.startedAt) / 1000));
  const unsavedStudySeconds = statusOf(current.id).study
    ? Math.max(0, elapsed - current.flushed)
    : 0;

  const segments: Segment[] = [
    ...log,
    { id: current.id, start: Math.max(current.startedAt, startOfToday().getTime()), end: now },
  ];

  return { current, elapsed, now, switchTo, segments, unsavedStudySeconds, ready };
}

/* ------------------------------------------------------------------ */
/* Ambience (generated noise, no audio files needed)                   */
/* ------------------------------------------------------------------ */

export type NoiseKind = "brown" | "pink" | "forest";

/* eslint-disable @typescript-eslint/no-explicit-any */
class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private src: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private buffers: Partial<Record<NoiseKind, AudioBuffer>> = {};
  kind: NoiseKind | null = null;
  volume = 0.5;

  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private makeBuffer(ctx: AudioContext, kind: NoiseKind) {
    const cached = this.buffers[kind];
    if (cached) return cached;
    const len = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (kind === "brown") {
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    this.buffers[kind] = buf;
    return buf;
  }

  private stopSource() {
    try { this.src?.stop(); } catch { /* already stopped */ }
    try { this.lfo?.stop(); } catch { /* already stopped */ }
    this.src?.disconnect();
    this.src = null;
    this.lfo = null;
  }

  play(kind: NoiseKind) {
    this.stopSource();
    const ctx = this.ensure();
    const src = ctx.createBufferSource();
    src.buffer = this.makeBuffer(ctx, kind === "forest" ? "pink" : kind);
    src.loop = true;

    if (kind === "forest") {
      // soft wind in the canopy: filtered pink noise with a slow swell
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      const mod = ctx.createGain();
      mod.gain.value = 0.7;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.13;
      const depth = ctx.createGain();
      depth.gain.value = 0.3;
      lfo.connect(depth);
      depth.connect(mod.gain);
      lfo.start();
      src.connect(lp);
      lp.connect(mod);
      mod.connect(this.master!);
      this.lfo = lfo;
    } else {
      src.connect(this.master!);
    }
    src.start();
    this.src = src;
    this.kind = kind;
  }

  stop() {
    this.stopSource();
    this.kind = null;
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }
}

let engine: AmbienceEngine | null = null;
const getEngine = () => (engine ??= new AmbienceEngine());

export function useAmbience() {
  const [kind, setKind] = useState<NoiseKind | null>(null);
  const [volume, setVolumeState] = useState(0.5);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("jph:pro:vol"));
      if (v > 0 && v <= 1) {
        setVolumeState(v);
        getEngine().setVolume(v);
      }
    } catch { /* ignore */ }
    return () => {
      getEngine().stop();
    };
  }, []);

  const toggle = useCallback((k: NoiseKind) => {
    const e = getEngine();
    if (e.kind === k) {
      e.stop();
      setKind(null);
    } else {
      e.play(k);
      setKind(k);
    }
  }, []);

  const off = useCallback(() => {
    getEngine().stop();
    setKind(null);
  }, []);

  const setVolume = useCallback((v: number) => {
    const nv = Math.min(1, Math.max(0, v));
    getEngine().setVolume(nv);
    setVolumeState(nv);
    try { localStorage.setItem("jph:pro:vol", String(nv)); } catch { /* ignore */ }
  }, []);

  return { kind, volume, toggle, off, setVolume };
}
