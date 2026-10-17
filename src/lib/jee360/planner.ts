import { addDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { addMinutesToTime } from "@/lib/jee360/schema";
import { combineDateTime, todayISO } from "@/lib/jee360/dates";
import { uid } from "@/lib/jee360/ids";
import type {
  BacklogItem,
  Lecture,
  PlanBlock,
  PlanDay,
  Reminder,
  Settings,
  StudyPlan,
  Subject,
  TestItem,
} from "@/lib/jee360/types";

export const SUBJECT_LABEL: Record<Subject | "full", string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Maths",
  full: "Full syllabus",
};

export const SUBJECT_SHORT: Record<Subject | "full", string> = {
  physics: "Phy",
  chemistry: "Chem",
  maths: "Maths",
  full: "Full",
};

export function lectureEnd(lecture: Lecture): Date {
  return combineDateTime(lecture.date, lecture.endTime);
}

export function isLecturePast(lecture: Lecture, now = new Date()): boolean {
  return isBefore(lectureEnd(lecture), now);
}

export function sortLectures(list: Lecture[]): Lecture[] {
  return [...list].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
}

export function lecturesOn(lectures: Lecture[], date: string): Lecture[] {
  return sortLectures(lectures.filter((l) => l.date === date));
}

export function testsOn(tests: TestItem[], date: string): TestItem[] {
  return [...tests].filter((t) => t.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function weekStats(lectures: Lecture[], dates: string[]) {
  const inWeek = lectures.filter((l) => dates.includes(l.date));
  const attended = inWeek.filter((l) => l.status === "attended").length;
  const missed = inWeek.filter((l) => l.status === "missed").length;
  const total = inWeek.length;
  return { total, attended, missed, remaining: total - attended - missed };
}

export function openBacklog(items: BacklogItem[]): BacklogItem[] {
  return items
    .filter((b) => b.status !== "cleared")
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority] || a.missedDate.localeCompare(b.missedDate);
    });
}

export function upcomingTests(tests: TestItem[], now = new Date()): TestItem[] {
  const today = todayISO(now);
  return [...tests]
    .filter((t) => t.status === "upcoming" && t.date >= today)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

export function unmarkedPast(lectures: Lecture[], now = new Date()): Lecture[] {
  return sortLectures(lectures.filter((l) => l.status === "upcoming" && isLecturePast(l, now)));
}

export function buildAutoReminders(
  lectures: Lecture[],
  tests: TestItem[],
  leadMinutes: number,
): Reminder[] {
  const fromLectures: Reminder[] = lectures
    .filter((l) => l.status === "upcoming")
    .map((l) => {
      const at = combineDateTime(l.date, l.startTime);
      at.setMinutes(at.getMinutes() - leadMinutes);
      return {
        id: uid("rem"),
        title: l.title,
        datetime: at.toISOString(),
        type: "lecture" as const,
        relatedId: l.id,
        enabled: true,
        source: "auto" as const,
        fired: isBefore(at, new Date()),
      };
    });

  const fromTests: Reminder[] = tests
    .filter((t) => t.status === "upcoming")
    .map((t) => {
      const at = combineDateTime(t.date, t.startTime);
      at.setMinutes(at.getMinutes() - Math.max(leadMinutes, 60));
      return {
        id: uid("rem"),
        title: t.title,
        datetime: at.toISOString(),
        type: "test" as const,
        relatedId: t.id,
        enabled: true,
        source: "auto" as const,
        fired: isBefore(at, new Date()),
      };
    });

  return [...fromLectures, ...fromTests];
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return ((eh ?? 0) * 60 + (em ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0))) / 60;
}

function overlaps(start: string, end: string, blocks: PlanBlock[]): boolean {
  return blocks.some((b) => b.startTime < end && b.endTime > start);
}

