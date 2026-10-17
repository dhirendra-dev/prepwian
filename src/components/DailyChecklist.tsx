import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlarmClock,
  BarChart3,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { getTodayTasks, toggleDailyTask } from "@/lib/certificates.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Tab = "today" | "tomorrow";
type Priority = "low" | "medium" | "high";
type Subject = "Physics" | "Chemistry" | "Maths" | "Biology" | "General";
type Target = {
  id: string;
  title: string;
  done: boolean;
  task_date: string;
  sort_order: number;
  subject: Subject | null;
  priority: Priority;
  estimated_minutes: number | null;
};
type Goal = {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  goal_date: string;
};
type Habit = { studied: boolean; practiced: boolean; revised: boolean };

function localDateKey(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dateLabel(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
function weekKeys() {
  return Array.from({ length: 7 }, (_, i) => localDateKey(i - 6));
}
const subjects: Subject[] = ["Physics", "Chemistry", "Maths", "Biology", "General"];
const priorityMeta: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "text-rose-600 dark:text-rose-300 bg-rose-500/10" },
  medium: { label: "Medium", className: "text-amber-600 dark:text-amber-300 bg-amber-500/10" },
  low: { label: "Low", className: "text-sky-600 dark:text-sky-300 bg-sky-500/10" },
};
// The migration adds these columns; this cast keeps the UI buildable until generated types are refreshed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function StudyPlan({ children }: { children: React.ReactNode }) {
  return (
    <div aria-label="Study Plan" className="min-w-0 space-y-4">
      <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-cyan-300">
        Study Plan
      </h3>
      {children}
    </div>
  );
}

export function StudyInsights({ children }: { children: React.ReactNode }) {
  return (
    <aside aria-label="Study Insights" className="min-w-0 space-y-4">
      <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-cyan-300">
        Study Insights
      </h3>
      {children}
    </aside>
  );
}

