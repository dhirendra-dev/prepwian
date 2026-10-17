import { addDays, format, isBefore, parseISO } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { combineDateTime, todayISO } from "@/lib/jee360/dates";
import { uid } from "@/lib/jee360/ids";
import { seedFocusSessions } from "@/lib/jee360/intel";
import { buildAutoReminders, generateStudyPlan, serializePlanner } from "@/lib/jee360/planner";
import { addMinutesToTime, type PlannerFile } from "@/lib/jee360/schema";
import { buildSamplePlanner } from "@/lib/jee360/sample-planner";
import { cardsFromLectures, mergeCards, reviewCard, type ReviewGrade } from "@/lib/jee360/srs";
// Theme is owned app-wide by @/lib/theme — JEE 360 settings never override it.
import type {
  ActiveFocus,
  AppState,
  BacklogItem,
  BacklogStatus,
  CoachBriefing,
  FocusSession,
  Lecture,
  LectureStatus,
  Mistake,
  MistakeKind,
  Priority,
  Reminder,
  Settings,
  SprintRun,
  StudyPlan,
  Subject,
  TestItem,
  TestStatus,
} from "@/lib/jee360/types";

const STORAGE_KEY = "jee-360-v1";

const DEFAULT_SETTINGS: Settings = {
  examDate: "2027-01-22",
  dailyHours: 4,
  reminderLeadMinutes: 30,
  notificationsEnabled: false,
  theme: "light",
};

function hydrateLectures(file: PlannerFile, now = new Date()): Lecture[] {
  const today = todayISO(now);
  return file.lectures.map((raw) => {
    const startTime = raw.startTime ?? "08:00";
    const endTime = raw.endTime ?? addMinutesToTime(startTime, raw.durationMinutes ?? 90);
    let status: LectureStatus = "upcoming";
    if (raw.date < today) status = "attended";
    else if (raw.date === today) {
      const end = combineDateTime(raw.date, endTime);
      if (isBefore(end, now)) status = "attended";
    }
    return {
      id: raw.id ?? uid("lec"),
      title: raw.title,
      subject: raw.subject,
      chapter: raw.chapter,
      date: raw.date,
      startTime,
      endTime,
      faculty: raw.faculty,
      type: raw.type ?? "lecture",
      status,
      notes: raw.notes,
    };
  });
}

function hydrateTests(file: PlannerFile, now = new Date()): TestItem[] {
  const today = todayISO(now);
  return (file.tests ?? []).map((raw) => ({
    id: raw.id ?? uid("tst"),
    title: raw.title,
    subject: raw.subject ?? "full",
    date: raw.date,
    startTime: raw.startTime ?? "09:00",
    durationMinutes: raw.durationMinutes ?? 180,
    syllabus: raw.syllabus ?? [],
    type: raw.type ?? "part",
    status: (raw.date < today ? "completed" : "upcoming") as TestStatus,
    maxScore: raw.maxScore ?? 300,
    source: "planner" as const,
  }));
}

function demoScoredTests(now: Date): TestItem[] {
  return [
    {
      id: uid("tst"),
      title: "Weekly Test 17",
      subject: "full",
      date: format(addDays(now, -14), "yyyy-MM-dd"),
      startTime: "09:00",
      durationMinutes: 180,
      syllabus: ["Rotational Motion", "Chemical Bonding", "Sequences and Series"],
      type: "part",
      status: "completed",
      maxScore: 300,
      source: "planner",
      score: 172,
      rank: 31200,
    },
    {
      id: uid("tst"),
      title: "Weekly Test 18",
      subject: "full",
      date: format(addDays(now, -7), "yyyy-MM-dd"),
      startTime: "09:00",
      durationMinutes: 180,
      syllabus: ["Gravitation", "Thermodynamics", "Straight Lines"],
      type: "part",
      status: "completed",
      maxScore: 300,
      source: "planner",
      score: 186,
      rank: 14200,
    },
  ];
}