export function generateStudyPlan(input: {
  lectures: Lecture[];
  tests: TestItem[];
  backlog: BacklogItem[];
  settings: Settings;
  startDate: string;
  endDate: string;
  dailyHours: number;
  includeBacklog: boolean;
  name?: string;
}): StudyPlan {
  const days: PlanDay[] = [];
  const backlogQueue = input.includeBacklog ? openBacklog(input.backlog).map((b) => ({ ...b })) : [];
  let cursor = parseISO(input.startDate);
  const last = parseISO(input.endDate);
  const recentChapters: { subject: Subject; chapter: string }[] = [];

  for (const lec of sortLectures(input.lectures)) {
    if (lec.status === "attended") recentChapters.push({ subject: lec.subject, chapter: lec.chapter });
  }

  while (!isAfter(cursor, last)) {
    const date = format(cursor, "yyyy-MM-dd");
    const blocks: PlanBlock[] = [];
    const dayLectures = lecturesOn(input.lectures, date).filter((l) => l.status !== "missed");
    const dayTests = testsOn(input.tests, date);
    const tomorrow = format(addDays(cursor, 1), "yyyy-MM-dd");
    const testsTomorrow = testsOn(input.tests, tomorrow);

    for (const t of dayTests) {
      blocks.push({
        id: uid("blk"),
        startTime: t.startTime,
        endTime: addMinutesToTime(t.startTime, t.durationMinutes),
        title: t.title,
        subject: t.subject,
        kind: "test",
      });
    }

    for (const l of dayLectures) {
      blocks.push({
        id: uid("blk"),
        startTime: l.startTime,
        endTime: l.endTime,
        title: l.title,
        subject: l.subject,
        kind: l.type === "revision" ? "revision" : "lecture",
      });
      if (l.status === "upcoming" || l.status === "attended") {
        recentChapters.push({ subject: l.subject, chapter: l.chapter });
      }
    }

    let remaining = Math.max(input.dailyHours, 0);
    const selfSlots = [
      { start: "06:30", minutes: 90 },
      { start: "19:00", minutes: 90 },
      { start: "21:00", minutes: 60 },
    ];

    for (const slot of selfSlots) {
      if (remaining <= 0) break;
      const minutes = Math.min(slot.minutes, Math.round(remaining * 60));
      const end = addMinutesToTime(slot.start, minutes);
      if (overlaps(slot.start, end, blocks)) continue;

      let title = "Self-study block";
      let kind: PlanBlock["kind"] = "self-study";
      let subject: PlanBlock["subject"] | undefined;

      if (testsTomorrow[0]) {
        title = `Test prep — ${testsTomorrow[0].title}`;
        kind = "test-prep";
        subject = testsTomorrow[0].subject;
      } else if (backlogQueue.length > 0) {
        const item = backlogQueue.shift();
        if (item) {
          title = `Backlog — ${item.title}`;
          kind = "backlog";
          subject = item.subject;
        }
      } else {
        const chapter = recentChapters[recentChapters.length - 1 - (blocks.length % 3)];
        if (chapter) {
          title = `Revision — ${chapter.chapter}`;
          kind = "revision";
          subject = chapter.subject;
        }
      }

      blocks.push({ id: uid("blk"), startTime: slot.start, endTime: end, title, subject, kind });
      remaining -= minutes / 60;
    }

    blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    days.push({
      date,
      hours: Number(blocks.reduce((sum, b) => sum + hoursBetween(b.startTime, b.endTime), 0).toFixed(1)),
      blocks,
    });
    cursor = addDays(cursor, 1);
  }

  return {
    id: uid("plan"),
    name:
      input.name ??
      `Plan · ${format(parseISO(input.startDate), "d MMM")}–${format(parseISO(input.endDate), "d MMM")}`,
    startDate: input.startDate,
    endDate: input.endDate,
    dailyHours: input.dailyHours,
    includeBacklog: input.includeBacklog,
    createdAt: new Date().toISOString(),
    days,
  };
}

export function dueReminders(reminders: Reminder[], now = new Date()): Reminder[] {
  return reminders.filter((r) => {
    if (!r.enabled || r.fired) return false;
    return !isAfter(new Date(r.datetime), now);
  });
}

export function upcomingReminders(reminders: Reminder[], now = new Date()): Reminder[] {
  return reminders
    .filter((r) => r.enabled && !r.fired && isAfter(new Date(r.datetime), now))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export function serializePlanner(state: {
  meta: { name: string; source?: string; batch?: string } | null;
  lectures: Lecture[];
  tests: TestItem[];
}) {
  return {
    name: state.meta?.name ?? "JEE 360 planner",
    source: state.meta?.source,
    batch: state.meta?.batch,
    timezone: "Asia/Kolkata",
    lectures: state.lectures.map((l) => ({
      title: l.title,
      subject: l.subject,
      chapter: l.chapter,
      date: l.date,
      startTime: l.startTime,
      endTime: l.endTime,
      faculty: l.faculty,
      type: l.type,
      notes: l.notes,
    })),
    tests: state.tests.map((t) => ({
      title: t.title,
      subject: t.subject,
      date: t.date,
      startTime: t.startTime,
      durationMinutes: t.durationMinutes,
      syllabus: t.syllabus,
      type: t.type,
      maxScore: t.maxScore,
    })),
  };
}
