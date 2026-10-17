// src/components/dashboard/ProDashboard.tsx
// Pro workspace: widget-based dashboard (status timer, ambience, summary,
// schedule, tasks, notes, calendar, countdown, goals, trophies, timeline).
// Styled with the site's own theme tokens so it matches the classic dashboard.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Coffee, MessageCircle, Tv, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { FocusPanel } from "./pro/FocusPanel";
import {
  CalendarCard,
  CountdownCard,
  DailyGoal,
  InstallBanner,
  MoodBanner,
  NotesCard,
  ScheduleCard,
  SmartSummary,
  TasksCard,
  TimelineCard,
  TodayFocus,
  TrophyJourney,
  UpcomingCard,
  useUserEvents,
  type EventItem,
  type PlannerTask,
  type SummaryData,
} from "./pro/ProWidgets";
import {
  dayKey,
  fmtDur,
  startOfToday,
  statusOf,
  uid,
  useLocalState,
  useStatusTimer,
} from "./pro/proLib";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

type Props = {
  userName: string;
  weekHours: number;
  weekMinutes: number;
  rank: number | null;
  commandCenter?: {
    recommendation?: string;
    weakTopics?: Array<{ topic: string; accuracy: number }>;
    continueLearning?: {
      videoId: string;
      title: string;
      subject: string | null;
      positionSeconds: number;
      durationSeconds: number;
    } | null;
  };
  onSwitchMode: (mode: "classic" | "focus" | "pro") => void;
};