function seedMistakes(now: Date): Mistake[] {
  return [
    {
      id: uid("err"),
      subject: "physics",
      chapter: "Rotational Motion",
      concept: "Direction of friction in pure rolling",
      kind: "concept",
      date: format(addDays(now, -2), "yyyy-MM-dd"),
      status: "open",
      testTitle: "Weekly Test 18",
    },
    {
      id: uid("err"),
      subject: "chemistry",
      chapter: "Chemical Bonding",
      concept: "Bond order of O2+",
      kind: "silly",
      date: format(addDays(now, -2), "yyyy-MM-dd"),
      status: "open",
      testTitle: "Weekly Test 18",
    },
    {
      id: uid("err"),
      subject: "maths",
      chapter: "Conic Sections",
      concept: "Eccentricity of ellipse vs hyperbola",
      kind: "concept",
      date: format(addDays(now, -7), "yyyy-MM-dd"),
      status: "open",
      testTitle: "Weekly Test 17",
    },
    {
      id: uid("err"),
      subject: "physics",
      chapter: "SHM",
      concept: "Phase difference in velocity vs displacement",
      kind: "calculation",
      date: format(addDays(now, -7), "yyyy-MM-dd"),
      status: "cleared",
      testTitle: "Weekly Test 17",
    },
  ];
}

function seedDemo(now = new Date()): Pick<
  AppState,
  | "meta"
  | "lectures"
  | "tests"
  | "backlog"
  | "reminders"
  | "isDemo"
  | "hasOnboarded"
  | "cards"
  | "focusSessions"
  | "mistakes"
  | "sprintRuns"
> {
  const file = buildSamplePlanner(now);
  const lectures = hydrateLectures(file, now);
  const tests = hydrateTests(file, now);
  const pastUpcoming = lectures.filter((l) => l.date < todayISO(now));
  const targets = [
    pastUpcoming.find((l) => l.subject === "physics"),
    pastUpcoming.find((l) => l.subject === "chemistry"),
    pastUpcoming.find((l) => l.subject === "maths" && l.type === "lecture"),
  ].filter(Boolean) as Lecture[];

  for (const lec of targets) lec.status = "missed";

  const completed = tests.filter((t) => t.status === "completed");
  completed.forEach((t, i) => {
    t.score = 164 + i * 14;
    t.rank = 420 - i * 90;
  });
  if (completed.length === 0) tests.push(...demoScoredTests(now));

  const backlog: BacklogItem[] = lectures
    .filter((l) => l.status === "missed")
    .map((l) => ({
      id: uid("bl"),
      lectureId: l.id,
      title: l.title,
      subject: l.subject,
      chapter: l.chapter,
      missedDate: l.date,
      plannedMinutes: 90,
      priority: "high" as const,
      status: "open" as const,
    }));

  return {
    meta: {
      name: file.name,
      source: file.source,
      batch: file.batch,
      importedAt: now.toISOString(),
    },
    lectures,
    tests,
    backlog,
    reminders: buildAutoReminders(lectures, tests, DEFAULT_SETTINGS.reminderLeadMinutes),
    cards: cardsFromLectures(lectures, now),
    focusSessions: seedFocusSessions(now),
    mistakes: seedMistakes(now),
    sprintRuns: [
      {
        id: uid("spr"),
        startedAt: format(addDays(now, -1), "yyyy-MM-dd") + "T19:10:00",
        subject: "mix",
        correct: 6,
        total: 8,
        seconds: 82,
      },
    ],
    isDemo: true,
    hasOnboarded: true,
  };
}

