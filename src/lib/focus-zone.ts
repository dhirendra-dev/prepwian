/**
 * Focus Zone — a fully local (localStorage) productivity suite.
 * No backend, no account, no network calls.
 */
import { useEffect, useState } from "react";

export type TodoStatus = "paused" | "running" | "done" | "failed";

export type FzTodo = {
  id: string;
  title: string;
  groupId: string | null;
  tags: string[];
  estimateMin: number;
  deadline: string; // yyyy-mm-dd
  status: TodoStatus;
  spentSec: number;
  strict: boolean;
  createdAt: number;
};

export type FzHabit = {
  id: string;
  title: string;
  cadence: "daily" | "weekly";
  targetPerWeek: number;
  history: string[]; // yyyy-mm-dd list of completions
  createdAt: number;
};

export type FzGroupMember = { id: string; name: string; handle: string; role: "owner" | "member" };

export type FzGroup = {
  id: string;
  name: string;
  code: string;
  goal: string;
  goalHours: number;
  hoursLogged: number;
  members: FzGroupMember[];
};

export type FzFriend = {
  id: string;
  name: string;
  handle: string;
  streak: number;
  todayMin: number;
  ongoing: number | null; // percent
};

export type FzBlocked = { id: string; label: string; url: string; enabled: boolean };

export type FzSession = { date: string; minutes: number; todos: number };

export type FzTimer = { todoId: string | null; running: boolean; startedAt: number | null; elapsedSec: number };

export type FzState = {
  todos: FzTodo[];
  habits: FzHabit[];
  groups: FzGroup[];
  friends: FzFriend[];
  blocked: FzBlocked[];
  sessions: FzSession[];
  timer: FzTimer;
  lockEnabled: boolean;
  streak: number;
};

const KEY = "focuszone:state:v1";

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const todayKey = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const addDays = (dateKey: string, n: number) => {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + n);
  return todayKey(d);
};
export const prettyDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};
export const fmtMinutes = (min: number) => {
  const m = Math.round(min);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

function seed(): FzState {
  const t = todayKey();
  const sessions: FzSession[] = [];
  for (let i = 27; i >= 0; i--) {
    const day = addDays(t, -i);
    const base = [0, 45, 60, 90, 150, 210, 275][i % 7];
    sessions.push({ date: day, minutes: base, todos: base > 0 ? 1 + (i % 4) : 0 });
  }
  return {
    todos: [
      {
        id: uid(),
        title: "Read through lecture notes",
        groupId: null,
        tags: ["physics"],
        estimateMin: 120,
        deadline: addDays(t, 1),
        status: "paused",
        spentSec: 0,
        strict: false,
        createdAt: Date.now(),
      },
      {
        id: uid(),
        title: "Complete Chapter 2",
        groupId: null,
        tags: ["maths"],
        estimateMin: 60,
        deadline: addDays(t, 1),
        status: "paused",
        spentSec: 0,
        strict: false,
        createdAt: Date.now() - 1000,
      },
    ],
    habits: [
      { id: uid(), title: "Workout for 15 minutes", cadence: "daily", targetPerWeek: 7, history: [], createdAt: Date.now() },
      { id: uid(), title: "Revise formulas for 10 minutes", cadence: "daily", targetPerWeek: 7, history: [], createdAt: Date.now() },
      { id: uid(), title: "Full mock test every week", cadence: "weekly", targetPerWeek: 1, history: [], createdAt: Date.now() },
    ],
    groups: [
      {
        id: uid(),
        name: "Exam Prep",
        code: "7ANBNBCQ",
        goal: "Complete Chapter 1 of Advanced Calculus",
        goalHours: 10,
        hoursLogged: 0,
        members: [
          { id: "me", name: "You", handle: "@you", role: "owner" },
          { id: uid(), name: "Leo Park", handle: "@leo", role: "member" },
        ],
      },
    ],
    friends: [
      { id: uid(), name: "Captain Checklist", handle: "@captain", streak: 0, todayMin: 0, ongoing: 78 },
      { id: uid(), name: "Deadline Dave", handle: "@ddave", streak: 0, todayMin: 0, ongoing: 10 },
      { id: uid(), name: "Leo Park", handle: "@leo", streak: 1, todayMin: 10, ongoing: null },
    ],
    blocked: [
      { id: uid(), label: "Instagram", url: "instagram.com/reels", enabled: true },
      { id: uid(), label: "YouTube", url: "youtube.com/watch", enabled: true },
      { id: uid(), label: "Reddit", url: "reddit.com/r/popular", enabled: true },
      { id: uid(), label: "X", url: "x.com/home", enabled: false },
      { id: uid(), label: "Discord", url: "discord.com/channels", enabled: false },
    ],
    sessions,
    timer: { todoId: null, running: false, startedAt: null, elapsedSec: 0 },
    lockEnabled: false,
    streak: 0,
  };
}

let state: FzState | null = null;
const listeners = new Set<() => void>();

function read(): FzState {
  if (state) return state;
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? ({ ...seed(), ...(JSON.parse(raw) as FzState) } as FzState) : seed();
  } catch {
    state = seed();
  }
  return state;
}

