import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Flame, Clock, Target } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudyAnalytics } from "@/lib/study-analytics.functions";

type Range = "today" | "week" | "month" | "all";

function formatHm(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function AnalyticsPanel() {
  const [range, setRange] = useState<Range>("week");
  const fetchAnalytics = useServerFn(getStudyAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["study-analytics", range],
    queryFn: () => fetchAnalytics({ data: { range } }),
    staleTime: 30_000,
  });

  const heatmap = data?.heatmap ?? [];
  const maxDay = Math.max(1, ...heatmap.map((d) => d.seconds));
  const subjects = Object.entries(data?.bySubject ?? {}).sort((a, b) => b[1] - a[1]);
  const dailyMax = Math.max(1, ...(data?.daily ?? []).map((d) => d.seconds));

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Study analytics
        </h2>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Focus time", value: formatHm(data?.totalSeconds ?? 0), icon: Clock },
          { label: "Sessions", value: String(data?.sessionCount ?? 0), icon: Target },
          { label: "Current streak", value: `${data?.currentStreak ?? 0}d`, icon: Flame },
          { label: "Longest streak", value: `${data?.longestStreak ?? 0}d`, icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>{label}</span>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-display text-xl font-bold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* Daily bar chart */}
      <div className="mt-6">
        <div className="text-xs font-semibold text-muted-foreground">Last 30 days</div>
        <div className="mt-2 flex h-24 items-end gap-[3px]">
          {(data?.daily ?? []).map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${formatHm(d.seconds)}`}
              className="flex-1 rounded-sm bg-primary/80 transition-all hover:bg-primary"
              style={{ height: `${Math.max(2, (d.seconds / dailyMax) * 100)}%` }}
            />
          ))}
        </div>
      </div>

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold text-muted-foreground">By subject</div>
          <div className="mt-2 space-y-2">
            {subjects.map(([name, secs]) => {
              const max = subjects[0][1] || 1;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{name}</span>
                    <span className="tabular-nums text-muted-foreground">{formatHm(secs)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(secs / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="mt-6">
        <div className="text-xs font-semibold text-muted-foreground">12-week focus heatmap</div>
        <div className="mt-2 grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridAutoColumns: "minmax(0, 1fr)" }}>
          {heatmap.map((d) => {
            const intensity = d.seconds === 0 ? 0 : Math.min(4, Math.ceil((d.seconds / maxDay) * 4));
            const bg = [
              "bg-muted",
              "bg-primary/25",
              "bg-primary/50",
              "bg-primary/75",
              "bg-primary",
            ][intensity];
            return (
              <div
                key={d.date}
                title={`${d.date}: ${formatHm(d.seconds)}`}
                className={`h-3 w-full rounded-sm ${bg} transition-colors`}
              />
            );
          })}
        </div>
      </div>

      {isLoading && <p className="mt-4 text-xs text-muted-foreground">Loading…</p>}
    </section>
  );
}
