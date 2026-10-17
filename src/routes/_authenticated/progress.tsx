import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { GlassSurface } from "@/components/GlassSurface";
import { RadialGauge } from "@/components/progress/RadialGauge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getProgressOverview, levelTitle, type Achievement } from "@/lib/progress.functions";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Flame,
  Gauge,
  Layers,
  Loader2,
  Sparkles,
  Star,
  Target,
  Trophy,
  Award,
  Beaker,
  Calculator,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Progress Tracker — PREPWIAN" },
      { name: "twitter:description", content: "Rating, tiers, streaks, subject breakdowns and achievement badges from your real test data." },

      { title: "Progress Tracker — Rating, Tiers & Badges | PREPWIAN" },
      {
        name: "description",
        content:
          "Track your PREPWIAN rating, climb Bronze to Diamond tiers, review subject-wise and test-wise performance, and unlock achievement badges.",
      },
      { property: "og:title", content: "Progress Tracker — PREPWIAN" },
      { property: "og:description", content: "Rating, tiers, streaks, subject breakdowns and achievement badges from your real test data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
});

const SUBJECT_META: Record<string, { icon: any; tone: string; bar: string; ring: string }> = {
  physics: { icon: Flame, tone: "text-primary", bar: "bg-primary", ring: "border-primary/35" },
  chemistry: { icon: Beaker, tone: "text-accent", bar: "bg-accent", ring: "border-accent/35" },
  mathematics: { icon: Calculator, tone: "text-warning", bar: "bg-warning", ring: "border-warning/35" },
  biology: { icon: Activity, tone: "text-emerald-500", bar: "bg-emerald-500", ring: "border-emerald-500/35" },
  mixed: { icon: Layers, tone: "text-muted-foreground", bar: "bg-muted-foreground", ring: "border-border" },
};

function meta(subject: string) {
  return SUBJECT_META[subject] ?? SUBJECT_META['mixed']!;
}

