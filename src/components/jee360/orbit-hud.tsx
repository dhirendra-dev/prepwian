import { Link } from "@tanstack/react-router";
import { formatCountdown, formatTMinus } from "@/lib/jee360/dates";
import { computeReadiness, subjectVectors } from "@/lib/jee360/intel";
import { useAppStore } from "@/lib/jee360/store";
import { useNow } from "@/lib/jee360/use-now";
import { OrbitRing } from "@/components/jee360/orbit-ring";
import { Progress } from "@/components/ui/progress";

export function OrbitHud() {
  const now = useNow(1000);
  const lectures = useAppStore((s) => s.lectures);
  const tests = useAppStore((s) => s.tests);
  const backlog = useAppStore((s) => s.backlog);
  const cards = useAppStore((s) => s.cards);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const plans = useAppStore((s) => s.plans);
  const examDate = useAppStore((s) => s.settings.examDate);

  const readiness = computeReadiness({ lectures, tests, backlog, cards, focusSessions, plans, now: now ?? undefined });
  const vectors = subjectVectors(lectures, backlog, now ?? undefined);

  return (
    <section className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[auto_1fr] sm:p-5">
      <div className="flex items-center justify-center">
        <OrbitRing value={readiness.score} label="Ready" caption={readiness.label} />
      </div>
      <div className="min-w-0">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">T-minus</p>
        <p className="mt-1 font-display text-2xl tabular-nums tracking-tight sm:text-3xl" suppressHydrationWarning>
          {now ? formatTMinus(examDate, now) : formatCountdown(examDate)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Paper 1 window · estimate from attendance, mocks, focus, and memory loop
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {vectors.map((v) => (
            <div key={v.subject}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{v.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {v.attended}/{v.lectures || 0}
                  {v.backlog ? ` · ${v.backlog} back` : ""}
                </span>
              </div>
              <Progress value={v.score} />
            </div>
          ))}
        </div>
        <Link to="/jee360/lab" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">
          Open Lab →
        </Link>
      </div>
    </section>
  );
}
