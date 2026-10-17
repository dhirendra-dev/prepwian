import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { getPomodoroStreak } from "@/lib/certificates.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import {
  Play, Pause, RotateCcw, Save, Timer as TimerIcon, Flame, Target,
  Award, Lock, Maximize2, Minimize2, Eye, EyeOff, BookOpen,
  FlaskConical, Sigma, Sparkles, Clock,
} from "lucide-react";
import { StreakFlame } from "@/components/StreakFlame";
import { AmbientSounds } from "@/components/timer/AmbientSounds";
import { AnalyticsPanel } from "@/components/timer/AnalyticsPanel";

export const Route = createFileRoute("/_authenticated/timer")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Focus Timer — PREPWIAN" },
      { name: "twitter:description", content: "Pomodoro, stopwatch, deep focus mode and analytics — every session saved forever." },

      { title: "Focus Timer — Pomodoro, Stopwatch & Analytics for JEE Aspirants" },
      { name: "description", content: "Deep-focus workspace: Pomodoro, stopwatch, custom countdown, fullscreen mode, ambient sounds, and detailed daily/weekly/monthly study analytics." },
      { property: "og:title", content: "Focus Timer — PREPWIAN" },
      { property: "og:description", content: "Pomodoro, stopwatch, deep focus mode and analytics — every session saved forever." },
    ],
  }),
  component: TimerPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-lg font-semibold">Timer failed to load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        <Button className="mt-4" onClick={reset}>Try again</Button>
      </div>
    </AppShell>
  ),
});

