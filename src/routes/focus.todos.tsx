import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Pause, Play, Plus, Trash2, X } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import {
  completeTodo,
  fmtClock,
  fmtMinutes,
  liveElapsed,
  pauseTimer,
  prettyDate,
  startTodo,
  todayKey,
  updateFocusZone,
  useFocusZone,
  type TodoStatus,
} from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/todos")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Todos — Focus Zone" },
      { name: "twitter:description", content: "Track, time and complete your study todos." },
      { title: "Todos — Focus Zone" },
      {
        name: "description",
        content: "Every Focus Zone todo in one place: filter by status, start the timer, mark done or drop what no longer matters.",
      },
      { property: "og:title", content: "Todos — Focus Zone" },
      { property: "og:description", content: "Track, time and complete your study todos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TodosPage,
});

const FILTERS = ["all", "running", "paused", "done", "failed"] as const;

function TodosPage() {
  const { state } = useFocusZone();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!state) return <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />;

  const timer = state.timer;
  const rows = state.todos.filter((t) => (filter === "all" ? true : t.status === filter));

  const setStatus = (id: string, status: TodoStatus) =>
    updateFocusZone((s) => ({ ...s, todos: s.todos.map((t) => (t.id === id ? { ...t, status } : t)) }));
  const remove = (id: string) =>
    updateFocusZone((s) => ({
      ...s,
      todos: s.todos.filter((t) => t.id !== id),
      timer: s.timer.todoId === id ? { todoId: null, running: false, startedAt: null, elapsedSec: 0 } : s.timer,
    }));

  return (
    <div className="space-y-3">
      <GlassSurface className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="font-display text-xl font-bold">Todos</h1>
          <p className="text-sm text-muted-foreground">{state.todos.length} total in this browser</p>
        </div>
        <Link
          to="/focus/create"
          className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" /> New todo
        </Link>
      </GlassSurface>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`liquid-lens-item shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <GlassSurface className="p-8 text-center text-sm text-muted-foreground">Nothing here yet.</GlassSurface>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => {
            const spent = t.id === timer.todoId ? liveElapsed(timer) : t.spentSec;
            const pct = Math.min(100, (spent / 60 / Math.max(1, t.estimateMin)) * 100);
            const running = t.id === timer.todoId && timer.running;
            const closed = t.status === "done" || t.status === "failed";
            return (
              <GlassSurface as="li" key={t.id} className="p-3.5">
                <div className="flex items-center gap-3">
                  {!closed && (
                    <button
                      aria-label={running ? `Pause ${t.title}` : `Start ${t.title}`}
                      onClick={() => (running ? pauseTimer() : startTodo(t.id))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition-transform active:scale-95"
                    >
                      {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${t.status === "done" ? "line-through opacity-60" : ""}`}>{t.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <span className="capitalize">{t.status}</span>
                      {" · "}
                      {t.deadline === todayKey() ? "Due today" : `Due ${prettyDate(t.deadline)}`}
                      {" · "}
                      {fmtClock(spent)} of {fmtMinutes(t.estimateMin)}
                      {t.tags.length > 0 && ` · ${t.tags.map((x) => `#${x}`).join(" ")}`}
                    </p>
                  </div>
                  {!closed && (
                    <>
                      <button
                        aria-label={`Complete ${t.title}`}
                        onClick={() => completeTodo(t.id)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Mark ${t.title} failed`}
                        onClick={() => setStatus(t.id, "failed")}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    aria-label={`Delete ${t.title}`}
                    onClick={() => remove(t.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </GlassSurface>
            );
          })}
        </ul>
      )}
    </div>
  );
}