function ProgressPage() {
  const fn = useServerFn(getProgressOverview);
  const { data, isLoading } = useQuery({ queryKey: ["progress-overview"], queryFn: () => fn(), staleTime: 30_000 });

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const d = data;
  const tierPct = (d.rating - d.tierMin) / Math.max(1, d.tierMax - d.tierMin);
  const unlocked = d.achievements.filter((a) => a.unlocked);
  const byRarity = (r: Achievement["rarity"]) => unlocked.filter((a) => a.rarity === r).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Rating hero */}
        <GlassSurface className="overflow-hidden">
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <RadialGauge value={tierPct} label="JPH Rating" className="text-warning">
              <div className="font-display text-4xl font-bold tabular-nums text-liquid">{d.rating}</div>
            </RadialGauge>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3.5 py-1.5 text-sm font-semibold text-warning">
              <Trophy className="h-4 w-4" /> {d.tier}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <h1 className="font-display text-2xl font-bold">Progress Tracker</h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  d.ratingDelta7d >= 0
                    ? "border border-emerald-500/35 bg-emerald-500/10 text-emerald-500"
                    : "border border-destructive/35 bg-destructive/10 text-destructive"
                }`}
              >
                {d.ratingDelta7d >= 0 ? "↗" : "↘"} {d.ratingDelta7d >= 0 ? "+" : ""}
                {d.ratingDelta7d} this week
              </span>
            </div>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Every correct answer earns rating. Every mistake costs a little. Climb the tiers.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Chip icon={Zap} value={d.solved.toLocaleString()} label="Solved" tone="text-primary" />
              <Chip icon={Target} value={`${d.accuracy.toFixed(0)}%`} label="Accuracy" tone="text-emerald-500" />
              <Chip icon={Award} value={d.correct.toLocaleString()} label="Correct" tone="text-warning" />
              <Chip icon={Flame} value={String(d.activeDays)} label="Active days" tone="text-orange-500" />
            </div>
          </div>

          <div className="border-t border-border/60 p-3 sm:p-4">
            <Tabs defaultValue="overall">
              <TabsList className="w-full">
                <TabsTrigger value="overall" className="flex-1 gap-1.5">
                  <Gauge className="h-4 w-4" /> Overall
                </TabsTrigger>
                <TabsTrigger value="subject" className="flex-1 gap-1.5">
                  <Layers className="h-4 w-4" /> Subject-wise
                </TabsTrigger>
                <TabsTrigger value="test" className="flex-1 gap-1.5">
                  <BarChart3 className="h-4 w-4" /> Test-wise
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overall" className="mt-4 space-y-4">
                <SectionLabel icon={CalendarDays}>Questions Solved</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="This Week" value={d.solvedWindows.week} />
                  <Metric label="Last Month" value={d.solvedWindows.month} />
                  <Metric label="Last 3 Months" value={d.solvedWindows.quarter} />
                  <Metric label="All Time" value={d.solvedWindows.all} />
                </div>

                <SectionLabel icon={Activity}>Performance Snapshot</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  <Metric label="Correct" value={d.correct} tone="text-emerald-500" />
                  <Metric label="Wrong" value={d.wrong} tone="text-destructive" />
                  <Metric label="Skipped" value={d.skipped} tone="text-muted-foreground" />
                </div>
                <div className="rounded-xl border border-border/70 bg-card/40 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Next tier at {d.tierMax}</span>
                    <span className="tabular-nums">{Math.round(tierPct * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${Math.max(3, tierPct * 100)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-orange-500" /> {d.currentStreak}-day active streak
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subject" className="mt-4 space-y-3">
                {d.subjects.length === 0 ? (
                  <Empty text="Attempt a test to unlock subject-wise insights." />
                ) : (
                  d.subjects.map((s) => {
                    const m = meta(s.subject);
                    const pct = s.total ? (s.scored / s.total) * 100 : 0;
                    return (
                      <div key={s.subject} className={`rounded-xl border bg-card/40 p-3 ${m.ring}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`grid h-9 w-9 place-items-center rounded-full border ${m.ring} ${m.tone}`}>
                              <m.icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-sm font-semibold capitalize">{s.subject}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {s.attempts} test{s.attempts === 1 ? "" : "s"} · {s.accuracy.toFixed(0)}% accuracy
                              </div>
                            </div>
                          </div>
                          <div className={`font-display text-lg font-bold tabular-nums ${m.tone}`}>{pct.toFixed(0)}%</div>
                        </div>
                        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${m.bar} transition-all`} style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} />
                        </div>
                        <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
                          <span className="text-emerald-500">✓ {s.correct}</span>
                          <span className="text-destructive">✗ {s.wrong}</span>
                          <span>— {s.skipped}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="test" className="mt-4 space-y-2">
                {d.tests.length === 0 ? (
                  <Empty text="No submitted tests yet." />
                ) : (
                  d.tests.map((t) => (
                    <Link
                      key={t.attemptId}
                      to="/tests/result/$attemptId"
                      params={{ attemptId: t.attemptId }}
                      className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/40 p-3 transition hover:bg-card/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{t.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          {t.examType && <Badge variant="outline" className="uppercase">{t.examType.replace(/_/g, " ")}</Badge>}
                          <span>{t.accuracy.toFixed(0)}% accuracy</span>
                          {t.percentile != null && <span>· {t.percentile.toFixed(1)} pct</span>}
                          {t.submittedAt && <span>· {new Date(t.submittedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-base font-bold tabular-nums">
                          {t.score.toFixed(0)}
                          <span className="text-xs text-muted-foreground">/{t.maxScore}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </GlassSurface>

        {/* Subjects */}
        <GlassSurface className="p-4">
          <h2 className="font-display text-xl font-bold">Subjects</h2>
          <div className="mt-3 space-y-3">
            {(["physics", "chemistry", "mathematics"] as const).map((subj) => {
              const m = meta(subj);
              const tp = d.topicProgress.find((t) => t.subject === subj);
              const pct = tp && tp.total ? (tp.done / tp.total) * 100 : 0;
              return (
                <div key={subj} className={`rounded-2xl border bg-card/40 p-4 ${m.ring}`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${m.ring} ${m.tone}`}>
                      <m.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={`font-semibold tabular-nums ${m.tone}`}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${m.bar} transition-all`} style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-bold capitalize">{subj}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.ring} ${m.tone}`}>JEE 2027</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-muted-foreground">
                      <Layers className={`h-3.5 w-3.5 ${m.tone}`} /> Structured Practice
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-muted-foreground">
                      <BarChart3 className={`h-3.5 w-3.5 ${m.tone}`} /> {tp?.done ?? 0} topics done
                    </span>
                  </div>

                  <Link
                    to="/planner"
                    className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm font-semibold"
                  >
                    <span className={m.tone}>Continue Learning</span>
                    <span className={`grid h-9 w-9 place-items-center rounded-full border ${m.ring} ${m.tone}`}>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </GlassSurface>

        {/* Achievements */}
        <GlassSurface className="overflow-hidden">
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <RadialGauge value={unlocked.length / d.achievements.length} label="Badges" className="text-primary">
              <div className="font-display text-3xl font-bold tabular-nums">
                {unlocked.length}/{d.achievements.length}
              </div>
            </RadialGauge>
            <h2 className="mt-4 flex items-center gap-2 font-display text-2xl font-bold">
              <Trophy className="h-6 w-6 text-warning" /> Your Achievements
            </h2>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                <Star className="h-4 w-4" /> Level {d.level} — {levelTitle(d.level)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning">
                <Sparkles className="h-4 w-4" /> {d.xp.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-4 w-full max-w-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">{d.levelXp} XP</span>
                <span className="tabular-nums">Next: {d.nextLevelXp} XP</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(2, (d.levelXp / d.nextLevelXp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border/60 text-center">
            <Rarity value={byRarity("legendary")} label="Legendary" tone="text-warning" />
            <Rarity value={byRarity("epic")} label="Epic" tone="text-primary" />
            <Rarity value={byRarity("rare")} label="Rare" tone="text-accent" />
            <Rarity value={byRarity("common")} label="Common" tone="text-muted-foreground" />
          </div>

          <div className="border-t border-border/60 p-4">
            <h3 className="font-display text-lg font-bold">Recent Unlocks</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {d.achievements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 ${
                    a.unlocked ? "border-primary/35 bg-primary/5" : "border-border/60 bg-card/30 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{a.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        a.rarity === "legendary"
                          ? "bg-warning/15 text-warning"
                          : a.rarity === "epic"
                            ? "bg-primary/15 text-primary"
                            : a.rarity === "rare"
                              ? "bg-accent/15 text-accent"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.rarity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.hint}</p>
                  {!a.unlocked && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(2, a.progress * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassSurface>

        <div className="flex flex-wrap justify-center gap-2 pb-8">
          <Link to="/tests" className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-semibold">Test Series</Link>
          <Link to="/tests/leaderboard" className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-semibold">Leaderboard</Link>
        </div>
      </div>
    </AppShell>
  );
}

function Chip({ icon: Icon, value, label, tone }: { icon: any; value: string; label: string; tone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-3 py-1.5 text-sm">
      <Icon className={`h-4 w-4 ${tone}`} />
      <b className="font-display tabular-nums">{value}</b>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-2xl font-bold tabular-nums ${tone}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function Rarity({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="p-4">
      <div className={`font-display text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-primary" /> {children}
    </h3>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-border/60 bg-card/30 p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