function write(next: FzState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  listeners.forEach((l) => l());
}

export function updateFocusZone(fn: (s: FzState) => FzState) {
  write(fn(read()));
}

/** Reactive, hydration-safe access to the local Focus Zone store. */
export function useFocusZone() {
  const [snap, setSnap] = useState<FzState | null>(null);
  useEffect(() => {
    setSnap(read());
    const l = () => setSnap({ ...read() });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { state: snap, hydrated: snap !== null, update: updateFocusZone };
}

/* ---------- derived helpers ---------- */

export const liveElapsed = (timer: FzTimer) =>
  timer.running && timer.startedAt ? timer.elapsedSec + (Date.now() - timer.startedAt) / 1000 : timer.elapsedSec;

export function commitTimer(s: FzState): FzState {
  const spent = liveElapsed(s.timer);
  if (!s.timer.todoId || spent <= 0) return { ...s, timer: { todoId: null, running: false, startedAt: null, elapsedSec: 0 } };
  const id = s.timer.todoId;
  const minutes = spent / 60;
  const day = todayKey();
  const sessions = s.sessions.some((x) => x.date === day)
    ? s.sessions.map((x) => (x.date === day ? { ...x, minutes: x.minutes + minutes } : x))
    : [...s.sessions, { date: day, minutes, todos: 0 }];
  return {
    ...s,
    todos: s.todos.map((t) => (t.id === id ? { ...t, spentSec: t.spentSec + spent, status: "paused" } : t)),
    sessions,
    timer: { todoId: null, running: false, startedAt: null, elapsedSec: 0 },
  };
}

export function startTodo(id: string) {
  updateFocusZone((s) => {
    const base = s.timer.todoId && s.timer.todoId !== id ? commitTimer(s) : s;
    const carry = s.timer.todoId === id ? liveElapsed(s.timer) : 0;
    return {
      ...base,
      todos: base.todos.map((t) => (t.id === id ? { ...t, status: "running" } : t.status === "running" ? { ...t, status: "paused" } : t)),
      timer: { todoId: id, running: true, startedAt: Date.now(), elapsedSec: carry },
    };
  });
}

export function pauseTimer() {
  updateFocusZone((s) => {
    if (!s.timer.running) return s;
    const elapsed = liveElapsed(s.timer);
    return {
      ...s,
      todos: s.todos.map((t) => (t.id === s.timer.todoId ? { ...t, status: "paused" } : t)),
      timer: { ...s.timer, running: false, startedAt: null, elapsedSec: elapsed },
    };
  });
}

export function stopTimer() {
  updateFocusZone((s) => commitTimer(s));
}

export function completeTodo(id: string) {
  updateFocusZone((s) => {
    const base = s.timer.todoId === id ? commitTimer(s) : s;
    const day = todayKey();
    const sessions = base.sessions.some((x) => x.date === day)
      ? base.sessions.map((x) => (x.date === day ? { ...x, todos: x.todos + 1 } : x))
      : [...base.sessions, { date: day, minutes: 0, todos: 1 }];
    return { ...base, todos: base.todos.map((t) => (t.id === id ? { ...t, status: "done" } : t)), sessions };
  });
}

export function habitRateThisWeek(h: FzHabit) {
  const t = todayKey();
  const week = Array.from({ length: 7 }, (_, i) => addDays(t, -i));
  const hits = week.filter((d) => h.history.includes(d)).length;
  return Math.min(100, Math.round((hits / Math.max(1, h.targetPerWeek)) * 100));
}

export function rangeStats(sessions: FzSession[], days: number) {
  const t = todayKey();
  const keys = Array.from({ length: days }, (_, i) => addDays(t, -(days - 1 - i)));
  const rows = keys.map((k) => {
    const s = sessions.find((x) => x.date === k);
    return { date: k, minutes: s?.minutes ?? 0, todos: s?.todos ?? 0 };
  });
  const total = rows.reduce((a, r) => a + r.minutes, 0);
  const todos = rows.reduce((a, r) => a + r.todos, 0);
  const activeDays = rows.filter((r) => r.minutes > 0).length;
  const best = rows.reduce((a, r) => (r.minutes > a.minutes ? r : a), rows[0]);
  return { rows, total, todos, activeDays, best, average: total / days };
}