export function DailyChecklist({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const fetchTasks = useServerFn(getTodayTasks);
  const toggleFn = useServerFn(toggleDailyTask);
  const [tab, setTab] = useState<Tab>("today");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    subject: "General" as Subject,
    priority: "medium" as Priority,
    minutes: "",
  });
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("20");
  const today = localDateKey();
  const activeDate = tab === "today" ? today : localDateKey(1);

  const habits = useQuery({
    queryKey: ["today-tasks", userId],
    queryFn: () => fetchTasks(),
    enabled: Boolean(session?.access_token),
    retry: 1,
  });
  const targets = useQuery({
    queryKey: ["command-center-targets", userId, activeDate],
    queryFn: async () => {
      const { data, error } = await db
        .from("user_daily_targets")
        .select("id,title,done,task_date,sort_order,subject,priority,estimated_minutes")
        .eq("user_id", userId)
        .eq("task_date", activeDate)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Target[];
    },
    enabled: Boolean(userId),
  });
  const insights = useQuery({
    queryKey: ["command-center-insights", userId, today],
    queryFn: async () => {
      const keys = weekKeys();
      const [targetRes, habitRes] = await Promise.all([
        db
          .from("user_daily_targets")
          .select("task_date,done")
          .eq("user_id", userId)
          .gte("task_date", keys[0])
          .lte("task_date", keys[6]),
        db
          .from("daily_tasks")
          .select("task_date,studied,practiced,revised")
          .eq("user_id", userId)
          .gte("task_date", keys[0])
          .lte("task_date", keys[6]),
      ]);
      if (targetRes.error) throw targetRes.error;
      if (habitRes.error) throw habitRes.error;
      const byDate = new Map(keys.map((key) => [key, { total: 0, done: 0, habits: 0 }]));
      (targetRes.data ?? []).forEach((row: { task_date: string; done: boolean }) => {
        const day = byDate.get(row.task_date);
        if (day) {
          day.total++;
          if (row.done) day.done++;
        }
      });
      (habitRes.data ?? []).forEach((row: Habit & { task_date: string }) => {
        const day = byDate.get(row.task_date);
        if (day) day.habits = [row.studied, row.practiced, row.revised].filter(Boolean).length;
      });
      return keys.map((date) => ({ date, ...byDate.get(date)! }));
    },
    enabled: Boolean(userId),
  });
  const goals = useQuery({
    queryKey: ["study-goals", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("study_goals")
        .select("id,title,target_value,current_value,goal_date")
        .eq("user_id", userId)
        .eq("goal_date", today)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
    enabled: Boolean(userId),
  });
  const list = targets.data ?? [];
  const habitToday = habits.data?.today as Habit | undefined;
  const habitDone = [habitToday?.studied, habitToday?.practiced, habitToday?.revised].filter(
    Boolean,
  ).length;
  const completed = list.filter((task) => task.done).length;
  const progress = list.length ? Math.round((completed / list.length) * 100) : 0;
  const activity = insights.data ?? [];
  const activeDays = activity.filter((day) => day.done || day.habits).length;
  const currentStreak = habits.data?.streak?.current ?? 0;
  const longestStreak = habits.data?.streak?.longest ?? 0;
  const estimatedTotal = list.reduce((sum, task) => sum + (task.estimated_minutes ?? 0), 0);
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["command-center-targets", userId] });
    void qc.invalidateQueries({ queryKey: ["command-center-insights", userId] });
    void qc.invalidateQueries({ queryKey: ["study-goals", userId] });
  };

  const saveTask = useMutation({
    mutationFn: async () => {
      const title = draft.title.trim();
      if (!title) throw new Error("Add a task title first.");
      const payload = {
        title,
        subject: draft.subject,
        priority: draft.priority,
        estimated_minutes: draft.minutes
          ? Math.max(1, Math.min(1440, Number(draft.minutes)))
          : null,
      };
      const result = editingId
        ? await db
            .from("user_daily_targets")
            .update(payload)
            .eq("id", editingId)
            .eq("user_id", userId)
        : await db.from("user_daily_targets").insert({
            ...payload,
            user_id: userId,
            task_date: activeDate,
            sort_order: (list.length + 1) * 10,
          });
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      setDraft({ title: "", subject: "General", priority: "medium", minutes: "" });
      setEditingId(null);
      invalidate();
      toast.success(editingId ? "Task updated" : "Task added");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save task"),
  });
  const toggleTask = useMutation({
    mutationFn: async (task: Target) => {
      const { error } = await db
        .from("user_daily_targets")
        .update({ done: !task.done })
        .eq("id", task.id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onMutate: async (task) => {
      const key = ["command-center-targets", userId, activeDate];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Target[]>(key);
      qc.setQueryData<Target[]>(key, (old) =>
        (old ?? []).map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)),
      );
      return { key, previous };
    },
    onError: (_e, _t, context) => {
      if (context) qc.setQueryData(context.key, context.previous);
      toast.error("Could not update task");
    },
    onSettled: invalidate,
  });
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("user_daily_targets")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Task removed");
    },
    onError: () => toast.error("Could not remove task"),
  });
  const toggleHabit = useMutation({
    mutationFn: (input: { kind: "studied" | "practiced" | "revised"; value: boolean }) =>
      toggleFn({ data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["today-tasks", userId] });
      void qc.invalidateQueries({ queryKey: ["command-center-insights", userId] });
    },
    onError: () => toast.error("Could not update daily habit"),
  });
  const saveGoal = useMutation({
    mutationFn: async () => {
      const title = goalTitle.trim();
      const target = Number(goalTarget);
      if (!title || !Number.isFinite(target) || target < 1)
        throw new Error("Add a goal and a valid target.");
      const { error } = await db
        .from("study_goals")
        .insert({ user_id: userId, title, target_value: Math.floor(target), goal_date: today });
      if (error) throw error;
    },
    onSuccess: () => {
      setGoalTitle("");
      invalidate();
      toast.success("Goal added");
    },
    onError: (e: Error) => toast.error(e.message || "Could not add goal"),
  });
  const updateGoal = useMutation({
    mutationFn: async (goal: Goal) => {
      const { error } = await db
        .from("study_goals")
        .update({ current_value: Math.min(goal.target_value, goal.current_value + 1) })
        .eq("id", goal.id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not update goal"),
  });
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("study_goals").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not delete goal"),
  });
  const insightsLabel = useMemo(
    () =>
      activeDays >= 5
        ? "Strong weekly rhythm"
        : activeDays >= 3
          ? "Momentum is building"
          : "Start your weekly rhythm",
    [activeDays],
  );

  return (
    <section
      className="relative overflow-hidden rounded-[24px] border border-sky-500/15 bg-gradient-to-br from-card via-card to-sky-500/[0.045] p-4 shadow-soft sm:p-5"
      aria-labelledby="study-command-center-title"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <header className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" /> Study systems
          </p>
          <h2
            id="study-command-center-title"
            className="mt-1 font-display text-xl font-black tracking-tight sm:text-2xl"
          >
            Study Command Center
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A clear plan for {tab === "today" ? "today" : "tomorrow"}.
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-background/70 p-1 text-xs font-bold"
          role="tablist"
          aria-label="Study plan day"
        >
          {(["today", "tomorrow"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => {
                setTab(value);
                setEditingId(null);
              }}
              className={`rounded-lg px-3 py-2 transition ${tab === value ? "bg-sky-600 text-white shadow-sm dark:bg-cyan-300 dark:text-slate-950" : "text-muted-foreground hover:text-foreground"}`}
            >
              {value === "today" ? "Today" : "Tomorrow"}
            </button>
          ))}
        </div>
      </header>
      <div className="relative mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)] lg:items-start">
        <StudyPlan>
          <div className="relative mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(220px,.8fr)]">
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Daily progress
                  </p>
                  <p className="mt-1 text-sm font-semibold">{dateLabel(activeDate)}</p>
                </div>
                <strong className="text-2xl font-black tabular-nums text-sky-600 dark:text-cyan-300">
                  {progress}%
                </strong>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
                <span>
                  {completed} completed · {Math.max(0, list.length - completed)} remaining
                </span>
                <span>
                  {estimatedTotal ? `${estimatedTotal} min planned` : "No time estimates yet"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-background/65 p-4 sm:grid-cols-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Streak
                  </p>
                  <p className="font-bold tabular-nums">{currentStreak} days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-cyan-300">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Best</p>
                  <p className="font-bold tabular-nums">{longestStreak} days</p>
                </div>
              </div>
            </div>
          </div>
          {targets.error || insights.error || goals.error ? (
            <div className="relative mt-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
              Could not load your study data. Check your connection and try again.
            </div>
          ) : null}
          <div className="min-w-0 rounded-2xl border border-border bg-background/55 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Smart checklist
                </p>
                <p className="mt-1 text-sm font-bold">
                  {list.length ? `${completed} of ${list.length} locked in` : "Build your plan"}
                </p>
              </div>
              <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                {tab === "today" ? `${habitDone}/3 habits` : "Plan ahead"}
              </span>
            </div>
            {tab === "today" ? (
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { key: "studied", label: "Study", hint: "Learn" },
                    { key: "practiced", label: "Practice", hint: "Apply" },
                    { key: "revised", label: "Revise", hint: "Recall" },
                  ] as const
                ).map((habit) => {
                  const done = Boolean(habitToday?.[habit.key]);
                  return (
                    <button
                      key={habit.key}
                      type="button"
                      disabled={toggleHabit.isPending}
                      onClick={() => toggleHabit.mutate({ kind: habit.key, value: !done })}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition hover:border-sky-500/50 ${done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"}`}
                    >
                      <span className={done ? "text-emerald-500" : "text-muted-foreground"}>
                        {done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </span>
                      <span>
                        <strong className="block">{habit.label}</strong>
                        <span className="text-[10px] text-muted-foreground">{habit.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveTask.mutate();
              }}
              className="rounded-xl border border-dashed border-sky-500/30 bg-sky-500/[0.035] p-2.5"
            >
              <div className="flex gap-2">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((old) => ({ ...old, title: e.target.value }))}
                  maxLength={200}
                  placeholder={
                    editingId ? "Update task title…" : "Add a task, e.g. Solve 20 limits"
                  }
                  className="min-w-0 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground/70"
                  aria-label="Task title"
                />
                <button
                  type="submit"
                  disabled={saveTask.isPending || !draft.title.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-600 text-white disabled:opacity-50 dark:bg-cyan-300 dark:text-slate-950"
                >
                  {saveTask.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-[1fr_1fr_110px]">
                <select
                  value={draft.subject}
                  onChange={(e) =>
                    setDraft((old) => ({ ...old, subject: e.target.value as Subject }))
                  }
                  className="min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] text-foreground"
                >
                  <option value="General">General</option>
                  {subjects
                    .filter((s) => s !== "General")
                    .map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                </select>
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft((old) => ({ ...old, priority: e.target.value as Priority }))
                  }
                  className="min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] text-foreground"
                >
                  {(Object.keys(priorityMeta) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {priorityMeta[p].label} priority
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <AlarmClock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={draft.minutes}
                    onChange={(e) => setDraft((old) => ({ ...old, minutes: e.target.value }))}
                    placeholder="Minutes"
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-7 pr-1 text-[11px] text-foreground outline-none"
                    aria-label="Estimated minutes"
                  />
                </div>
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDraft({ title: "", subject: "General", priority: "medium", minutes: "" });
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"
                >
                  <X className="h-3 w-3" /> Cancel edit
                </button>
              ) : null}
            </form>
            <div className="mt-3 space-y-2">
              {targets.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your plan…
                </div>
              ) : list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Target className="mx-auto h-6 w-6 text-sky-500/70" />
                  <p className="mt-2 text-sm font-semibold">Your plan is clear</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add your first task above to make this day intentional.
                  </p>
                </div>
              ) : (
                list.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-2.5 rounded-xl border p-2.5 transition ${task.done ? "border-emerald-500/20 bg-emerald-500/[0.035]" : "border-border bg-card"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask.mutate(task)}
                      disabled={toggleTask.isPending}
                      className={`shrink-0 ${task.done ? "text-emerald-500" : "text-muted-foreground hover:text-sky-500"}`}
                      aria-label={task.done ? `Undo ${task.title}` : `Complete ${task.title}`}
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${task.done ? "text-muted-foreground line-through" : ""}`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-sky-700 dark:text-cyan-300">
                          {task.subject ?? "General"}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 ${priorityMeta[task.priority ?? "medium"].className}`}
                        >
                          {priorityMeta[task.priority ?? "medium"].label}
                        </span>
                        {task.estimated_minutes ? <span>{task.estimated_minutes} min</span> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(task.id);
                          setDraft({
                            title: task.title,
                            subject: task.subject ?? "General",
                            priority: task.priority ?? "medium",
                            minutes: task.estimated_minutes ? String(task.estimated_minutes) : "",
                          });
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${task.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask.mutate(task.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </StudyPlan>
        <StudyInsights>
          <div className="rounded-2xl border border-border bg-background/55 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Weekly rhythm
                </p>
                <p className="mt-1 text-sm font-bold">{insightsLabel}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-sky-500" />
            </div>
            <div className="mt-4 grid grid-cols-7 items-end gap-1.5">
              {activity.length ? (
                activity.map((day) => {
                  const height = Math.max(8, Math.min(42, day.done * 9 + day.habits * 8));
                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-1"
                      title={`${day.date}: ${day.done} tasks, ${day.habits}/3 habits`}
                    >
                      <div
                        className={`w-full rounded-t-md ${day.done || day.habits ? "bg-gradient-to-t from-sky-600 to-cyan-300" : "bg-muted"}`}
                        style={{ height }}
                      />
                      <span
                        className={`text-[9px] ${day.date === today ? "font-bold text-sky-600 dark:text-cyan-300" : "text-muted-foreground"}`}
                      >
                        {new Date(`${day.date}T12:00:00`)
                          .toLocaleDateString(undefined, { weekday: "short" })
                          .slice(0, 2)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-7 h-12 animate-pulse rounded-lg bg-muted" />
              )}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
              <span>{activeDays}/7 active days</span>
              <span>{activity.reduce((sum, day) => sum + day.done, 0)} tasks done</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background/55 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Study goals
                </p>
                <p className="mt-1 text-sm font-bold">Make progress visible</p>
              </div>
              <Target className="h-5 w-5 text-sky-500" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveGoal.mutate();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Physics PYQs"
                maxLength={120}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none"
                aria-label="Goal title"
              />
              <input
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                type="number"
                min="1"
                max="100000"
                className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
                aria-label="Goal target"
              />
              <button
                type="submit"
                disabled={saveGoal.isPending || !goalTitle.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-600 text-white disabled:opacity-50 dark:bg-cyan-300 dark:text-slate-950"
                aria-label="Add goal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {goals.isLoading ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
              ) : goals.data?.length ? (
                goals.data.map((goal) => (
                  <div key={goal.id} className="rounded-xl border border-border bg-card p-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateGoal.mutate(goal)}
                        disabled={goal.current_value >= goal.target_value}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${goal.current_value >= goal.target_value ? "border-emerald-500 bg-emerald-500 text-white" : "border-sky-500/40 text-sky-600 hover:bg-sky-500/10"}`}
                        aria-label={`Update ${goal.title}`}
                      >
                        {goal.current_value >= goal.target_value ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                        {goal.title}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {goal.current_value}/{goal.target_value}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteGoal.mutate(goal.id)}
                        className="rounded p-1 text-muted-foreground hover:text-rose-600"
                        aria-label={`Delete ${goal.title}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width: `${Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-2 text-center text-[11px] text-muted-foreground">
                  No goals for today yet.
                </p>
              )}
            </div>
          </div>
        </StudyInsights>
      </div>
      <div className="relative mt-4 flex flex-wrap justify-between gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-500" /> Progress is calculated from your saved
          tasks and habits.
        </span>
        <span className="inline-flex items-center gap-1">
          <Undo2 className="h-3.5 w-3.5" /> Tap a completed task to undo
        </span>
      </div>
    </section>
  );
}