type Actions = {
  loadSample: () => void;
  importPlanner: (file: PlannerFile, mode: "replace" | "merge") => void;
  clearPlanner: () => void;
  exportPlanner: () => ReturnType<typeof serializePlanner>;
  setLectureStatus: (id: string, status: LectureStatus) => void;
  addTest: (test: Omit<TestItem, "id" | "source" | "status">) => void;
  updateTest: (id: string, patch: Partial<TestItem>) => void;
  deleteTest: (id: string) => void;
  addBacklog: (item: {
    title: string;
    subject: Subject;
    chapter: string;
    missedDate: string;
    priority: Priority;
  }) => void;
  updateBacklog: (
    id: string,
    patch: Partial<Pick<BacklogItem, "status" | "plannedCatchupDate" | "priority" | "notes">>,
  ) => void;
  generatePlan: (opts: {
    startDate: string;
    endDate: string;
    dailyHours: number;
    includeBacklog: boolean;
    name?: string;
  }) => StudyPlan;
  deletePlan: (id: string) => void;
  addReminder: (input: { title: string; datetime: string; type: Reminder["type"] }) => void;
  toggleReminder: (id: string, enabled: boolean) => void;
  deleteReminder: (id: string) => void;
  markRemindersFired: (ids: string[]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  dismissDemo: () => void;
  startFocus: (input: { durationMin: number; title: string; subject?: Subject; relatedId?: string }) => void;
  stopFocus: (status: FocusSession["status"]) => void;
  reviewMemory: (id: string, grade: ReviewGrade) => void;
  ensureCards: () => void;
  saveBriefing: (briefing: CoachBriefing) => void;
  addMistake: (item: {
    subject: Subject;
    chapter: string;
    concept: string;
    kind: MistakeKind;
    testTitle?: string;
  }) => void;
  updateMistake: (id: string, patch: Partial<Pick<Mistake, "status" | "concept">>) => void;
  logSprint: (run: Omit<SprintRun, "id" | "startedAt">) => void;
};

function rebuildAutos(state: AppState): Reminder[] {
  const manual = state.reminders.filter((r) => r.source === "manual");
  const autos = buildAutoReminders(state.lectures, state.tests, state.settings.reminderLeadMinutes);
  return [...autos, ...manual];
}

function syncBacklogFromLecture(
  backlog: BacklogItem[],
  lecture: Lecture,
  status: LectureStatus,
): BacklogItem[] {
  if (status === "missed") {
    if (backlog.some((b) => b.lectureId === lecture.id && b.status !== "cleared")) return backlog;
    return [
      {
        id: uid("bl"),
        lectureId: lecture.id,
        title: lecture.title,
        subject: lecture.subject,
        chapter: lecture.chapter,
        missedDate: lecture.date,
        plannedMinutes: 90,
        priority: "high",
        status: "open",
      },
      ...backlog,
    ];
  }
  if (status === "attended") {
    return backlog.map((b) =>
      b.lectureId === lecture.id ? { ...b, status: "cleared" as BacklogStatus } : b,
    );
  }
  return backlog;
}

const emptyState: AppState = {
  hasOnboarded: false,
  isDemo: false,
  meta: null,
  lectures: [],
  tests: [],
  backlog: [],
  plans: [],
  reminders: [],
  settings: DEFAULT_SETTINGS,
  cards: [],
  focusSessions: [],
  activeFocus: null,
  lastBriefing: null,
  mistakes: [],
  sprintRuns: [],
};

export const useAppStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      ...emptyState,

      loadSample: () => {
        const seeded = seedDemo();
        set({
          ...seeded,
          plans: [],
          settings: get().settings,
          activeFocus: null,
          lastBriefing: get().lastBriefing,
        });
      },

      importPlanner: (file, mode) => {
        const now = new Date();
        const incomingLectures = hydrateLectures(file, now);
        const incomingTests = hydrateTests(file, now);

        if (mode === "merge" && get().lectures.length > 0) {
          const lectures = [...get().lectures, ...incomingLectures];
          const tests = [
            ...get().tests,
            ...incomingTests.filter(
              (t) => !get().tests.some((x) => x.title === t.title && x.date === t.date),
            ),
          ];
          set({
            lectures,
            tests,
            meta: { name: file.name, source: file.source, batch: file.batch, importedAt: now.toISOString() },
            isDemo: false,
            hasOnboarded: true,
            cards: mergeCards(get().cards, lectures, now),
            reminders: rebuildAutos({ ...get(), lectures, tests, isDemo: false }),
          });
          return;
        }

        const next: AppState = {
          ...get(),
          meta: { name: file.name, source: file.source, batch: file.batch, importedAt: now.toISOString() },
          lectures: incomingLectures,
          tests: [...get().tests.filter((t) => t.source === "manual"), ...incomingTests],
          backlog: [],
          cards: mergeCards([], incomingLectures, now),
          isDemo: false,
          hasOnboarded: true,
        };
        set({ ...next, reminders: rebuildAutos(next) });
      },

      clearPlanner: () => {
        set({
          hasOnboarded: true,
          isDemo: false,
          meta: null,
          lectures: [],
          tests: get().tests.filter((t) => t.source === "manual"),
          backlog: [],
          reminders: get().reminders.filter((r) => r.source === "manual"),
          cards: [],
          activeFocus: null,
        });
      },

      exportPlanner: () => serializePlanner(get()),

      setLectureStatus: (id, status) => {
        const lecture = get().lectures.find((l) => l.id === id);
        if (!lecture) return;
        const lectures = get().lectures.map((l) => (l.id === id ? { ...l, status } : l));
        const backlog = syncBacklogFromLecture(get().backlog, { ...lecture, status }, status);
        const next = { ...get(), lectures, backlog };
        set({ lectures, backlog, reminders: rebuildAutos(next), isDemo: false });
      },

      addTest: (test) => {
        const item: TestItem = {
          ...test,
          id: uid("tst"),
          source: "manual",
          status: isBefore(parseISO(test.date), parseISO(todayISO())) ? "completed" : "upcoming",
        };
        const tests = [...get().tests, item];
        set({ tests, reminders: rebuildAutos({ ...get(), tests }), isDemo: false });
      },

      updateTest: (id, patch) => {
        const tests = get().tests.map((t) => (t.id === id ? { ...t, ...patch } : t));
        set({ tests, reminders: rebuildAutos({ ...get(), tests }) });
      },

      deleteTest: (id) => {
        const tests = get().tests.filter((t) => t.id !== id);
        set({ tests, reminders: get().reminders.filter((r) => r.relatedId !== id) });
      },

      addBacklog: (item) => {
        set({
          backlog: [
            {
              id: uid("bl"),
              title: item.title,
              subject: item.subject,
              chapter: item.chapter,
              missedDate: item.missedDate,
              plannedMinutes: 90,
              priority: item.priority,
              status: "open",
            },
            ...get().backlog,
          ],
          isDemo: false,
        });
      },

      updateBacklog: (id, patch) => {
        set({ backlog: get().backlog.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
      },

      generatePlan: (opts) => {
        const plan = generateStudyPlan({
          lectures: get().lectures,
          tests: get().tests,
          backlog: get().backlog,
          settings: get().settings,
          ...opts,
        });
        set({ plans: [plan, ...get().plans] });
        return plan;
      },

      deletePlan: (id) => {
        set({ plans: get().plans.filter((p) => p.id !== id) });
      },

      addReminder: (input) => {
        const reminder: Reminder = {
          id: uid("rem"),
          title: input.title,
          datetime: input.datetime,
          type: input.type,
          enabled: true,
          source: "manual",
          fired: false,
        };
        set({ reminders: [...get().reminders, reminder] });
      },

      toggleReminder: (id, enabled) => {
        set({ reminders: get().reminders.map((r) => (r.id === id ? { ...r, enabled } : r)) });
      },

      deleteReminder: (id) => {
        set({ reminders: get().reminders.filter((r) => r.id !== id) });
      },

      markRemindersFired: (ids) => {
        if (ids.length === 0) return;
        const setIds = new Set(ids);
        set({
          reminders: get().reminders.map((r) => (setIds.has(r.id) ? { ...r, fired: true } : r)),
        });
      },

      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        const next = { ...get(), settings };
        set({
          settings,
          reminders: patch.reminderLeadMinutes !== undefined ? rebuildAutos(next) : get().reminders,
        });

      },

      dismissDemo: () => set({ isDemo: false }),

      startFocus: (input) => {
        if (get().activeFocus) return;
        set({
          activeFocus: {
            startedAt: Date.now(),
            durationMin: input.durationMin,
            title: input.title,
            subject: input.subject,
            relatedId: input.relatedId,
          },
          isDemo: false,
        });
      },

      stopFocus: (status) => {
        const active = get().activeFocus;
        if (!active) return;
        const elapsed = Math.max(1, Math.round((Date.now() - active.startedAt) / 60000));
        const session: FocusSession = {
          id: uid("foc"),
          startedAt: new Date(active.startedAt).toISOString(),
          minutes: status === "completed" ? active.durationMin : Math.min(elapsed, active.durationMin),
          title: active.title,
          subject: active.subject,
          relatedId: active.relatedId,
          status,
        };
        set({ activeFocus: null, focusSessions: [session, ...get().focusSessions] });
      },

      reviewMemory: (id, grade) => {
        const today = todayISO();
        set({
          cards: get().cards.map((c) => (c.id === id ? reviewCard(c, grade, today) : c)),
          isDemo: false,
        });
      },

      ensureCards: () => {
        const { cards, lectures } = get();
        if (lectures.length === 0) return;
        const next = mergeCards(cards, lectures);
        if (next !== cards) set({ cards: next });
      },

      saveBriefing: (briefing) => set({ lastBriefing: briefing }),

      addMistake: (item) => {
        set({
          mistakes: [
            {
              id: uid("err"),
              ...item,
              date: todayISO(),
              status: "open",
            },
            ...get().mistakes,
          ],
          isDemo: false,
        });
      },

      updateMistake: (id, patch) => {
        set({ mistakes: get().mistakes.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
      },

      logSprint: (run) => {
        set({
          sprintRuns: [
            { id: uid("spr"), startedAt: new Date().toISOString(), ...run },
            ...get().sprintRuns,
          ],
          isDemo: false,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        isDemo: state.isDemo,
        meta: state.meta,
        lectures: state.lectures,
        tests: state.tests,
        backlog: state.backlog,
        plans: state.plans,
        reminders: state.reminders,
        settings: state.settings,
        cards: state.cards,
        focusSessions: state.focusSessions,
        activeFocus: state.activeFocus,
        lastBriefing: state.lastBriefing,
        mistakes: state.mistakes,
        sprintRuns: state.sprintRuns,
      }),
    },
  ),
);

const PERSISTED_KEYS = [
  "hasOnboarded",
  "isDemo",
  "meta",
  "lectures",
  "tests",
  "backlog",
  "plans",
  "reminders",
  "settings",
  "cards",
  "focusSessions",
  "activeFocus",
  "lastBriefing",
  "mistakes",
  "sprintRuns",
] as const;

let didSyncHydrate = false;

/** Read localStorage synchronously so the first client paint already has data. */
export function hydrateStoreSync() {
  if (didSyncHydrate || typeof window === "undefined") return;
  didSyncHydrate = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
      const incoming = (parsed.state ?? parsed) as Partial<AppState>;
      const patch: Partial<AppState> = {};
      for (const key of PERSISTED_KEYS) {
        if (key in incoming) (patch as Record<string, unknown>)[key] = incoming[key];
      }
      if (incoming.settings) {
        patch.settings = { ...DEFAULT_SETTINGS, ...incoming.settings };
      }
      useAppStore.setState(patch);
      const current = useAppStore.getState();
      if ((!current.cards || current.cards.length === 0) && current.lectures.length > 0) {
        useAppStore.setState({ cards: cardsFromLectures(current.lectures) });
      }
      const after = useAppStore.getState();
      if (after.isDemo && !after.tests.some((t) => typeof t.score === "number")) {
        useAppStore.setState({ tests: [...after.tests, ...demoScoredTests(new Date())] });
      }
      const demo = useAppStore.getState();
      if (demo.isDemo && (!demo.mistakes || demo.mistakes.length === 0)) {
        useAppStore.setState({ mistakes: seedMistakes(new Date()) });
      }
      const active = useAppStore.getState().activeFocus as ActiveFocus | null;
      if (active && Date.now() >= active.startedAt + active.durationMin * 60_000) {
        useAppStore.getState().stopFocus("completed");
      }

    } else {
      useAppStore.getState().loadSample();

    }
  } catch {
    useAppStore.getState().loadSample();

  }
}

if (typeof window !== "undefined") {
  hydrateStoreSync();
}

export function defaultPlanRange(now = new Date()) {
  return {
    startDate: todayISO(now),
    endDate: format(addDays(now, 13), "yyyy-MM-dd"),
  };
}
