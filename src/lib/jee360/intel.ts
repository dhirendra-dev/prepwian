import { addDays, format, parseISO } from "date-fns";
import { todayISO } from "@/lib/jee360/dates";
import { currentProjection } from "@/lib/jee360/rank";
import { dueCards } from "@/lib/jee360/srs";
import type {
  BacklogItem,
  FocusSession,
  Lecture,
  MemoryCard,
  Mistake,
  StudyPlan,
  Subject,
  TestItem,
} from "@/lib/jee360/types";

export type SubjectVector = {
  subject: Subject;
  label: string;
  score: number;
  lectures: number;
  attended: number;
  backlog: number;
};

export type ProtocolStep = {
  id: string;
  minutes: number;
  title: string;
  reason: string;
  href: "/jee360/schedule" | "/jee360/tests" | "/jee360/memory" | "/jee360/backlog" | "/jee360/focus" | "/jee360/errors" | "/jee360/sprint";
};

export type HeatCell = {
  date: string;
  value: number;
};

const LABELS: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Maths",
};

export function subjectVectors(
  lectures: Lecture[],
  backlog: BacklogItem[],
  now = new Date(),
): SubjectVector[] {
  const today = todayISO(now);
  const windowStart = format(addDays(parseISO(today), -21), "yyyy-MM-dd");
  return (["physics", "chemistry", "maths"] as Subject[]).map((subject) => {
    const set = lectures.filter((l) => l.subject === subject && l.date >= windowStart && l.date <= today);
    const attended = set.filter((l) => l.status === "attended").length;
    const open = backlog.filter((b) => b.subject === subject && b.status !== "cleared").length;
    const rate = set.length ? attended / set.length : 0.5;
    const score = Math.round(Math.max(8, Math.min(100, rate * 80 + 20 - open * 8)));
    return { subject, label: LABELS[subject], score, lectures: set.length, attended, backlog: open };
  });
}

export function weeklyFocusMinutes(sessions: FocusSession[], now = new Date()): number {
  const from = format(addDays(now, -6), "yyyy-MM-dd");
  return sessions
    .filter((s) => s.status === "completed" && s.startedAt.slice(0, 10) >= from)
    .reduce((n, s) => n + s.minutes, 0);
}

export function computeReadiness(input: {
  lectures: Lecture[];
  tests: TestItem[];
  backlog: BacklogItem[];
  cards: MemoryCard[];
  focusSessions: FocusSession[];
  plans: StudyPlan[];
  now?: Date;
}): { score: number; label: string; parts: { label: string; value: number; max: number }[] } {
  const now = input.now ?? new Date();
  const today = todayISO(now);
  const from = format(addDays(parseISO(today), -13), "yyyy-MM-dd");
  const recent = input.lectures.filter((l) => l.date >= from && l.date <= today);
  const attended = recent.filter((l) => l.status === "attended").length;
  const attendance = recent.length ? (attended / recent.length) * 32 : 16;

  const open = input.backlog.filter((b) => b.status !== "cleared").length;
  const backlogScore = Math.max(0, 18 - open * 3);

  const proj = currentProjection(input.tests);
  const mockScore = proj.n ? Math.min(20, (proj.percentile / 100) * 20) : 8;

  const focusHrs = weeklyFocusMinutes(input.focusSessions, now) / 60;
  const focusScore = Math.min(15, focusHrs * 2.5);

  const due = dueCards(input.cards, today).length;
  const loopScore = input.cards.length ? Math.max(0, 15 - due * 2) : 7;

  const raw = attendance + backlogScore + mockScore + focusScore + loopScore;
  const score = Math.round(Math.max(12, Math.min(99, raw)));
  const label = score >= 80 ? "Orbit locked" : score >= 60 ? "On trajectory" : score >= 40 ? "Needs thrust" : "Drift";

  return {
    score,
    label,
    parts: [
      { label: "Attendance", value: Math.round(attendance), max: 32 },
      { label: "Backlog", value: Math.round(backlogScore), max: 18 },
      { label: "Mocks", value: Math.round(mockScore), max: 20 },
      { label: "Focus", value: Math.round(focusScore), max: 15 },
      { label: "Loop", value: Math.round(loopScore), max: 15 },
    ],
  };
}

