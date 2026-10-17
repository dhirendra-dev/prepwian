// src/components/dashboard/ClassicProWidgets.tsx
// Pro widgets (tasks, notes, smart summary, upcoming, calendar, countdown, daily goal,
// trophies, continue learning) for the CLASSIC dashboard.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CalendarCard,
  CountdownCard,
  DailyGoal,
  NotesCard,
  SmartSummary,
  TasksCard,
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
  commandCenter?: {
    weakTopics?: Array<{ topic: string; accuracy: number }>;
    continueLearning?: {
      videoId: string;
      title: string;
      subject: string | null;
      positionSeconds: number;
      durationSeconds: number;
    } | null;
  };
};

type Sess = { duration_seconds: number; ended_at: string; note: string | null };

export function ClassicProWidgets({ commandCenter }: Props) {
  const userIdRef = useRef<string | null>(null);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [totalSec, setTotalSec] = useState(0);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [tests, setTests] = useState<EventItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [events, setEvents] = useUserEvents();
  const [goals, setGoals] = useLocalState("jph:pro:goals", { focusMin: 240, dailyMin: 300 });

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

  const editDailyGoal = () => {
    const v = window.prompt("Daily study goal (minutes)", String(goals.dailyMin));
    if (!v) return;
    const n = Math.round(Number(v));
    if (n >= 15 && n <= 1440) setGoals({ ...goals, dailyMin: n });
    else toast.error("Enter a number between 15 and 1440.");
  };

  const learning = commandCenter?.continueLearning;
  const learningPct =
    learning && learning.durationSeconds > 0
      ? Math.min(100, Math.round((learning.positionSeconds / learning.durationSeconds) * 100))
      : 0;

  return (
    <div className="min-w-0 space-y-4">
      <TasksCard tasks={tasks} onToggle={(t) => void toggleTask(t)} onAdd={(t) => void addTask(t)} />
      <NotesCard />
      <SmartSummary data={summary} onRefresh={reload} />
      <UpcomingCard
        items={upcoming}
        onAdd={(e) => setEvents((l) => [...l, { ...e, id: uid(), kind: "event" }])}
        onDelete={(id) => setEvents((l) => l.filter((x) => x.id !== id))}
      />
      <CalendarCard marks={marks} />
      <CountdownCard />
      <DailyGoal seconds={studyTodaySec} goalMin={goals.dailyMin} onEdit={editDailyGoal} />
      <TrophyJourney totalSeconds={totalStudySec} />
      {learning && (
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Continue learning</p>
          <p className="mt-2 line-clamp-2 text-lg font-bold">{learning.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{learning.subject ?? "General"}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${learningPct}%` }} />
          </div>
          <Link to="/pulse" search={{ v: learning.videoId }} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
            Resume <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}
    </div>
  );
}
