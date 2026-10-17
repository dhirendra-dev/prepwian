// Lightweight client-side performance logger.
// - Long tasks (>50ms blocking main thread)
// - Slow network requests (resource timings >800ms, or fetch >800ms)
// - Navigation timing summary
// Opt-in: ?debug=1 in URL, or localStorage.setItem("perf:debug","1").

export type PerfEntry = {
  id: string;
  kind: "longtask" | "network" | "navigation" | "render";
  label: string;
  duration: number; // ms
  at: number; // epoch ms
  meta?: Record<string, unknown>;
};

const MAX_ENTRIES = 200;
const SLOW_NET_MS = 800;
const SLOW_RENDER_MS = 50;

type Listener = (entries: PerfEntry[]) => void;

class PerfStore {
  entries: PerfEntry[] = [];
  listeners = new Set<Listener>();
  enabled = false;
  started = false;

  add(e: Omit<PerfEntry, "id" | "at">) {
    if (!this.enabled) return;
    const entry: PerfEntry = {
      ...e,
      id: Math.random().toString(36).slice(2, 10),
      at: Date.now(),
    };
    this.entries = [entry, ...this.entries].slice(0, MAX_ENTRIES);
    this.listeners.forEach((l) => l(this.entries));
  }

  clear() {
    this.entries = [];
    this.listeners.forEach((l) => l(this.entries));
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this.entries);
    return () => this.listeners.delete(l);
  }
}

export const perfStore = new PerfStore();

export function isPerfDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("debug") === "1") {
      localStorage.setItem("perf:debug", "1");
      return true;
    }
    if (url.searchParams.get("debug") === "0") {
      localStorage.removeItem("perf:debug");
      return false;
    }
    return localStorage.getItem("perf:debug") === "1";
  } catch {
    return false;
  }
}

export function startPerfLogger() {
  if (typeof window === "undefined") return;
  if (perfStore.started) return;
  perfStore.enabled = isPerfDebugEnabled();
  perfStore.started = true;
  if (!perfStore.enabled) return;

  // Navigation timing
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav) {
      perfStore.add({
        kind: "navigation",
        label: "Initial load",
        duration: Math.round(nav.duration),
        meta: {
          dom: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          ttfb: Math.round(nav.responseStart - nav.startTime),
        },
      });
    }
  } catch { /* noop */ }

  // Resource timings (network)
  try {
    const ro = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const r = entry as PerformanceResourceTiming;
        if (r.duration < SLOW_NET_MS) continue;
        let url = r.name;
        try { url = new URL(r.name).pathname; } catch { /* keep */ }
        perfStore.add({
          kind: "network",
          label: url,
          duration: Math.round(r.duration),
          meta: {
            initiator: r.initiatorType,
            size: r.transferSize,
          },
        });
      }
    });
    ro.observe({ type: "resource", buffered: true });
  } catch { /* noop */ }

  // Long tasks (slow renders / main-thread blocks)
  try {
    const lo = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < SLOW_RENDER_MS) continue;
        perfStore.add({
          kind: "longtask",
          label: "Main thread blocked",
          duration: Math.round(entry.duration),
        });
      }
    });
    lo.observe({ type: "longtask", buffered: true });
  } catch { /* longtask unsupported */ }

  // Wrap fetch to time API calls (catches abort/errors too)
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const start = performance.now();
    let url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    try {
      const res = await origFetch(input, init);
      const dur = performance.now() - start;
      if (dur >= SLOW_NET_MS) {
        try { url = new URL(url, window.location.origin).pathname; } catch { /* keep */ }
        perfStore.add({
          kind: "network",
          label: url,
          duration: Math.round(dur),
          meta: { status: res.status, method: init?.method ?? "GET" },
        });
      }
      return res;
    } catch (err) {
      const dur = performance.now() - start;
      perfStore.add({
        kind: "network",
        label: url + " (failed)",
        duration: Math.round(dur),
        meta: { error: String(err) },
      });
      throw err;
    }
  };
}

export function recordRender(componentLabel: string, actualDuration: number) {
  if (actualDuration < SLOW_RENDER_MS) return;
  perfStore.add({
    kind: "render",
    label: componentLabel,
    duration: Math.round(actualDuration),
  });
}
