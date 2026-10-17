import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ChevronRight,
  Flame,
  Pause,
  Play,
  Plus,
  Square,
  Target,
  Trophy,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import {
  completeTodo,
  fmtClock,
  fmtMinutes,
  liveElapsed,
  pauseTimer,
  prettyDate,
  rangeStats,
  startTodo,
  stopTimer,
  todayKey,
  useFocusZone,
} from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Focus Zone Dashboard — timer & today's tasks" },
      { name: "twitter:description", content: "A mobile-first deep-work timer with tasks, streaks and live progress." },
      { title: "Focus Zone Dashboard — timer & today's tasks" },
      {
        name: "description",
        content: "Run a deep-work timer, see today's tasks, track your streak and review progress.",
      },
      { property: "og:title", content: "Focus Zone Dashboard — timer & today's tasks" },
      {
        property: "og:description",
        content: "A mobile-first deep-work timer with tasks, streaks and live progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FocusDashboard,
});

function FocusDashboard() {
  const { state } = useFocusZone();
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 500);
    return () => clearInterval(interval);
  }, []);

  if (!state) return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;

  const timer = state.timer;
  const active = state.todos.find((todo) => todo.id === timer.todoId) ?? null;
  const open = state.todos.filter((todo) => todo.status !== "done" && todo.status !== "failed");
  const today = state.todos.filter(
    (todo) => todo.deadline === todayKey() && todo.status !== "done" && todo.status !== "failed",
  );
  const elapsed = liveElapsed(timer);
  const targetSec = Math.max(60, (active?.estimateMin ?? 25) * 60);
  const remaining = active ? Math.max(0, targetSec - elapsed) : 0;
  const pct = active ? Math.min(1, elapsed / targetSec) : 0;
  const stats = rangeStats(state.sessions, 7);
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <section className="px-1 pt-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{greeting}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Make today count.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {today.length
                ? `${today.length} task${today.length === 1 ? "" : "s"} waiting for you.`
                : "A clear desk is a strong start."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-2 text-xs font-bold text-orange-600 dark:text-orange-300">
            <Flame className="h-4 w-4" />
            {state.streak}
          </div>
        </div>
      </section>

      <GlassSurface className="overflow-hidden p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Deep work timer
            </p>
            <p className="mt-1 max-w-[15rem] truncate text-sm font-semibold">
              {active?.title ?? "Pick a task to begin"}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${timer.running ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {timer.running ? "Running" : "Ready"}
          </span>
        </div>
        <div className="mt-5 flex flex-col items-center">
          <div className="relative grid h-52 w-52 place-items-center sm:h-60 sm:w-60">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                strokeWidth="8"
                className="stroke-muted"
              />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-primary transition-[stroke-dashoffset] duration-500"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - pct)}
              />
            </svg>
            <div className="relative text-center">
              <div className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">
                {fmtClock(remaining)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {active ? `${active.estimateMin} min goal` : "No task selected"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              aria-label="Stop and save timer"
              onClick={stopTimer}
              disabled={!active}
              className="grid h-11 w-11 place-items-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-muted disabled:opacity-40"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={timer.running ? "Pause timer" : "Start timer"}
              onClick={() => active && (timer.running ? pauseTimer() : startTodo(active.id))}
              disabled={!active}
              className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-40"
            >
              {timer.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <Link
              to="/focus/create"
              aria-label="Create a new task"
              className="grid h-11 w-11 place-items-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </GlassSurface>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat
          label="This week"
          value={fmtMinutes(stats.total)}
          icon={<Flame className="h-4 w-4 text-orange-500" />}
        />
        <Stat
          label="Completed"
          value={String(stats.todos)}
          icon={<Check className="h-4 w-4 text-emerald-500" />}
        />
        <Stat
          label="Active days"
          value={`${stats.activeDays}/7`}
          icon={<Target className="h-4 w-4 text-primary" />}
        />
      </div>

      <GlassSurface className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Today&apos;s plan</h2>
            <p className="text-xs text-muted-foreground">
              {open.length} open task{open.length === 1 ? "" : "s"} in your queue
            </p>
          </div>
          <Link
            to="/focus/todos"
            className="flex items-center gap-0.5 text-xs font-bold text-primary"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {open.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <Trophy className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-2 text-sm font-semibold">You&apos;re all clear.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a task when you&apos;re ready for the next win.
            </p>
            <Link
              to="/focus/create"
              className="mt-3 inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> New task
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {open.slice(0, 5).map((todo) => {
              const spent = todo.id === timer.todoId ? liveElapsed(timer) : todo.spentSec;
              const progress = Math.min(100, (spent / 60 / Math.max(1, todo.estimateMin)) * 100);
              const running = todo.id === timer.todoId && timer.running;
              return (
                <li
                  key={todo.id}
                  className={`rounded-2xl border p-3 ${running ? "border-primary/40 bg-primary/5" : "border-border/70"}`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={running ? `Pause ${todo.title}` : `Start ${todo.title}`}
                      onClick={() => (running ? pauseTimer() : startTodo(todo.id))}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 text-primary transition active:scale-95"
                    >
                      {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{todo.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {running ? "In progress" : "Ready"} ·{" "}
                        {todo.deadline === todayKey()
                          ? "Due today"
                          : `Due ${prettyDate(todo.deadline)}`}{" "}
                        · {fmtMinutes(todo.estimateMin)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Complete ${todo.title}`}
                      onClick={() => completeTodo(todo.id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {open.length > 5 ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            + {open.length - 5} more tasks in Todos
          </p>
        ) : null}
      </GlassSurface>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickAction
          to="/focus/habits"
          icon={<RepeatIcon />}
          title="Build consistency"
          text="Keep your daily habits moving."
        />
        <QuickAction
          to="/focus/stats"
          icon={<ChartIcon />}
          title="Review your week"
          text="See where your focus time went."
        />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <GlassSurface className="min-w-0 p-3.5 sm:p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 font-display text-xl font-bold sm:text-2xl">{value}</p>
    </GlassSurface>
  );
}
function QuickAction({
  to,
  icon,
  title,
  text,
}: {
  to: "/focus/habits" | "/focus/stats";
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/70 bg-card/45 p-4 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </Link>
  );
}
function RepeatIcon() {
  return <span className="text-sm font-black">↻</span>;
}
function ChartIcon() {
  return <span className="text-sm font-black">▥</span>;
}