function formatHm(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function TimerPage() {
  const { user } = Route.useRouteContext();
  const timer = useFocusTimer();
  const qc = useQueryClient();
  const [deepFocus, setDeepFocus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [savePulse, setSavePulse] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "pomodoro" | "stopwatch">("all");
  const fsRef = useRef<HTMLDivElement>(null);

  async function handleSave() {
    setSavePulse(true);
    setTimeout(() => setSavePulse(false), 700);
    await timer.saveSession().catch(() => {});
    qc.invalidateQueries({ queryKey: ["recent-sessions", user.id] });
  }

  // Realtime: instantly refresh history whenever a new session is saved for this user.
  useEffect(() => {
    const channel = supabase
      .channel(`study_sessions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "study_sessions", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["recent-sessions", user.id] });
          qc.invalidateQueries({ queryKey: ["session-stats"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, qc]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await fsRef.current?.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  const recent = useQuery({
    queryKey: ["recent-sessions", user.id],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("id, duration_seconds, session_type, subject, note, ended_at")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const fetchStreak = useServerFn(getPomodoroStreak);
  const streak = useQuery({
    queryKey: ["pomodoro-streak", user.id],
    queryFn: () => fetchStreak(),
    staleTime: 60_000,
  });

  const announcedRef = useRef(false);
  useEffect(() => {
    if (!streak.data || announcedRef.current) return;
    if ((streak.data.newlyAwarded ?? 0) > 0) {
      toast.success(`🏆 You earned ${streak.data.newlyAwarded} new focus badge${streak.data.newlyAwarded > 1 ? "s" : ""}!`);
      announcedRef.current = true;
    }
  }, [streak.data]);

  const earnedIds = new Set(
    (streak.data?.earnedBadges ?? []).map((b) => b.certificate_type_id).filter(Boolean) as string[],
  );

  function applyCustomCountdown() {
    const n = Math.max(1, Math.min(180, Number(customMinutes)));
    if (!Number.isFinite(n)) return;
    timer.setMode("pomodoro");
    timer.setPomoMinutes(n);
    toast.success(`Countdown set to ${n} minutes`);
  }

  // The main timer card is what enters fullscreen / deep focus.
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        {!deepFocus && (
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">Focus Workspace</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pomodoro, stopwatch, custom countdown, deep focus — every second is saved to your account.
              </p>
            </div>
          </header>
        )}

        <div
          ref={fsRef}
          className={`rounded-2xl border border-border shadow-soft transition-all ${
            isFullscreen ? "flex h-screen w-screen items-center justify-center bg-background p-8" : "bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6 dark:from-primary/10 dark:to-transparent"
          }`}
        >
          <div className={isFullscreen ? "w-full max-w-2xl" : "w-full"}>
            {/* Top controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ToggleGroup
                type="single"
                value={timer.mode}
                onValueChange={(v) => v && timer.setMode(v as "pomodoro" | "stopwatch")}
              >
                <ToggleGroupItem value="pomodoro">Pomodoro</ToggleGroupItem>
                <ToggleGroupItem value="stopwatch">Stopwatch</ToggleGroupItem>
              </ToggleGroup>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeepFocus((d) => !d)}
                  className="gap-1 active:scale-95 transition-transform"
                  aria-label="Toggle deep focus"
                >
                  {deepFocus ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="hidden sm:inline">{deepFocus ? "Show all" : "Deep focus"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="gap-1 active:scale-95 transition-transform"
                  aria-label="Toggle fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
                </Button>
              </div>
            </div>

            {timer.mode === "pomodoro" && !isFullscreen && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={String(timer.pomoMinutes)}
                  onValueChange={(v) => v && timer.setPomoMinutes(Number(v))}
                >
                  {[15, 25, 50, 90].map((m) => (
                    <ToggleGroupItem key={m} value={String(m)}>
                      {m}m
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Custom"
                    className="h-9 w-24"
                  />
                  <Button variant="outline" size="sm" onClick={applyCustomCountdown} disabled={!customMinutes}>
                    Set
                  </Button>
                </div>
              </div>
            )}

            {/* Timer display */}
            <div className={`text-center ${isFullscreen ? "my-16" : "my-8"}`}>
              <div className={`font-display font-bold tabular-nums ${isFullscreen ? "text-[12rem] leading-none" : "text-7xl"}`}>
                {timer.display}
              </div>
              {timer.mode === "pomodoro" && (
                <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${timer.progress}%` }} />
                </div>
              )}
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                {timer.subject} · {timer.mode}
              </div>
            </div>

            {/* Config */}
            {!deepFocus && !isFullscreen && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Select value={timer.subject} onValueChange={(v) => timer.setSubject(v as "physics" | "chemistry" | "mathematics" | "general")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="mathematics">Math</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Note (optional)</Label>
                  <Input
                    value={timer.note}
                    onChange={(e) => timer.setNote(e.target.value)}
                    placeholder="Chapter / topic"
                    maxLength={120}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {!timer.running ? (
                <Button size="lg" onClick={timer.start} className="gap-2 active:scale-95 transition-transform">
                  <Play className="h-4 w-4" /> Start
                </Button>
              ) : (
                <Button size="lg" onClick={timer.pause} variant="secondary" className="gap-2 active:scale-95 transition-transform">
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )}
              <Button onClick={timer.reset} variant="outline" className="gap-2 active:scale-95 transition-transform">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button
                onClick={handleSave}
                className={`gap-2 bg-success text-success-foreground hover:opacity-95 active:scale-95 transition-transform ${savePulse ? "animate-save-pulse" : ""}`}
              >
                <Save className={`h-4 w-4 ${savePulse ? "animate-check-pop" : ""}`} /> Save all
              </Button>
            </div>
          </div>
        </div>

        {!deepFocus && (
          <>
            <AmbientSounds />
            <AnalyticsPanel />

            {/* Streak + badges (existing) */}
            <section className="rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-6 shadow-soft dark:from-orange-500/15 dark:via-amber-500/10 dark:to-transparent">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" /> Pomodoro streak
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete at least one Pomodoro a day to keep your streak alive.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex justify-center">
                      <StreakFlame count={streak.data?.current ?? 0} size="lg" label="" />
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-3xl font-bold tabular-nums">{streak.data?.longest ?? 0}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Longest</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" /> Focus badges
                  </h3>
                  <Link to="/certificates" className="text-xs text-primary hover:underline">View all →</Link>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(streak.data?.allBadges ?? []).map((b) => {
                    const earned = earnedIds.has(b.id);
                    const isStreakBadge = b.code.startsWith("pomo_streak_");
                    const current = isStreakBadge ? streak.data?.longest ?? 0 : streak.data?.totalPomodoros ?? 0;
                    const pct = b.threshold ? Math.min(100, Math.round((current / b.threshold) * 100)) : 0;
                    return (
                      <div key={b.id} className={`rounded-xl border p-3 transition ${earned ? "border-orange-500/50 bg-orange-500/10 dark:bg-orange-500/15" : "border-border bg-card opacity-80"}`}>
                        <div className="flex items-center justify-between">
                          {isStreakBadge ? <Flame className={`h-5 w-5 ${earned ? "text-orange-500" : "text-muted-foreground"}`} /> : <Target className={`h-5 w-5 ${earned ? "text-orange-500" : "text-muted-foreground"}`} />}
                          {earned ? <Award className="h-4 w-4 text-orange-500" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className="mt-2 text-xs font-semibold leading-tight">{b.name}</div>
                        {!earned ? (
                          <>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-orange-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">{current}/{b.threshold}</div>
                          </>
                        ) : (
                          <div className="mt-2 text-[10px] font-medium text-orange-600 dark:text-orange-400">Earned</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <SessionHistoryPanel
              sessions={recent.data ?? []}
              loading={recent.isLoading}
              filter={historyFilter}
              onFilterChange={setHistoryFilter}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}

type SessionRow = {
  id: string;
  duration_seconds: number;
  session_type: string;
  subject: string | null;
  note: string | null;
  ended_at: string;
};

const SUBJECT_ICONS: Record<string, { icon: typeof BookOpen; tone: string }> = {
  physics: { icon: Sparkles, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  chemistry: { icon: FlaskConical, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  mathematics: { icon: Sigma, tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  general: { icon: BookOpen, tone: "bg-muted text-muted-foreground" },
};

function SessionHistoryPanel({
  sessions,
  loading,
  filter,
  onFilterChange,
}: {
  sessions: SessionRow[];
  loading: boolean;
  filter: "all" | "pomodoro" | "stopwatch";
  onFilterChange: (v: "all" | "pomodoro" | "stopwatch") => void;
}) {
  const filtered = useMemo(
    () => (filter === "all" ? sessions : sessions.filter((s) => s.session_type === filter)),
    [sessions, filter],
  );

  const groups = useMemo(() => {
    const out: Record<string, SessionRow[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    for (const s of filtered) {
      const ts = new Date(s.ended_at).getTime();
      let key: string;
      if (ts >= today) key = "Today";
      else if (ts >= yesterday) key = "Yesterday";
      else key = new Date(s.ended_at).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      (out[key] ||= []).push(s);
    }
    return out;
  }, [filtered]);

  const totalMinutes = Math.round(filtered.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-br from-primary/5 to-transparent px-4 py-3 sm:px-6 dark:from-primary/10 dark:to-transparent">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <TimerIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-semibold sm:text-lg">Session history</h2>
            <p className="truncate text-[11px] text-muted-foreground">
              {loading ? "Loading…" : `${filtered.length} session${filtered.length === 1 ? "" : "s"} · ${totalMinutes} min total`}
            </p>
          </div>
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          value={filter}
          onValueChange={(v) => v && onFilterChange(v as "all" | "pomodoro" | "stopwatch")}
        >
          <ToggleGroupItem value="all" className="text-[11px]">All</ToggleGroupItem>
          <ToggleGroupItem value="pomodoro" className="text-[11px]">Pomodoro</ToggleGroupItem>
          <ToggleGroupItem value="stopwatch" className="text-[11px]">Stopwatch</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {loading ? (
        <div className="space-y-2 p-4 sm:p-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No sessions yet</p>
          <p className="text-xs text-muted-foreground">Save your first focus block using the button above.</p>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-y-auto">
          {Object.entries(groups).map(([day, rows]) => (
            <div key={day}>
              <div className="sticky top-0 z-10 border-b border-border/40 bg-card/95 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur sm:px-6">
                {day}
              </div>
              <ul className="divide-y divide-border/50">
                {rows.map((r) => {
                  const subjectKey = (r.subject ?? "general").toLowerCase();
                  const info = SUBJECT_ICONS[subjectKey] ?? SUBJECT_ICONS.general;
                  const Icon = info.icon;
                  const mins = Math.round(r.duration_seconds / 60);
                  const secs = r.duration_seconds % 60;
                  const durLabel = mins >= 1 ? `${mins}m` : `${secs}s`;
                  return (
                    <li key={r.id} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 sm:px-6">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${info.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-semibold capitalize">{r.subject ?? "general"}</span>
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {r.session_type}
                          </span>
                        </div>
                        {r.note && <p className="truncate text-xs text-muted-foreground">{r.note}</p>}
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {new Date(r.ended_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-sm font-bold tabular-nums leading-none">{durLabel}</div>
                        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">focused</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