type Sess = { duration_seconds: number; ended_at: string; note: string | null };

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function ProDashboard({
  userName,
  weekHours,
  weekMinutes,
  rank,
  commandCenter,
  onSwitchMode,
}: Props) {
  const userIdRef = useRef<string | null>(null);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [totalSec, setTotalSec] = useState(0);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [tests, setTests] = useState<EventItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [events, setEvents] = useUserEvents();
  const [goals, setGoals] = useLocalState("jph:pro:goals", { focusMin: 240, dailyMin: 300 });

  /* ---------- load data ---------- */

  useEffect(() => {
    let alive = true;
    (async () => {
      let id = userIdRef.current;
      if (!id) {
        const { data } = await supabase.auth.getUser();
        id = data.user?.id ?? null;
        userIdRef.current = id;
      }
      if (!id) return;
      const today = dayKey();

      const [s, total, t, ts] = await Promise.all([
        db
          .from("study_sessions")
          .select("duration_seconds,ended_at,note")
          .eq("user_id", id)
          .gte("ended_at", startOfToday().toISOString()),
        db.from("study_sessions").select("duration_seconds").eq("user_id", id).limit(5000),
        db
          .from("study_planner_tasks")
          .select("id,title,status,scheduled_date")
          .eq("user_id", id)
          .or(`scheduled_date.eq.${today},and(scheduled_date.lt.${today},status.eq.pending)`)
          .order("scheduled_date", { ascending: true })
          .limit(30),
        db
          .from("scheduled_tests")
          .select("id,test_name,scheduled_date")
          .gte("scheduled_date", today)
          .order("scheduled_date", { ascending: true })
          .limit(10),
      ]);
      if (!alive) return;
      setSessions((s.data ?? []) as Sess[]);
      setTotalSec(((total.data ?? []) as { duration_seconds: number }[]).reduce((a, r) => a + (r.duration_seconds || 0), 0));
      setTasks((t.data ?? []) as PlannerTask[]);
      setTests(
        ((ts.data ?? []) as any[]).map((r) => ({
          id: `t-${r.id}`,
          title: r.test_name,
          date: r.scheduled_date,
          kind: "test" as const,
        })),
      );
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /* ---------- status timer (saves study time) ---------- */

  const logStudy = useCallback(
    async (seconds: number, label: string) => {
      const id = userIdRef.current ?? (await supabase.auth.getUser()).data.user?.id;
      if (!id) return;
      const { error } = await db.from("study_sessions").insert({
        user_id: id,
        duration_seconds: Math.round(seconds),
        session_type: "stopwatch",
        subject: "general",
        note: label,
        ended_at: new Date().toISOString(),
      });
      if (!error) reload();
    },
    [reload],
  );

  const timer = useStatusTimer(logStudy);

  /* ---------- derived numbers ---------- */

  const todaySavedSec = sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
  const studyTodaySec = todaySavedSec + timer.unsavedStudySeconds;
  const totalStudySec = totalSec + timer.unsavedStudySeconds;
  const studyTodayMin = Math.floor(studyTodaySec / 60);

  const summary: SummaryData = useMemo(() => {
    const bySt: Record<string, number> = {};
    let longest = 0;
    for (const s of timer.segments) {
      const secs = Math.max(0, (s.end - s.start) / 1000);
      bySt[s.id] = (bySt[s.id] ?? 0) + secs;
      if (statusOf(s.id).study) longest = Math.max(longest, secs);
    }
    for (const s of sessions) longest = Math.max(longest, s.duration_seconds || 0);

    const bullets: SummaryData["bullets"] = [];
    Object.entries(bySt)
      .filter(([, v]) => v >= 60)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([id, v]) => {
        const st = statusOf(id);
        bullets.push({ text: `You spent ${fmtDur(v)} in ${st.label} today.`, color: st.color });
      });
    if (longest >= 60) {
      bullets.push({ text: `Your longest focus session was ${fmtDur(longest)}.`, color: "#f59e0b" });
    }
    const cur = statusOf(timer.current.id);
    bullets.push({ text: `Currently on ${cur.label}.`, color: cur.color });

    let headline = "Ready when you are 🚀";
    if (studyTodayMin >= goals.dailyMin) headline = "Daily goal smashed! 🏆";
    else if (studyTodayMin >= 30) headline = "You're having an amazing day! 🎉";
    else if (studyTodayMin > 0) headline = "Good start, keep it going 💪";

    let rec: string;
    if (studyTodayMin === 0) {
      rec = "Start a 25-minute Deep Work block, then take a 5-minute break. The first session is the hardest.";
    } else if (studyTodayMin < goals.dailyMin) {
      rec = `${goals.dailyMin - studyTodayMin} minutes to go for today's goal. One more focused block gets you closer.`;
    } else {
      rec = "Goal done. Use the rest of the day to revise what you studied.";
    }
    const weak = commandCenter?.weakTopics?.[0];
    if (weak) rec += ` Your weakest topic right now is ${weak.topic} (${Math.round(weak.accuracy)}% accuracy).`;

    return { headline, bullets, recommendation: rec };
  }, [timer.segments, timer.current.id, sessions, studyTodayMin, goals.dailyMin, commandCenter?.weakTopics]);

  const upcoming: EventItem[] = useMemo(() => {
    const today = dayKey();
    return [
      ...events.filter((e) => e.date >= today).map((e) => ({ ...e, kind: "event" as const })),
      ...tests,
    ].sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  }, [events, tests]);

  const marks = useMemo(() => {
    const m = new Set<string>();
    upcoming.forEach((e) => m.add(e.date));
    tasks.forEach((t) => m.add(t.scheduled_date));
    return m;
  }, [upcoming, tasks]);

  /* ---------- actions ---------- */

  const addTask = useCallback(
    async (title: string) => {
      const id = userIdRef.current;
      if (!id) return;
      const { error } = await db.from("study_planner_tasks").insert({ user_id: id, title, scheduled_date: dayKey() });
      if (error) toast.error("Couldn't add the task.");
      else reload();
    },
    [reload],
  );

  const toggleTask = useCallback(
    async (t: PlannerTask) => {
      const done = t.status === "completed";
      setTasks((l) => l.map((x) => (x.id === t.id ? { ...x, status: done ? "pending" : "completed" } : x)));
      const { error } = await db
        .from("study_planner_tasks")
        .update({ status: done ? "pending" : "completed", completed_at: done ? null : new Date().toISOString() })
        .eq("id", t.id);
      if (error) {
        toast.error("Couldn't update the task.");
        reload();
      }
    },
    [reload],
  );

  const startDay = (win: string, mood: string) => {
    if (mood === "breather") timer.switchTo("break");
    else if (mood !== "low") timer.switchTo("deep");
    if (win) void addTask(win);
    toast.success(mood === "breather" ? "Take it easy. Break timer started." : "Let's go! Your timer is running.");
  };

  const editGoal = (key: "focusMin" | "dailyMin", label: string) => {
    const v = window.prompt(label, String(goals[key]));
    if (!v) return;
    const n = Math.round(Number(v));
    if (n >= 15 && n <= 1440) setGoals({ ...goals, [key]: n });
    else toast.error("Enter a number between 15 and 1440.");
  };

  const invite = async () => {
    const url = window.location.origin;
    const text = "Study with me on JEE Prep Hub";
    if (navigator.share) {
      try {
        await navigator.share({ title: "JEE Prep Hub", text, url });
      } catch {
        /* cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  /* ---------- site-UI classes ---------- */

  const pill =
    "inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.98]";

  const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

  const learning = commandCenter?.continueLearning;
  const learningPct =
    learning && learning.durationSeconds > 0
      ? Math.min(100, Math.round((learning.positionSeconds / learning.durationSeconds) * 100))
      : 0;

  return (
    <main className="min-h-[calc(100vh-4rem)] text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-[28px] border border-border bg-card/80 p-5 shadow-soft backdrop-blur motion-safe:animate-rise-in sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className={eyebrow}>{greeting()}</p>
            <h1 className="mt-1 truncate text-3xl font-extrabold tracking-tight sm:text-4xl">{userName} 👋</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              This week {weekHours}h {weekMinutes}m{rank ? ` · Rank #${rank}` : ""}
            </p>
          </div>

          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
            <Link to="/ai-chat" className={pill}><MessageCircle className="h-4 w-4 text-primary" /> AI Assistant</Link>
            <button type="button" onClick={() => timer.switchTo("break")} className={pill}><Coffee className="h-4 w-4 text-primary" /> Take Break</button>
            <Link to="/watch" className={pill}><Tv className="h-4 w-4 text-primary" /> Watch Party</Link>
            <button type="button" onClick={() => void invite()} className={pill}><UserPlus className="h-4 w-4 text-primary" /> Invite a study buddy</button>
            <div className="ml-1 flex shrink-0 rounded-full border border-border bg-muted p-1 text-xs font-semibold">
              <button type="button" onClick={() => onSwitchMode("classic")} className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:text-foreground">Classic</button>
              <button type="button" onClick={() => onSwitchMode("focus")} className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:text-foreground">Focus</button>
              <span className="rounded-full bg-[#123b70] px-3 py-1.5 text-white dark:bg-white dark:text-[#123b70]">Pro</span>
            </div>
          </div>
        </header>

        <div className="mt-4">
          <MoodBanner onStart={startDay} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Left column */}
          <div className="min-w-0 space-y-4">
            <FocusPanel current={timer.current} elapsed={timer.elapsed} onSwitch={timer.switchTo} />
            <TodayFocus seconds={studyTodaySec} goalMin={goals.focusMin} onEdit={() => editGoal("focusMin", "Daily focus target (minutes)")} />
            <ScheduleCard onPlay={timer.switchTo} />
            <InstallBanner />
            <TimelineCard segments={timer.segments} now={timer.now} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TasksCard tasks={tasks} onToggle={(t) => void toggleTask(t)} onAdd={(t) => void addTask(t)} />
              <NotesCard />
            </div>
          </div>

          {/* Right column */}
          <div className="min-w-0 space-y-4">
            <SmartSummary data={summary} onRefresh={reload} />
            <UpcomingCard
              items={upcoming}
              onAdd={(e) => setEvents((l) => [...l, { ...e, id: uid(), kind: "event" }])}
              onDelete={(id) => setEvents((l) => l.filter((x) => x.id !== id))}
            />
            <CalendarCard marks={marks} />
            <CountdownCard />
            <DailyGoal seconds={studyTodaySec} goalMin={goals.dailyMin} onEdit={() => editGoal("dailyMin", "Daily study goal (minutes)")} />
            <TrophyJourney totalSeconds={totalStudySec} />
            {learning && (
              <section className="rounded-[28px] border border-border bg-card p-4 shadow-soft sm:p-5">
                <p className={eyebrow}>Continue learning</p>
                <p className="mt-2 line-clamp-2 text-lg font-bold">{learning.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{learning.subject ?? "General"}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${learningPct}%` }} />
                </div>
                <Link to="/pulse" search={{ v: learning.videoId }} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Resume <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