export function nextProtocol(input: {
  lectures: Lecture[];
  tests: TestItem[];
  backlog: BacklogItem[];
  cards: MemoryCard[];
  mistakes?: Mistake[];
  now?: Date;
}): ProtocolStep[] {
  const now = input.now ?? new Date();
  const today = todayISO(now);
  const steps: ProtocolStep[] = [];
  let left = 90;

  const soon = input.lectures
    .filter((l) => l.date === today && l.status === "upcoming")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nextLec = soon[0];
  if (nextLec) {
    const [h, m] = nextLec.startTime.split(":").map(Number);
    const start = new Date(now);
    start.setHours(h ?? 0, m ?? 0, 0, 0);
    const mins = Math.round((start.getTime() - now.getTime()) / 60000);
    if (mins <= 90 && mins >= -10) {
      steps.push({
        id: "lec",
        minutes: Math.min(left, 60),
        title: `Sit ${nextLec.subject} · ${nextLec.chapter}`,
        reason: mins > 0 ? `Starts in ${mins} min` : "In session now",
        href: "/jee360/schedule",
      });
      left -= 60;
    }
  }

  const upcomingTest = [...input.tests]
    .filter((t) => t.status === "upcoming" && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (upcomingTest && left > 0) {
    const days = Math.round((parseISO(upcomingTest.date).getTime() - parseISO(today).getTime()) / 86400000);
    if (days <= 3) {
      const take = Math.min(left, days <= 1 ? 45 : 30);
      steps.push({
        id: "test",
        minutes: take,
        title: `Prep ${upcomingTest.title}`,
        reason: days <= 0 ? "Test today" : days === 1 ? "Test tomorrow" : `Test in ${days} days`,
        href: "/jee360/tests",
      });
      left -= take;
    }
  }

  const due = dueCards(input.cards, today);
  if (due.length && left >= 20) {
    const take = Math.min(left, 25);
    steps.push({
      id: "loop",
      minutes: take,
      title: `Memory loop · ${due.length} due`,
      reason: due[0] ? `${due[0].chapter} first` : "Spaced review",
      href: "/jee360/memory",
    });
    left -= take;
  }

  const openErrors = (input.mistakes ?? []).filter((m) => m.status === "open");
  if (openErrors.length && left >= 15) {
    const take = Math.min(left, 20);
    steps.push({
      id: "err",
      minutes: take,
      title: `Re-attempt ${openErrors[0].chapter}`,
      reason: `${openErrors.length} open in the error log`,
      href: "/jee360/errors",
    });
    left -= take;
  }

  const open = input.backlog
    .filter((b) => b.status !== "cleared")
    .sort((a, b) => (a.priority === "high" ? -1 : 1));
  if (open.length && left >= 20) {
    const item = open[0];
    const take = Math.min(left, 30);
    steps.push({
      id: "back",
      minutes: take,
      title: `Recover ${item.chapter}`,
      reason: `Missed ${item.missedDate}`,
      href: "/jee360/backlog",
    });
    left -= take;
  }

  if (left >= 20) {
    steps.push({
      id: "sprint",
      minutes: Math.min(left, 15),
      title: "Formula sprint",
      reason: "90 seconds, eight recalls",
      href: "/jee360/sprint",
    });
    left -= 15;
  }

  if (left >= 20) {
    steps.push({
      id: "focus",
      minutes: left,
      title: "Deep work block",
      reason: "No lecture in the next window",
      href: "/jee360/focus",
    });
  }

  return steps.slice(0, 4);
}

export function heatmap(input: {
  lectures: Lecture[];
  focusSessions: FocusSession[];
  days?: number;
  now?: Date;
}): HeatCell[] {
  const now = input.now ?? new Date();
  const n = input.days ?? 28;
  const cells: HeatCell[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = format(addDays(now, -i), "yyyy-MM-dd");
    const attended = input.lectures.filter((l) => l.date === date && l.status === "attended").length;
    const minutes = input.focusSessions
      .filter((s) => s.status === "completed" && s.startedAt.slice(0, 10) === date)
      .reduce((sum, s) => sum + s.minutes, 0);
    const value = Math.min(4, attended + Math.round(minutes / 30));
    cells.push({ date, value });
  }
  return cells;
}

export function seedFocusSessions(now = new Date()): FocusSession[] {
  const titles: { title: string; subject: Subject; minutes: number }[] = [
    { title: "Rotational Motion drill", subject: "physics", minutes: 50 },
    { title: "MOT flashcards", subject: "chemistry", minutes: 25 },
    { title: "Conic sections set", subject: "maths", minutes: 50 },
    { title: "Error log from weekly", subject: "physics", minutes: 25 },
    { title: "Equilibrium numericals", subject: "chemistry", minutes: 50 },
  ];
  return titles.map((item, i) => {
    const day = addDays(now, -i);
    return {
      id: `foc_seed${i}`,
      startedAt: `${format(day, "yyyy-MM-dd")}T16:00:00`,
      minutes: item.minutes,
      title: item.title,
      subject: item.subject,
      status: "completed" as const,
    };
  });
}
