import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, Check, Flame, LockKeyhole, Sparkles, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getTodayTasks } from "@/lib/certificates.functions";

const MILESTONES = [
  { days: 1, name: "First Flame", reward: "Profile badge", tone: "from-orange-400 to-amber-500" },
  { days: 3, name: "Momentum", reward: "Profile badge", tone: "from-sky-400 to-blue-500" },
  {
    days: 7,
    name: "Week Warrior",
    reward: "Streak certificate milestone",
    tone: "from-violet-400 to-indigo-500",
  },
  {
    days: 14,
    name: "Fortnight Focus",
    reward: "Profile badge",
    tone: "from-emerald-400 to-teal-500",
  },
  {
    days: 30,
    name: "Unbreakable",
    reward: "Streak certificate milestone",
    tone: "from-rose-400 to-red-500",
  },
  { days: 60, name: "Consistency Pro", reward: "Profile badge", tone: "from-cyan-400 to-sky-600" },
  {
    days: 100,
    name: "Century Scholar",
    reward: "Profile badge",
    tone: "from-yellow-400 to-orange-600",
  },
] as const;

type Props = { userId: string; compact?: boolean };

export function StreakMilestoneBadges({ userId, compact = false }: Props) {
  const fetchTasks = useServerFn(getTodayTasks);
  const { data, isLoading } = useQuery({
    queryKey: ["streak-milestones", userId],
    queryFn: () => fetchTasks(),
    staleTime: 60_000,
    retry: 1,
  });
  const best = data?.streak?.longest ?? 0;
  const current = data?.streak?.current ?? 0;
  const next = MILESTONES.find((milestone) => milestone.days > best) ?? null;
  const visible = compact ? MILESTONES.slice(0, 5) : MILESTONES;
  const progress = next ? Math.min(100, Math.round((best / next.days) * 100)) : 100;

  return (
    <section
      className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5"
      aria-labelledby={`streak-rewards-${userId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Streak rewards</p>
          </div>
          <h2 id={`streak-rewards-${userId}`} className="mt-1 font-display text-lg font-semibold">
            Milestones you can keep
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your best streak unlocks profile badges and certificate milestones.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
          <Flame className="h-3.5 w-3.5" /> {current}d current · {best}d best
        </div>
      </div>

      {isLoading ? (
        <div
          className="mt-5 h-20 animate-pulse rounded-xl bg-muted/60"
          aria-label="Loading streak rewards"
        />
      ) : (
        <>
          {next ? (
            <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.045] p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold">Next reward: {next.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {best}/{next.days} days
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${Math.max(3, progress)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {next.days - best} more consistent day{next.days - best === 1 ? "" : "s"} to unlock
                your {next.reward.toLowerCase()}.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              <Sparkles className="h-4 w-4 shrink-0" /> Every listed streak milestone is unlocked.
              Keep building your record.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {visible.map((milestone) => {
              const earned = best >= milestone.days;
              return (
                <div
                  key={milestone.days}
                  className={`relative overflow-hidden rounded-xl border p-3 transition ${earned ? "border-primary/25 bg-primary/[0.045]" : "border-border/70 bg-background/40 opacity-70"}`}
                >
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${milestone.tone} text-white shadow-sm`}
                  >
                    {earned ? <Check className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  </div>
                  <p className="mt-2 truncate text-xs font-bold">{milestone.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {milestone.days}-day streak
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary">
                    <Award className="h-3 w-3" /> {earned ? "Earned" : milestone.reward}
                  </p>
                </div>
              );
            })}
          </div>

          <Link
            to="/certificates"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            View certificates and rewards <span aria-hidden="true">→</span>
          </Link>
        </>
      )}
    </section>
  );
}
