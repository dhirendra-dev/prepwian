import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Clock3, Loader2, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type StudyDay = {
  key: string;
  label: string;
  minutes: number;
};

type Analytics = {
  days: StudyDay[];
  totalMinutes: number;
  completedTasks: number;
  averageAccuracy: number | null;
};

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function lastSevenDays() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: localDateKey(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
    };
  });
}

export function StudyAnalyticsWidget({ userId }: { userId: string }) {
  const analytics = useQuery<Analytics>({
    queryKey: ["dashboard-study-analytics", userId],
    queryFn: async () => {
      const days = lastSevenDays();
      const start = new Date(`${days[0].key}T00:00:00`);
      const end = new Date(`${days[6].key}T23:59:59.999`);
      const [sessionsRes, tasksRes, testsRes] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("ended_at,duration_seconds")
          .eq("user_id", userId)
          .gte("ended_at", start.toISOString())
          .lte("ended_at", end.toISOString()),
        supabase
          .from("user_daily_targets")
          .select("done")
          .eq("user_id", userId)
          .gte("task_date", days[0].key)
          .lte("task_date", days[6].key),
        supabase
          .from("test_attempts")
          .select("accuracy")
          .eq("user_id", userId)
          .not("submitted_at", "is", null)
          .gte("submitted_at", start.toISOString())
          .lte("submitted_at", end.toISOString()),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (testsRes.error) throw testsRes.error;

      const minutesByDay = new Map(days.map((day) => [day.key, 0]));
      (sessionsRes.data ?? []).forEach((session) => {
        if (!session.ended_at) return;
        const key = localDateKey(new Date(session.ended_at));
        if (minutesByDay.has(key)) {
          minutesByDay.set(
            key,
            (minutesByDay.get(key) ?? 0) + Math.round((session.duration_seconds ?? 0) / 60),
          );
        }
      });

      const accuracies = (testsRes.data ?? [])
        .map((test) => Number(test.accuracy))
        .filter((accuracy) => Number.isFinite(accuracy));

      return {
        days: days.map((day) => ({ ...day, minutes: minutesByDay.get(day.key) ?? 0 })),
        totalMinutes: [...minutesByDay.values()].reduce((sum, minutes) => sum + minutes, 0),
        completedTasks: (tasksRes.data ?? []).filter((task) => task.done).length,
        averageAccuracy: accuracies.length
          ? Math.round(accuracies.reduce((sum, accuracy) => sum + accuracy, 0) / accuracies.length)
          : null,
      };
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const data = analytics.data;
  const maxMinutes = Math.max(30, ...(data?.days.map((day) => day.minutes) ?? [0]));
  const hours = Math.floor((data?.totalMinutes ?? 0) / 60);
  const minutes = (data?.totalMinutes ?? 0) % 60;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-cyan-300">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </p>
          <h2 className="mt-1 font-display text-lg font-black tracking-tight">Study analytics</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Your last seven days at a glance.</p>
        </div>
        <Link
          to="/progress"
          className="shrink-0 text-[11px] font-semibold text-sky-600 hover:underline dark:text-cyan-300"
        >
          Details
        </Link>
      </div>

      {analytics.isLoading ? (
        <div className="flex min-h-32 items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading analytics…
        </div>
      ) : analytics.isError ? (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
          Analytics are temporarily unavailable. Your dashboard data is safe.
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric icon={Clock3} label="Study time" value={`${hours}h ${minutes}m`} />
            <Metric
              icon={CheckCircle2}
              label="Tasks done"
              value={String(data?.completedTasks ?? 0)}
            />
            <Metric
              icon={Trophy}
              label="Test avg"
              value={data?.averageAccuracy == null ? "—" : `${data.averageAccuracy}%`}
            />
          </div>
          <div className="mt-5 rounded-xl border border-border/70 bg-background/45 px-3 py-3">
            <div
              className="flex h-20 items-end justify-between gap-2"
              aria-label="Study minutes by day"
            >
              {(data?.days ?? []).map((day) => (
                <div
                  key={day.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <div
                    className={`w-full max-w-7 rounded-t-md transition-all ${day.minutes ? "bg-gradient-to-t from-sky-600 to-cyan-300" : "bg-muted"}`}
                    style={{
                      height: `${Math.max(day.minutes ? 10 : 5, (day.minutes / maxMinutes) * 100)}%`,
                    }}
                    title={`${day.minutes} minutes studied`}
                  />
                  <span className="text-[9px] font-semibold text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-background/45 p-2.5">
      <Icon className="h-3.5 w-3.5 text-sky-600 dark:text-cyan-300" />
      <p className="mt-2 truncate text-sm font-black tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
