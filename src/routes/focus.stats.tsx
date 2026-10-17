import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassSurface } from "@/components/GlassSurface";
import { fmtMinutes, prettyDate, rangeStats, useFocusZone } from "@/lib/focus-zone";

export const Route = createFileRoute("/focus/stats")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Stats — Focus Zone" },
      { name: "twitter:description", content: "Focus minutes, best day and completed todos over time." },
      { title: "Stats — Focus Zone" },
      {
        name: "description",
        content: "See how much you actually focused: daily minutes, weekly totals, best day and completed todos across 7, 14 or 28 days.",
      },
      { property: "og:title", content: "Stats — Focus Zone" },
      { property: "og:description", content: "Focus minutes, best day and completed todos over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatsPage,
});

const RANGES = [7, 14, 28] as const;

function StatsPage() {
  const { state } = useFocusZone();
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);

  if (!state) return <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />;

  const s = rangeStats(state.sessions, days);
  const max = Math.max(1, ...s.rows.map((r) => r.minutes));

  return (
    <div className="space-y-3">
      <GlassSurface className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="font-display text-xl font-bold">Stats</h1>
          <p className="text-sm text-muted-foreground">
            {s.total.toFixed(1)} min focused over the last {days} days
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`liquid-lens-item rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                days === d ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </GlassSurface>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total focus" value={fmtMinutes(s.total)} />
        <Stat label="Daily average" value={fmtMinutes(s.average)} />
        <Stat label="Todos done" value={String(s.todos)} />
        <Stat label="Active days" value={`${s.activeDays} of ${days}`} />
      </div>

      <GlassSurface className="p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Focus minutes</h2>
        <div className="mt-4 flex items-end gap-1 overflow-x-auto pb-1">
          {s.rows.map((r) => (
            <div key={r.date} className="flex min-w-[18px] flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] tabular-nums text-muted-foreground">{r.minutes > 0 ? Math.round(r.minutes) : ""}</span>
              <div className="flex h-40 w-full items-end justify-center rounded-lg bg-muted/40" title={`${prettyDate(r.date)} · ${Math.round(r.minutes)} min`}>
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-primary/50 to-primary transition-all"
                  style={{ height: `${Math.max(3, (r.minutes / max) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(`${r.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
        {s.best && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Best day: {prettyDate(s.best.date)} — {fmtMinutes(s.best.minutes)}
          </p>
        )}
      </GlassSurface>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <GlassSurface className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </GlassSurface>
  );
}
