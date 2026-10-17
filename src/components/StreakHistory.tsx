import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, TrendingUp, CalendarDays } from "lucide-react";

type Row = { task_date: string; studied: boolean; practiced: boolean; revised: boolean };

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last30Dates(): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(ymd(d));
  }
  return out;
}

export function StreakHistory({ userId }: { userId: string }) {
  const dates = useMemo(last30Dates, []);
  const since = dates[0];

  const q = useQuery({
    queryKey: ["streak-history", userId, since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("task_date,studied,practiced,revised")
        .eq("user_id", userId)
        .gte("task_date", since)
        .order("task_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const byDate = useMemo(() => {
    const m = new Map<string, Row>();
    for (const r of q.data ?? []) m.set(r.task_date, r);
    return m;
  }, [q.data]);

  // Build per-day score and running streak progression
  const cells = useMemo(() => {
    let run = 0;
    return dates.map((d) => {
      const r = byDate.get(d);
      const score = r ? Number(r.studied) + Number(r.practiced) + Number(r.revised) : 0;
      const complete = score === 3;
      run = complete ? run + 1 : 0;
      return { date: d, score, complete, streak: run };
    });
  }, [dates, byDate]);

  const totalComplete = cells.filter((c) => c.complete).length;
  const peakStreak = cells.reduce((m, c) => Math.max(m, c.streak), 0);
  const currentStreak = cells[cells.length - 1]?.streak ?? 0;
  const activeDays = cells.filter((c) => c.score > 0).length;

  // Group cells into weeks (columns of 7) for a heatmap
  // Pad start so first column aligns to weekday
  const firstDate = new Date(dates[0]);
  const padStart = firstDate.getDay(); // 0..6 (Sun..Sat)
  const padded: ({ date: string; score: number; complete: boolean; streak: number } | null)[] = [
    ...Array(padStart).fill(null),
    ...cells,
  ];
  const columns: (typeof padded)[] = [];
  for (let i = 0; i < padded.length; i += 7) columns.push(padded.slice(i, i + 7));

  const tone = (score: number) => {
    if (score === 0) return "bg-muted/60";
    if (score === 1) return "bg-emerald-500/25";
    if (score === 2) return "bg-emerald-500/55";
    return "bg-emerald-500";
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold truncate">Streak History</h2>
          <p className="text-xs text-muted-foreground">Last 30 days of checklist completion.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600">
          <Flame className="h-3.5 w-3.5" /> {currentStreak}d
        </div>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat icon={TrendingUp} label="Peak streak" value={`${peakStreak}d`} />
        <Stat icon={Flame} label="Full days" value={`${totalComplete}/30`} />
        <Stat icon={CalendarDays} label="Active days" value={`${activeDays}/30`} />
      </div>

      {q.isLoading ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-1">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {col.map((c, ri) =>
                  c ? (
                    <div
                      key={c.date}
                      title={`${c.date} · ${c.score}/3${c.complete ? ` · streak ${c.streak}d` : ""}`}
                      className={`h-4 w-4 rounded-[3px] ${tone(c.score)} ${c.complete ? "ring-1 ring-emerald-600/60" : ""}`}
                    />
                  ) : (
                    <div key={`p-${ci}-${ri}`} className="h-4 w-4 rounded-[3px] opacity-0" />
                  ),
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>30d ago</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-sm bg-muted/60" />
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/25" />
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/55" />
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Streak progression sparkline */}
      {!q.isLoading && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Streak progression</span>
            <span>peak {peakStreak}d</span>
          </div>
          <div className="flex h-12 items-end gap-[2px]">
            {cells.map((c) => {
              const h = peakStreak > 0 ? Math.max(4, (c.streak / peakStreak) * 100) : 4;
              return (
                <div
                  key={c.date}
                  title={`${c.date} · streak ${c.streak}d`}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-sm ${c.streak > 0 ? "bg-gradient-to-t from-orange-500 to-amber-400" : "bg-muted"}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-2">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <div className="mt-1 text-sm font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
