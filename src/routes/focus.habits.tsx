import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Check, Plus, Repeat, Trash2 } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { addDays, habitRateThisWeek, todayKey, uid, updateFocusZone, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/habits")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Habits — Focus Zone" },
      { name: "twitter:description", content: "Daily and weekly habit tracking with a 7-day strip." },
      { title: "Habits — Focus Zone" },
      {
        name: "description",
        content: "Build daily and weekly study habits in Focus Zone with a 7-day streak strip and weekly completion rate.",
      },
      { property: "og:title", content: "Habits — Focus Zone" },
      { property: "og:description", content: "Daily and weekly habit tracking with a 7-day strip." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const { state } = useFocusZone();
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<"daily" | "weekly">("daily");

  if (!state) return <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />;

  const today = todayKey();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));

  const add = () => {
    const t = title.trim();
    if (t.length < 2) return;
    updateFocusZone((s) => ({
      ...s,
      habits: [
        ...s.habits,
        { id: uid(), title: t, cadence, targetPerWeek: cadence === "daily" ? 7 : 1, history: [], createdAt: Date.now() },
      ],
    }));
    setTitle("");
  };
  const toggle = (id: string, day: string) =>
    updateFocusZone((s) => ({
      ...s,
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, history: h.history.includes(day) ? h.history.filter((d) => d !== day) : [...h.history, day] } : h,
      ),
    }));
  const remove = (id: string) => updateFocusZone((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  return (
    <div className="space-y-3">
      <GlassSurface className="p-4">
        <h1 className="font-display text-xl font-bold">Habits</h1>
        <p className="text-sm text-muted-foreground">Small repeatable wins — tracked privately in this browser.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Revise formulas for 10 minutes"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            aria-label="Cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as "daily" | "weekly")}
            className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            onClick={add}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </GlassSurface>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.habits.map((h) => {
          const rate = habitRateThisWeek(h);
          const doneToday = h.history.includes(today);
          return (
            <GlassSurface key={h.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold">{h.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                    <Repeat className="h-3.5 w-3.5" /> {h.cadence} · target {h.targetPerWeek}/week
                  </p>
                </div>
                <button
                  aria-label={`Delete ${h.title}`}
                  onClick={() => remove(h.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rate}%` }} />
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums">{rate}%</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-1">
                {week.map((d) => {
                  const on = h.history.includes(d);
                  return (
                    <button
                      key={d}
                      aria-label={`Toggle ${h.title} on ${d}`}
                      aria-pressed={on}
                      onClick={() => toggle(h.id, d)}
                      className={`grid h-8 w-8 place-items-center rounded-lg border text-[10px] font-semibold transition-colors ${
                        on ? "border-primary/50 bg-primary/20 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      {on ? <Check className="h-3.5 w-3.5" /> : new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "narrow" })}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => toggle(h.id, today)}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  doneToday ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 hover:bg-muted/60"
                }`}
              >
                <CalendarCheck className="h-4 w-4" /> {doneToday ? "Done today" : "Mark today"}
              </button>
            </GlassSurface>
          );
        })}
      </div>
    </div>
  );
}
