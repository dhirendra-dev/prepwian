export type Theme = "light" | "dark";

export const SUBJECTS = ["physics", "chemistry", "maths"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const LECTURE_TYPES = ["lecture", "revision", "doubt", "dpp", "lab"] as const;
export type LectureType = (typeof LECTURE_TYPES)[number];

export const LECTURE_STATUSES = ["upcoming", "attended", "missed"] as const;
export type LectureStatus = (typeof LECTURE_STATUSES)[number];

export const TEST_TYPES = ["chapter", "part", "full", "mock", "pyq"] as const;
export type TestType = (typeof TEST_TYPES)[number];

export const TEST_STATUSES = ["upcoming", "completed", "missed"] as const;
export type TestStatus = (typeof TEST_STATUSES)[number];

export const TEST_SUBJECTS = ["physics", "chemistry", "maths", "full"] as const;
export type TestSubject = (typeof TEST_SUBJECTS)[number];

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const BACKLOG_STATUSES = ["open", "in_progress", "cleared"] as const;
export type BacklogStatus = (typeof BACKLOG_STATUSES)[number];

export type Lecture = {
  id: string;
  title: string;
  subject: Subject;
  chapter: string;
  date: string;
  startTime: string;
  endTime: string;
  faculty?: string;
  type: LectureType;
  status: LectureStatus;
  notes?: string;
};

export type TestItem = {
  id: string;
  title: string;
  subject: TestSubject;
  date: string;
  startTime: string;
  durationMinutes: number;
  syllabus: string[];
  type: TestType;
  status: TestStatus;
  score?: number;
  maxScore: number;
  rank?: number;
  source: "planner" | "manual";
};

export type BacklogItem = {
  id: string;
  lectureId?: string;
  title: string;
  subject: Subject;
  chapter: string;
  missedDate: string;
  plannedCatchupDate?: string;
  plannedMinutes: number;
  priority: Priority;
  status: BacklogStatus;
  notes?: string;
};

export type PlanBlock = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  subject?: Subject | "full";
  kind: "lecture" | "revision" | "backlog" | "test" | "test-prep" | "self-study";
  notes?: string;
};

export type PlanDay = {
  date: string;
  hours: number;
  blocks: PlanBlock[];
};

export type StudyPlan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  dailyHours: number;
  includeBacklog: boolean;
  createdAt: string;
  days: PlanDay[];
};

export type Reminder = {
  id: string;
  title: string;
  datetime: string;
  type: "lecture" | "test" | "revision" | "custom";
  relatedId?: string;
  enabled: boolean;
  source: "auto" | "manual";
  fired: boolean;
};

export type PlannerMeta = {
  name: string;
  source?: string;
  batch?: string;
  importedAt: string;
};

export type MemoryCard = {
  id: string;
  subject: Subject;
  chapter: string;
  prompt: string;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: string;
  lastReviewed?: string;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  minutes: number;
  title: string;
  subject?: Subject;
  relatedId?: string;
  status: "completed" | "abandoned";
};

export type ActiveFocus = {
  startedAt: number;
  durationMin: number;
  title: string;
  subject?: Subject;
  relatedId?: string;
};

export type CoachMode = "briefing" | "now" | "drill";

export type CoachBriefing = {
  date: string;
  mode: CoachMode;
  text: string;
  generatedAt: string;
};

export const MISTAKE_KINDS = ["silly", "concept", "calculation"] as const;
export type MistakeKind = (typeof MISTAKE_KINDS)[number];

export type Mistake = {
  id: string;
  subject: Subject;
  chapter: string;
  concept: string;
  kind: MistakeKind;
  date: string;
  status: "open" | "cleared";
  testTitle?: string;
};

export type SprintRun = {
  id: string;
  startedAt: string;
  subject: Subject | "mix";
  correct: number;
  total: number;
  seconds: number;
};

export type Settings = {
  examDate: string;
  dailyHours: number;
  reminderLeadMinutes: number;
  notificationsEnabled: boolean;
  theme: Theme;
};

export type AppState = {
  hasOnboarded: boolean;
  isDemo: boolean;
  meta: PlannerMeta | null;
  lectures: Lecture[];
  tests: TestItem[];
  backlog: BacklogItem[];
  plans: StudyPlan[];
  reminders: Reminder[];
  settings: Settings;
  cards: MemoryCard[];
  focusSessions: FocusSession[];
  activeFocus: ActiveFocus | null;
  lastBriefing: CoachBriefing | null;
  mistakes: Mistake[];
  sprintRuns: SprintRun[];
};
