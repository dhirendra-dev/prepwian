import { useEffect, useState } from "react";
import { Activity, X, Trash2 } from "lucide-react";
import { perfStore, isPerfDebugEnabled, type PerfEntry } from "@/lib/perf-logger";

const KIND_COLORS: Record<PerfEntry["kind"], string> = {
  longtask: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  network: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  navigation: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  render: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function PerfDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [filter, setFilter] = useState<"all" | PerfEntry["kind"]>("all");

  useEffect(() => {
    setEnabled(isPerfDebugEnabled());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const unsub = perfStore.subscribe(setEntries);
    return () => { unsub(); };
  }, [enabled]);

  // Alt+P toggles the panel
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  if (!enabled) return null;

  const visible = filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const slowCount = entries.filter((e) => e.duration >= 500).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-2 ring-background hover:scale-105 transition-transform"
        aria-label="Toggle performance debug panel"
        title="Perf debug (Alt+P)"
      >
        <Activity className="h-5 w-5" />
        {slowCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {slowCount > 99 ? "99+" : slowCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-[1000] flex h-[60vh] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold">Perf debug</span>
              <span className="text-xs text-muted-foreground">{entries.length} events</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => perfStore.clear()}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                title="Clear"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-1.5 text-[11px]">
            {(["all", "network", "longtask", "render", "navigation"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`shrink-0 rounded-full px-2.5 py-1 font-medium transition-colors ${
                  filter === k
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No events yet. Slow renders &gt;{50}ms and slow network &gt;{800}ms appear here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((e) => (
                  <li key={e.id} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${KIND_COLORS[e.kind]}`}>
                            {e.kind}
                          </span>
                          <span className="truncate text-xs font-medium">{e.label}</span>
                        </div>
                        {e.meta && (
                          <div className="mt-1 truncate text-[10px] text-muted-foreground">
                            {Object.entries(e.meta).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                          </div>
                        )}
                      </div>
                      <span
                        className={`shrink-0 font-mono text-xs font-semibold ${
                          e.duration >= 1500
                            ? "text-destructive"
                            : e.duration >= 500
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {e.duration}ms
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            Toggle with <kbd className="rounded border border-border px-1">Alt</kbd>+<kbd className="rounded border border-border px-1">P</kbd>. Append <code>?debug=0</code> to disable.
          </div>
        </div>
      )}
    </>
  );
}
