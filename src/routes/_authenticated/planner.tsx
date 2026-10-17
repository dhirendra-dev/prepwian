import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GlassSurface } from "@/components/GlassSurface";
import { supabase } from "@/integrations/supabase/client";
import { Check, Plus, Trash2, Circle, CheckCircle2, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Study Planner — JEE Prep Hub" },
      { name: "twitter:description", content: "A day-by-day, subject-wise planner for JEE aspirants." },

      { title: "Study Planner — JEE Prep Hub" },
      { name: "description", content: "Plan every study day subject by subject: Physics, Chemistry, Maths and more, with a weekly day strip and tick-off tasks." },
      { property: "og:title", content: "Study Planner — JEE Prep Hub" },
      { property: "og:description", content: "A day-by-day, subject-wise planner for JEE aspirants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: PlannerPage,
  errorComponent: ({ error }: { error: unknown }) => <div className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => <div className="p-6 text-sm text-muted-foreground">Not found.</div>,
});

type Task = {
  id: string;
  title: string;
  done: boolean;
  task_date: string;
  subject: string | null;
  sort_order: number;
};

const SUBJECTS = [
  { key: "physics", label: "Physics", bar: "bg-violet-500", ring: "border-violet-500 text-violet-600" },
  { key: "chemistry", label: "Chemistry", bar: "bg-rose-500", ring: "border-rose-500 text-rose-600" },
  { key: "mathematics", label: "Mathematics", bar: "bg-teal-500", ring: "border-teal-500 text-teal-600" },
  { key: "biology", label: "Biology", bar: "bg-amber-500", ring: "border-amber-500 text-amber-600" },
  { key: "english", label: "English", bar: "bg-sky-500", ring: "border-sky-500 text-sky-600" },
  { key: "other", label: "Other", bar: "bg-slate-400", ring: "border-slate-400 text-slate-500" },
] as const;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekDays(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday start
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function PlannerPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [anchor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [draft, setDraft] = useState<Record<string, string>>({});

  const days = useMemo(() => weekDays(anchor), [anchor]);
  const from = ymd(days[0]!);
  const to = ymd(days[6]!);

  const week = useQuery({
    queryKey: ["planner-week", user.id, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_daily_targets")
        .select("id,title,done,task_date,subject,sort_order")
        .eq("user_id", user.id)
        .gte("task_date", from)
        .lte("task_date", to)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const rows = week.data ?? [];
  const dayTasks = rows.filter((t) => t.task_date === selected);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["planner-week", user.id, from, to] });

  const addTask = useMutation({
    mutationFn: async ({ subject, title }: { subject: string; title: string }) => {
      const { error } = await supabase.from("user_daily_targets").insert({
        user_id: user.id,
        title: title.trim().slice(0, 200),
        task_date: selected,
        subject,
        sort_order: dayTasks.length * 10,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => { setDraft((p) => ({ ...p, [v.subject]: "" })); haptic("light"); invalidate(); },
    onError: (e: Error) => toast.error(e.message || "Could not add task"),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const { error } = await supabase.from("user_daily_targets").update({ done: !t.done }).eq("id", t.id);
      if (error) throw error;
    },
    onMutate: async (t) => {
      const key = ["planner-week", user.id, from, to];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old) => (old ?? []).map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
      haptic("success");
      return { prev, key };
    },
    onError: (_e, _t, ctx) => { if (ctx) qc.setQueryData(ctx.key, ctx.prev); toast.error("Could not update"); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_daily_targets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not delete"),
  });

  const selectedDate = new Date(`${selected}T00:00:00`);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <GlassSurface className="p-4 sm:p-5 dark:border-slate-700/80 dark:bg-slate-900/90">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Study Planner</p>
              <h1 className="truncate font-display text-2xl font-bold">
                <span className="text-liquid">
                  {selectedDate.toLocaleDateString(undefined, { weekday: "short" })}, {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
                </span>
              </h1>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </span>
          </header>

          {/* Week strip */}
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const key = ymd(d);
              const items = rows.filter((t) => t.task_date === key);
              const open = items.filter((t) => !t.done).length;
              const allDone = items.length > 0 && open === 0;
              const isSel = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { haptic("selection"); setSelected(key); }}
                  className="flex flex-col items-center gap-1 rounded-xl px-0.5 py-1 transition hover:bg-muted/50"
                >
                  <span className={`text-[10px] font-semibold ${isSel ? "text-foreground" : "text-muted-foreground"}`}>
                    {d.getDate()}.{d.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span
                    className={`grid h-8 w-full place-items-center rounded-lg text-xs font-bold transition ${
                      allDone
                        ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300"
                        : open > 0
                          ? "bg-primary/15 text-primary"
                          : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {allDone ? <Check className="h-4 w-4" /> : open > 0 ? open : "–"}
                  </span>
                  <span className={`h-0.5 w-6 rounded-full ${isSel ? "bg-foreground" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
        </GlassSurface>

        {week.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading your plan…
          </p>
        ) : (
          <GlassSurface className="divide-y divide-border/60 p-4 sm:p-5 dark:border-slate-700/80 dark:bg-slate-900/90">
            {SUBJECTS.map((s) => {
              const items = dayTasks.filter((t) => (t.subject ?? "other") === s.key);
              return (
                <section key={s.key} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-1 rounded-full ${s.bar}`} />
                    <h2 className="font-display text-base font-semibold">{s.label}</h2>
                    <span className="text-[11px] text-muted-foreground">
                      {items.filter((t) => t.done).length}/{items.length}
                    </span>
                  </div>

                  <ul className="mt-2 space-y-1">
                    {items.map((t) => (
                      <li key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => toggle.mutate(t)}
                          aria-label={t.done ? "Mark not done" : "Mark done"}
                          className="shrink-0"
                        >
                          {t.done
                            ? <CheckCircle2 className={`h-5 w-5 ${s.ring.split(" ")[1]}`} />
                            : <Circle className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <span className={`min-w-0 truncate text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>
                          {t.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove.mutate(t.id)}
                          aria-label="Delete task"
                          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = (draft[s.key] ?? "").trim();
                      if (!v) return;
                      addTask.mutate({ subject: s.key, title: v });
                    }}
                    className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                  >
                    <input
                      value={draft[s.key] ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, [s.key]: e.target.value }))}
                      maxLength={200}
                      placeholder={`Add ${s.label.toLowerCase()} task…`}
                      className="min-w-0 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/35"
                    />
                    <button
                      type="submit"
                      aria-label={`Add ${s.label} task`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                      disabled={!(draft[s.key] ?? "").trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </section>
              );
            })}
          </GlassSurface>
        )}
      </div>
    </AppShell>
  );
}
