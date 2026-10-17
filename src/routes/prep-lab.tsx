import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  CalendarDays,
  Brain,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileQuestion,
  Filter,
  Flame,
  FlaskConical,
  GraduationCap,
  Layers3,
  Lightbulb,
  Microscope,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  PREP_DIFFICULTIES,
  PREP_EXAMS,
  PREP_QUESTION_COUNT,
  PREP_SUBJECTS,
  prepQuestionBank,
  validateImportedQuestion,
  type Difficulty,
  type ExamTrack,
  type PrepQuestion,
  type PrepSubject,
} from "@/lib/prep-lab-bank";
import "@/styles/prep-lab.css";

export const Route = createFileRoute("/prep-lab")({
  head: () => ({
    meta: [
      { title: "Prep Lab — Adaptive JEE & NEET Practice | PREPWIAN" },
      { name: "description", content: "Build targeted JEE Main, JEE Advanced and NEET UG practice sessions from a 2,000-question original generated practice bank." },
      { property: "og:title", content: "Prep Lab — Adaptive Practice" },
      { property: "og:description", content: "Personalised practice sessions, worked explanations, bookmarks and mistake review." },
    ],
  }),
  component: PrepLabPage,
});

type PracticeMode = "Balanced mix" | "Smart weak topics" | "Challenge mode" | "Revision queue";
type PageTab = "practice" | "bank" | "revision" | "plan" | "syllabus" | "intelligence" | "errors";
type SyllabusStatus = "Not started" | "In progress" | "Completed" | "Needs revision";
type ErrorCategory = "Concept gap" | "Calculation error" | "Careless mistake" | "Question misunderstood" | "Time pressure" | "Lucky guess";
type ResponseEntry = { selected: number | null; checked: boolean; correct?: boolean };
type AttemptRecord = {
  id: string;
  questionId: string;
  subject: PrepSubject;
  chapter: string;
  topic: string;
  question: string;
  options: string[];
  selected: number;
  answerIndex: number;
  correct: boolean;
  explanation: string;
  exam: ExamTrack;
  at: string;
};
type SessionRecord = {
  id: string;
  exam: ExamTrack;
  subject: string;
  mode: PracticeMode;
  total: number;
  correct: number;
  seconds: number;
  at: string;
};
type MockReport = {
  id: string;
  name: string;
  exam: ExamTrack;
  date: string;
  subject: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
  maxScore: number;
  durationMinutes: number;
};
type StoredState = {
  attempts: AttemptRecord[];
  sessions: SessionRecord[];
  bookmarks: string[];
  customQuestions: PrepQuestion[];
  dailyGoal: number;
  syllabusStatuses: Record<string, SyllabusStatus>;
  mockReports: MockReport[];
  errorCategories: Record<string, ErrorCategory>;
};

const STORAGE_KEY = "jee-prep-hub-prep-lab-v1";
const blankStored: StoredState = { attempts: [], sessions: [], bookmarks: [], customQuestions: [], dailyGoal: 30, syllabusStatuses: {}, mockReports: [], errorCategories: {} };

function shuffle<T,>(source: T[]): T[] {
  const array = [...source];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function percent(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0;
}
function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
function readStored(): StoredState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return blankStored;
    const parsed = JSON.parse(value) as Partial<StoredState>;
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      customQuestions: Array.isArray(parsed.customQuestions) ? parsed.customQuestions : [],
      dailyGoal: typeof parsed.dailyGoal === "number" ? parsed.dailyGoal : 30,
      syllabusStatuses: parsed.syllabusStatuses && typeof parsed.syllabusStatuses === "object" ? parsed.syllabusStatuses as Record<string, SyllabusStatus> : {},
      mockReports: Array.isArray(parsed.mockReports) ? parsed.mockReports.filter((item): item is MockReport => !!item && typeof item.name === "string" && typeof item.score === "number" && typeof item.maxScore === "number") : [],
      errorCategories: parsed.errorCategories && typeof parsed.errorCategories === "object" ? parsed.errorCategories as Record<string, ErrorCategory> : {},
    };
  } catch {
    return blankStored;
  }
}
function Metric({ icon: Icon, label, value, note, tone = "violet" }: {
  icon: typeof Target;
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="pl-metric">
      <div className={`pl-metric-icon ${tone}`}><Icon size={18} /></div>
      <div className="pl-metric-label">{label}</div>
      <div className="pl-metric-value">{value}</div>
      <div className="pl-metric-note">{note}</div>
    </div>
  );
}
function TabButton({ value, active, icon: Icon, onClick, children }: {
  value: PageTab;
  active: PageTab;
  icon: typeof Target;
  onClick: (value: PageTab) => void;
  children: ReactNode;
}) {
  return (
    <button className={`pl-tab ${active === value ? "active" : ""}`} onClick={() => onClick(value)}>
      <Icon size={16} /> {children}
    </button>
  );
}
function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="pl-empty"><div className="pl-empty-icon"><FileQuestion size={24} /></div><strong>{title}</strong><p>{detail}</p></div>;
}

function PrepLabPage() {
  const [exam, setExam] = useState<ExamTrack>("JEE Advanced");
  const [subject, setSubject] = useState<PrepSubject | "All">("All");
  const [chapter, setChapter] = useState("All chapters");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [mode, setMode] = useState<PracticeMode>("Smart weak topics");
  const [targetCount, setTargetCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(0);
  const [tab, setTab] = useState<PageTab>("practice");
  const [query, setQuery] = useState("");
  const [bankPage, setBankPage] = useState(0);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<PrepQuestion[]>([]);
  const [dailyGoal, setDailyGoal] = useState(30);
  const [syllabusStatuses, setSyllabusStatuses] = useState<Record<string, SyllabusStatus>>({});
  const [syllabusSubject, setSyllabusSubject] = useState<PrepSubject | "All">("All");
  const [syllabusFilter, setSyllabusFilter] = useState<"All statuses" | SyllabusStatus>("All statuses");
  const [mockReports, setMockReports] = useState<MockReport[]>([]);
  const [errorCategories, setErrorCategories] = useState<Record<string, ErrorCategory>>({});
  const [mockName, setMockName] = useState("Full syllabus mock");
  const [mockSubject, setMockSubject] = useState("Mixed subjects");
  const [mockTotal, setMockTotal] = useState(90);
  const [mockAttempted, setMockAttempted] = useState(75);
  const [mockCorrect, setMockCorrect] = useState(55);
  const [mockScore, setMockScore] = useState(165);
  const [mockMaxScore, setMockMaxScore] = useState(300);
  const [mockDuration, setMockDuration] = useState(180);
  const [mockImportMessage, setMockImportMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<PrepQuestion[]>([]);
  const [sessionResponses, setSessionResponses] = useState<Record<string, ResponseEntry>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionLogged, setSessionLogged] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [importMessage, setImportMessage] = useState("");
  const [bankSubject, setBankSubject] = useState<PrepSubject | "All">("All");

  useEffect(() => {
    const saved = readStored();
    setAttempts(saved.attempts);
    setSessions(saved.sessions);
    setBookmarks(saved.bookmarks);
    setCustomQuestions(saved.customQuestions);
    setDailyGoal(saved.dailyGoal);
    setSyllabusStatuses(saved.syllabusStatuses);
    setMockReports(saved.mockReports ?? []);
    setErrorCategories(saved.errorCategories ?? {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const saved: StoredState = { attempts, sessions, bookmarks, customQuestions, dailyGoal, syllabusStatuses, mockReports, errorCategories };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage may be disabled or full */ }
  }, [ready, attempts, sessions, bookmarks, customQuestions, dailyGoal, syllabusStatuses, mockReports, errorCategories]);

  useEffect(() => {
    if (!sessionStartedAt || sessionComplete) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sessionStartedAt, sessionComplete]);

  const allQuestions = useMemo(() => [...prepQuestionBank, ...customQuestions], [customQuestions]);
  const examQuestions = useMemo(() => allQuestions.filter((q) => q.exams.includes(exam)), [allQuestions, exam]);
  const chapters = useMemo(() => {
    const subset = subject === "All" ? examQuestions : examQuestions.filter((q) => q.subject === subject);
    return [...new Set(subset.map((q) => q.chapter))].sort((a, b) => a.localeCompare(b));
  }, [examQuestions, subject]);

  const filteredQuestions = useMemo(() => {
    return examQuestions.filter((q) =>
      (subject === "All" || q.subject === subject) &&
      (chapter === "All chapters" || q.chapter === chapter) &&
      (difficulty === "All" || q.difficulty === difficulty) &&
      (tab !== "bank" || bankSubject === "All" || q.subject === bankSubject) &&
      (tab !== "bank" || !query.trim() || `${q.question} ${q.topic} ${q.chapter} ${q.subject}`.toLowerCase().includes(query.toLowerCase()))
    );
  }, [examQuestions, subject, chapter, difficulty, tab, bankSubject, query]);

  const activeQuestion = sessionQuestions[activeIndex];
  const activeResponse = activeQuestion ? sessionResponses[activeQuestion.id] : undefined;
  const checkedAnswers = Object.values(sessionResponses).filter((r) => r.checked);
  const correctInSession = checkedAnswers.filter((r) => r.correct).length;
  const attemptedCount = attempts.length;
  const correctCount = attempts.filter((a) => a.correct).length;
  const overallAccuracy = percent(correctCount, attemptedCount);
  const elapsedSeconds = sessionStartedAt ? Math.floor((clockNow - sessionStartedAt) / 1000) : 0;
  const remainingSeconds = timeLimit > 0 ? Math.max(0, timeLimit * 60 - elapsedSeconds) : null;
  const wrongIds = useMemo(() => new Set(attempts.filter((a) => !a.correct).map((a) => a.questionId)), [attempts]);
  const attemptedIds = useMemo(() => new Set(attempts.map((a) => a.questionId)), [attempts]);
  const savedQuestionSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const topicMistakes = useMemo(() => {
    const map = new Map<string, { subject: PrepSubject; topic: string; chapter: string; misses: number; latest: string }>();
    for (const a of attempts.filter((item) => !item.correct)) {
      const key = `${a.subject}::${a.topic}`;
      const existing = map.get(key);
      map.set(key, { subject: a.subject, topic: a.topic, chapter: a.chapter, misses: (existing?.misses ?? 0) + 1, latest: a.at });
    }
    return [...map.values()].sort((a, b) => b.misses - a.misses || b.latest.localeCompare(a.latest));
  }, [attempts]);
  const recentMistakes = useMemo(() => {
    const latest = new Map<string, AttemptRecord>();
    for (const a of attempts) if (!a.correct) latest.set(a.questionId, a);
    return [...latest.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  }, [attempts]);
  const todayAttempts = useMemo(() => {
    const today = new Date().toDateString();
    return attempts.filter((a) => new Date(a.at).toDateString() === today).length;
  }, [attempts]);

  const chapterMastery = useMemo(() => {
    const map = new Map<string, { subject: PrepSubject; chapter: string; attempts: number; correct: number; lastAt: string }>();
    for (const a of attempts) {
      const key = `${a.subject}::${a.chapter}`;
      const previous = map.get(key);
      map.set(key, {
        subject: a.subject,
        chapter: a.chapter,
        attempts: (previous?.attempts ?? 0) + 1,
        correct: (previous?.correct ?? 0) + (a.correct ? 1 : 0),
        lastAt: !previous || a.at > previous.lastAt ? a.at : previous.lastAt,
      });
    }
    return [...map.values()]
      .map((item) => ({ ...item, mastery: percent(item.correct, item.attempts) }))
      .sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts);
  }, [attempts]);

  const syllabusRows = useMemo(() => {
    const rows = [...new Map(allQuestions
      .filter((q) => q.exams.includes(exam) && (syllabusSubject === "All" || q.subject === syllabusSubject))
      .map((q) => [`${q.subject}::${q.chapter}`, { subject: q.subject, chapter: q.chapter }])).values()]
      .map((item) => {
        const key = `${exam}::${item.subject}::${item.chapter}`;
        const status = syllabusStatuses[key] ?? "Not started";
        const mastery = chapterMastery.find((entry) => entry.subject === item.subject && entry.chapter === item.chapter)?.mastery;
        const attemptsForChapter = chapterMastery.find((entry) => entry.subject === item.subject && entry.chapter === item.chapter)?.attempts ?? 0;
        return { ...item, key, status, mastery, attemptsForChapter };
      });
    return rows.filter((item) => syllabusFilter === "All statuses" || item.status === syllabusFilter)
      .sort((a, b) => a.subject.localeCompare(b.subject) || a.chapter.localeCompare(b.chapter));
  }, [allQuestions, exam, syllabusSubject, syllabusStatuses, syllabusFilter, chapterMastery]);
  const syllabusTotals = useMemo(() => {
    const allRows = [...new Map(allQuestions.filter((q) => q.exams.includes(exam))
      .map((q) => [`${q.subject}::${q.chapter}`, { subject: q.subject, chapter: q.chapter }])).values()];
    const counts = { total: allRows.length, completed: 0, progress: 0, revision: 0, notStarted: 0 };
    for (const row of allRows) {
      const status = syllabusStatuses[`${exam}::${row.subject}::${row.chapter}`] ?? "Not started";
      if (status === "Completed") counts.completed++;
      else if (status === "In progress") counts.progress++;
      else if (status === "Needs revision") counts.revision++;
      else counts.notStarted++;
    }
    return counts;
  }, [allQuestions, exam, syllabusStatuses]);

  const reviewQueue = useMemo(() => {
    const byTopic = new Map<string, { subject: PrepSubject; chapter: string; topic: string; misses: number; lastAt: string; questionId: string }>();
    for (const a of attempts.filter((item) => !item.correct)) {
      const key = `${a.subject}::${a.topic}`;
      const previous = byTopic.get(key);
      byTopic.set(key, {
        subject: a.subject,
        chapter: a.chapter,
        topic: a.topic,
        misses: (previous?.misses ?? 0) + 1,
        lastAt: !previous || a.at > previous.lastAt ? a.at : previous.lastAt,
        questionId: a.questionId,
      });
    }
    const now = Date.now();
    return [...byTopic.values()].map((item) => {
      const intervalDays = item.misses >= 3 ? 1 : item.misses === 2 ? 3 : 1;
      const dueAt = new Date(new Date(item.lastAt).getTime() + intervalDays * 86400000);
      return { ...item, dueAt, due: dueAt.getTime() <= now };
    }).sort((a, b) => Number(b.due) - Number(a.due) || b.misses - a.misses || a.dueAt.getTime() - b.dueAt.getTime());
  }, [attempts]);

  const studyPlan = useMemo(() => {
    const weakest = chapterMastery.slice(0, 3);
    const weakTopic = topicMistakes.slice(0, 3);
    const todayPlan = [
      { id: "review", time: 15, title: "Spaced-repetition review", detail: reviewQueue.length ? `Revisit ${Math.min(3, reviewQueue.length)} topic${reviewQueue.length === 1 ? "" : "s"} from your mistake history.` : "Review saved questions or revisit one recently learned concept.", kind: "revision" as const },
      { id: "weak", time: 25, title: "Repair a weak concept", detail: weakTopic[0] ? `Focus on ${weakTopic[0].topic} (${weakTopic[0].subject}).` : "Choose one chapter and explain its key idea without notes.", kind: "weak" as const },
      { id: "practice", time: 30, title: "Timed active practice", detail: `Complete ${Math.min(dailyGoal, 20)} questions with full attention and review each explanation.`, kind: "practice" as const },
      { id: "recall", time: 10, title: "Close-the-book recall", detail: weakest[0] ? `Write the main formulas and ideas from ${weakest[0].chapter}.` : "Write down formulas, definitions, or reactions from today's topic.", kind: "recall" as const },
    ];
    return todayPlan;
  }, [chapterMastery, topicMistakes, reviewQueue, dailyGoal]);

  const mockAnalytics = useMemo(() => {
    const reports = [...mockReports].sort((a, b) => b.date.localeCompare(a.date));
    const totalScore = reports.reduce((sum, report) => sum + report.score, 0);
    const totalMax = reports.reduce((sum, report) => sum + report.maxScore, 0);
    const latest = reports[0];
    const previous = reports[1];
    const weakSubjects = [...new Set(attempts.map((item) => item.subject))].map((name) => {
      const rows = attempts.filter((item) => item.subject === name);
      return { name, attempts: rows.length, accuracy: percent(rows.filter((item) => item.correct).length, rows.length) };
    }).sort((a, b) => a.accuracy - b.accuracy);
    const recommendations: string[] = [];
    if (latest && latest.attempted < latest.totalQuestions * 0.7) recommendations.push("Attempt more questions strategically: practise question selection and avoid getting stuck too long.");
    if (latest && latest.attempted > 0 && latest.correct / latest.attempted < 0.65) recommendations.push("Prioritise accuracy before speed. Review every incorrect answer and redo it without looking at the solution.");
    if (weakSubjects[0] && weakSubjects[0].accuracy < 70) recommendations.push(`Start with ${weakSubjects[0].name}: your Prep Lab practice accuracy is ${weakSubjects[0].accuracy}%.`);
    if (latest && previous && latest.maxScore > 0 && previous.maxScore > 0 && latest.score / latest.maxScore < previous.score / previous.maxScore) recommendations.push("Your latest logged score percentage is below the previous mock. Compare the error types and revise the chapters behind repeated mistakes.");
    if (!recommendations.length) recommendations.push("Log two or more mock tests and keep practising to unlock more personalised trend-based recommendations.");
    return { reports, totalScore, totalMax, latest, previous, weakSubjects, recommendations, averagePercent: totalMax ? percent(totalScore, totalMax) : 0 };
  }, [mockReports, attempts]);

  function addMockReport() {
    const total = Math.max(1, Math.floor(mockTotal));
    const attempted = Math.min(total, Math.max(0, Math.floor(mockAttempted)));
    const correct = Math.min(attempted, Math.max(0, Math.floor(mockCorrect)));
    const report: MockReport = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: mockName.trim() || "Mock test", exam,
      date: new Date().toISOString(), subject: mockSubject, totalQuestions: total, attempted, correct,
      wrong: attempted - correct, unattempted: total - attempted, score: Math.max(0, mockScore), maxScore: Math.max(1, mockMaxScore), durationMinutes: Math.max(1, mockDuration),
    };
    setMockReports((previous) => [report, ...previous].slice(0, 200));
    setMockImportMessage("Mock result saved. Your dashboard has been updated.");
  }

  async function importMockFile(file?: File) {
    if (!file) return;
    try {
      const raw = await file.text();
      let parsed: unknown;
      if (file.name.toLowerCase().endsWith(".csv")) {
        const lines = raw.split(/\r?\n/).filter((line) => line.trim());
        const headers = (lines.shift() ?? "").split(",").map((value) => value.trim().replace(/^['"]|['"]$/g, ""));
        parsed = lines.map((line) => {
          const values = line.split(",").map((value) => value.trim().replace(/^['"]|['"]$/g, ""));
          return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
        });
      } else parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      const valid = rows.map((row: unknown, index) => {
        const record = row && typeof row === "object" ? row as Record<string, unknown> : {};
        const totalQuestions = Number(record.totalQuestions ?? record.total_questions ?? record.total);
        const attempted = Number(record.attempted ?? record.attemptedQuestions ?? record.attempted_questions ?? 0);
        const correct = Number(record.correct ?? record.correctAnswers ?? record.correct_answers ?? 0);
        const score = Number(record.score);
        const maxScore = Number(record.maxScore ?? record.max_score ?? record.maximumScore);
        if (!Number.isFinite(totalQuestions) || totalQuestions < 1 || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return null;
        const safeAttempted = Math.min(totalQuestions, Math.max(0, attempted));
        const safeCorrect = Math.min(safeAttempted, Math.max(0, correct));
        const track = String(record.exam ?? record.examTrack ?? record.exam_track ?? exam);
        const resolvedExam: ExamTrack = track.toLowerCase().includes("neet") ? "NEET UG" : track.toLowerCase().includes("main") ? "JEE Main" : "JEE Advanced";
        return { id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`, name: String(record.name ?? record.testName ?? record.test_name ?? `Imported mock ${index + 1}`), exam: resolvedExam, date: record.date ? new Date(String(record.date)).toISOString() : new Date().toISOString(), subject: String(record.subject ?? "Mixed subjects"), totalQuestions, attempted: safeAttempted, correct: safeCorrect, wrong: Math.max(0, safeAttempted - safeCorrect), unattempted: Math.max(0, totalQuestions - safeAttempted), score, maxScore, durationMinutes: Math.max(1, Number(record.durationMinutes ?? record.duration_minutes ?? 180) || 180) } as MockReport;
      }).filter((item): item is MockReport => item !== null);
      if (!valid.length) throw new Error("No valid rows found. Include totalQuestions, attempted, correct, score and maxScore.");
      setMockReports((previous) => [...valid, ...previous].slice(0, 200));
      setMockImportMessage(`Imported ${valid.length} mock result${valid.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMockImportMessage(error instanceof Error ? error.message : "Could not read that file. Check its format and try again.");
    }
  }

  function setExamTrack(next: ExamTrack) {
    setExam(next);
    if (next === "NEET UG" && subject === "Mathematics") setSubject("All");
    setChapter("All chapters");
    setBankPage(0);
    setSessionQuestions([]);
    setSessionComplete(false);
  }

  function startPractice(source?: PrepQuestion[]) {
    const effectiveExam = source?.length && !source.some((q) => q.exams.includes(exam))
      ? source.find((q) => q.exams.length > 0)?.exams[0] ?? exam
      : exam;
    if (effectiveExam !== exam) setExam(effectiveExam);
    let pool = source ? [...source] : filteredQuestions.filter((q) =>
      (subject === "All" || q.subject === subject) &&
      (chapter === "All chapters" || q.chapter === chapter) &&
      (difficulty === "All" || q.difficulty === difficulty)
    );
    pool = pool.filter((q) => q.exams.includes(effectiveExam));
    if (!pool.length) return;
    if (mode === "Smart weak topics") {
      pool.sort((a, b) => {
        const score = (q: PrepQuestion) => (wrongIds.has(q.id) ? 100 : 0) + (savedQuestionSet.has(q.id) ? 40 : 0) + (!attemptedIds.has(q.id) ? 12 : 0);
        return score(b) - score(a) || Math.random() - 0.5;
      });
    } else if (mode === "Challenge mode") {
      pool.sort((a, b) => {
        const rank = (d: Difficulty) => d === "Advanced" ? 3 : d === "Standard" ? 2 : 1;
        return rank(b.difficulty) - rank(a.difficulty) || Math.random() - 0.5;
      });
    } else if (mode === "Revision queue") {
      pool.sort((a, b) => {
        const score = (q: PrepQuestion) => (wrongIds.has(q.id) ? 8 : 0) + (savedQuestionSet.has(q.id) ? 5 : 0) + (attemptedIds.has(q.id) ? 2 : 0);
        return score(b) - score(a) || Math.random() - 0.5;
      });
    } else {
      pool = shuffle(pool);
    }
    const chosen = pool.slice(0, Math.min(targetCount, pool.length));
    setSessionQuestions(chosen);
    setSessionResponses({});
    setActiveIndex(0);
    setSessionStartedAt(Date.now());
    setClockNow(Date.now());
    setSessionComplete(false);
    setSessionLogged(false);
    setTab("practice");
    setImportMessage("");
  }

  function checkAnswer() {
    if (!activeQuestion || !activeResponse || activeResponse.checked || activeResponse.selected === null || activeResponse.selected === undefined) return;
    const correct = activeResponse.selected === activeQuestion.answerIndex;
    const response = { ...activeResponse, checked: true, correct };
    setSessionResponses((prev) => ({ ...prev, [activeQuestion.id]: response }));
    const log: AttemptRecord = {
      id: `${Date.now()}-${activeQuestion.id}`,
      questionId: activeQuestion.id,
      subject: activeQuestion.subject,
      chapter: activeQuestion.chapter,
      topic: activeQuestion.topic,
      question: activeQuestion.question,
      options: activeQuestion.options,
      selected: activeResponse.selected,
      answerIndex: activeQuestion.answerIndex,
      correct,
      explanation: activeQuestion.explanation,
      exam,
      at: new Date().toISOString(),
    };
    setAttempts((prev) => [...prev, log].slice(-3000));
  }

  function finishSession() {
    if (!sessionQuestions.length || sessionComplete) return;
    const entries = Object.values(sessionResponses).filter((r) => r.checked);
    const correct = entries.filter((r) => r.correct).length;
    const started = sessionStartedAt ?? Date.now();
    if (!sessionLogged) {
      setSessions((prev) => [{
        id: `${Date.now()}`,
        exam,
        subject: subject === "All" ? "Mixed subjects" : subject,
        mode,
        total: sessionQuestions.length,
        correct,
        seconds: Math.max(0, Math.floor((Date.now() - started) / 1000)),
        at: new Date().toISOString(),
      }, ...prev].slice(0, 200));
      setSessionLogged(true);
    }
    setSessionComplete(true);
    setClockNow(Date.now());
  }

  function jumpToQuestion(index: number) {
    setActiveIndex(Math.max(0, Math.min(sessionQuestions.length - 1, index)));
  }
  function toggleBookmark(questionId: string) {
    setBookmarks((prev) => prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]);
  }
  function retryQuestion(questionId: string) {
    const q = allQuestions.find((item) => item.id === questionId);
    if (q) startPractice([q]);
  }
  function exportBank() {
    const content = JSON.stringify({
      version: 1,
      title: "PREPWIAN Prep Lab question bank",
      note: "Original generated practice variants, not official PYQs.",
      questions: [...prepQuestionBank, ...customQuestions],
    }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jee-prep-hub-prep-lab-bank.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setImportMessage("Question bank exported.");
  }
  function importBank(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImportMessage("File is too large. Keep question imports under 5 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const incoming = Array.isArray(raw) ? raw : raw?.questions;
        if (!Array.isArray(incoming) || incoming.length > 5000) throw new Error("The file must contain a questions array of at most 5,000 items.");
        const valid = incoming.map((item, index) => validateImportedQuestion(item, index)).filter((item): item is PrepQuestion => item !== null);
        if (!valid.length) throw new Error("No valid questions found. See the sample format in the exported bank.");
        setCustomQuestions((prev) => [...prev, ...valid].slice(-5000));
        setImportMessage(`Imported ${valid.length} personal question${valid.length === 1 ? "" : "s"}.`);
      } catch (error) {
        setImportMessage(error instanceof Error ? error.message : "Could not read that JSON file.");
      }
    };
    reader.onerror = () => setImportMessage("The file could not be read.");
    reader.readAsText(file);
    event.target.value = "";
  }
  function resetSession() {
    setSessionQuestions([]);
    setSessionResponses({});
    setSessionStartedAt(null);
    setSessionComplete(false);
    setSessionLogged(false);
    setActiveIndex(0);
  }

  const bankPageSize = 12;
  const bankRows = filteredQuestions.slice(bankPage * bankPageSize, (bankPage + 1) * bankPageSize);
  const maxBankPage = Math.max(0, Math.ceil(filteredQuestions.length / bankPageSize) - 1);
  const allDone = sessionQuestions.length > 0 && checkedAnswers.length === sessionQuestions.length;
  const canAnswer = Boolean(activeQuestion && activeResponse?.selected !== null && activeResponse?.selected !== undefined && !activeResponse?.checked);
  const modeDescriptions: Record<PracticeMode, string> = {
    "Balanced mix": "Mix subjects and difficulty levels for a broad practice set.",
    "Smart weak topics": "Prioritise mistakes, bookmarked questions and concepts you have not attempted.",
    "Challenge mode": "Put advanced questions first and stretch your problem-solving.",
    "Revision queue": "Bring bookmarked, previously attempted and missed questions back into rotation.",
  };

  return (
    <AppShell>
    <div className="prep-lab">
      <div className="pl-ambient pl-ambient-one" /><div className="pl-ambient pl-ambient-two" />
      <header className="pl-header">
        <div className="pl-brand">
          <div className="pl-logo"><Zap size={22} fill="currentColor" /></div>
          <div><div className="pl-brand-name">PREP <span>LAB</span></div><div className="pl-brand-caption">INTELLIGENT PRACTICE SYSTEM</div></div>
        </div>
        <div className="pl-header-right"><span className="pl-status"><i /> LOCAL PROGRESS ENABLED</span><button className="pl-icon-btn" onClick={exportBank} title="Export the question bank" aria-label="Export the question bank"><Download size={17} /></button></div>
      </header>

      <section className="pl-hero">
        <div className="pl-hero-grid" />
        <div className="pl-hero-copy">
          <div className="pl-kicker"><Sparkles size={14} /> YOUR PERSONAL PREPARATION ENGINE</div>
          <h1>Practice with <span>purpose.</span><br/>Prepare with a system.</h1>
          <p>Target the exact concepts that need work. Build a focused session, learn from every answer, and turn mistakes into your next revision plan.</p>
          <div className="pl-hero-pills"><span><CheckCircle2 size={14}/> Topic-focused practice</span><span><ShieldCheck size={14}/> Worked explanations</span><span><BrainCircuit size={14}/> Adaptive revision</span></div>
        </div>
        <div className="pl-hero-visual">
          <div className="pl-orbit pl-orbit-a" /><div className="pl-orbit pl-orbit-b" /><div className="pl-orbit pl-orbit-c" />
          <div className="pl-hero-core"><BrainCircuit size={36}/></div>
          <div className="pl-float-card pl-float-top"><Target size={15}/><span>Targeted sets</span></div>
          <div className="pl-float-card pl-float-bottom"><TrendingUp size={15}/><span>Learn from errors</span></div>
        </div>
        <div className="pl-hero-foot"><span>BUILT FOR JEE MAIN · JEE ADVANCED · NEET UG</span><span>ORIGINAL GENERATED PRACTICE, NOT OFFICIAL PYQs</span></div>
      </section>

      <div className="pl-track-row">
        <div><div className="pl-small-label">CHOOSE YOUR EXAM TRACK</div><p>Question pools adapt to your exam syllabus focus.</p></div>
        <div className="pl-track-switcher">
          {PREP_EXAMS.map((track) => <button key={track} onClick={() => setExamTrack(track)} className={exam === track ? "active" : ""}>{track === "JEE Advanced" ? <Zap size={15}/> : track === "JEE Main" ? <Target size={15}/> : <GraduationCap size={15}/>} {track}</button>)}
        </div>
      </div>

      <section className="pl-metrics">
        <Metric icon={Layers3} label="QUESTION VARIANTS" value={PREP_QUESTION_COUNT.toLocaleString()} note="Original, parameterised practice" />
        <Metric icon={CheckCircle2} label="QUESTIONS ATTEMPTED" value={attemptedCount.toLocaleString()} note={`${correctCount.toLocaleString()} correct answers`} tone="green" />
        <Metric icon={Activity} label="PRACTICE ACCURACY" value={`${overallAccuracy}%`} note={attemptedCount ? "Across saved answers" : "Starts after your first answer"} tone="blue" />
        <Metric icon={BookmarkCheck} label="SAVED FOR REVISION" value={bookmarks.length.toLocaleString()} note={`${recentMistakes.length} recent mistake topics`} tone="amber" />
      </section>

      <div className="pl-content-grid">
        <aside className="pl-control-column">
          <section className="pl-panel pl-builder">
            <div className="pl-panel-heading"><div><div className="pl-small-label">SESSION BUILDER</div><h2>Design your next set</h2></div><div className="pl-panel-heading-icon"><SlidersIcon /></div></div>
            <label className="pl-field"><span>Subject</span><select value={subject} onChange={(e) => { setSubject(e.target.value as PrepSubject | "All"); setChapter("All chapters"); setBankPage(0); }}><option value="All">All available subjects</option>{PREP_SUBJECTS.filter((s) => exam !== "NEET UG" || s !== "Mathematics").map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="pl-field"><span>Chapter / topic</span><select value={chapter} onChange={(e) => { setChapter(e.target.value); setBankPage(0); }}><option>All chapters</option>{chapters.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="pl-field"><span>Difficulty</span><select value={difficulty} onChange={(e) => { setDifficulty(e.target.value as Difficulty | "All"); setBankPage(0); }}><option value="All">All difficulty levels</option>{PREP_DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select></label>
            <div className="pl-small-label pl-field-label">PRACTICE STRATEGY</div>
            <div className="pl-mode-list">
              {(["Smart weak topics", "Balanced mix", "Challenge mode", "Revision queue"] as PracticeMode[]).map((m) => {
                const Icon = m === "Smart weak topics" ? BrainCircuit : m === "Balanced mix" ? Layers3 : m === "Challenge mode" ? Flame : RotateCcw;
                return <button key={m} className={`pl-mode ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}><span className="pl-mode-icon"><Icon size={17}/></span><span className="pl-mode-copy"><strong>{m}</strong><small>{modeDescriptions[m]}</small></span><span className="pl-mode-radio">{mode === m && <Check size={11}/>}</span></button>;
              })}
            </div>
            <div className="pl-builder-bottom">
              <div><div className="pl-small-label">QUESTIONS PER SET</div><div className="pl-count-options">{[10, 20, 50, 100].map((n) => <button key={n} className={targetCount === n ? "active" : ""} onClick={() => setTargetCount(n)}>{n}</button>)}</div></div>
              <label className="pl-field pl-time-field"><span>Time limit</span><select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}><option value={0}>Untimed</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>60 minutes</option></select></label>
            </div>
            <button className="pl-primary-btn pl-start-btn" onClick={() => startPractice()} disabled={!filteredQuestions.length}><Play size={17} fill="currentColor"/> Build my practice set <ArrowRight size={16}/></button>
            <div className="pl-match-count"><CheckCircle2 size={14}/> {filteredQuestions.length.toLocaleString()} questions match your filters</div>
          </section>
          <section className="pl-panel pl-daily-card">
            <div className="pl-daily-head"><div className="pl-daily-icon"><Flame size={17}/></div><div><div className="pl-small-label">DAILY PRACTICE TARGET</div><strong>{todayAttempts} / {dailyGoal} answers</strong></div><button className="pl-icon-btn" aria-label="Change daily target" title="Set daily target" onClick={() => setDailyGoal((n) => n >= 100 ? 10 : n + 10)}><Target size={15}/></button></div>
            <div className="pl-progress-track"><span style={{ width: `${Math.min(100, percent(todayAttempts, dailyGoal))}%` }} /></div>
            <p>Tap the target icon to adjust your goal in steps of 10. Show up consistently; the score follows the work.</p>
          </section>
        </aside>

        <section className="pl-main-column">
          <div className="pl-tabs">
            <TabButton value="practice" active={tab} icon={Play} onClick={setTab}>Practice session</TabButton>
            <TabButton value="bank" active={tab} icon={Search} onClick={setTab}>Question bank <span className="pl-tab-count">{allQuestions.length.toLocaleString()}</span></TabButton>
            <TabButton value="revision" active={tab} icon={Bookmark} onClick={setTab}>Mistakes & revision</TabButton>
            <TabButton value="plan" active={tab} icon={CalendarDays} onClick={setTab}>Study plan</TabButton>
            <TabButton value="syllabus" active={tab} icon={BookOpenCheck} onClick={setTab}>Syllabus tracker</TabButton>
            <TabButton value="intelligence" active={tab} icon={Brain} onClick={setTab}>Mock intelligence</TabButton>
            <TabButton value="errors" active={tab} icon={BrainCircuit} onClick={setTab}>Error analysis</TabButton>
          </div>

          {tab === "practice" && (
            <section className="pl-practice-area">
              {!sessionQuestions.length && <div className="pl-session-empty">
                <div className="pl-empty-visual"><div className="pl-empty-ring ring-one"/><div className="pl-empty-ring ring-two"/><div className="pl-empty-orb"><BrainCircuit size={36}/></div><span className="pl-empty-spark spark-one"/><span className="pl-empty-spark spark-two"/></div>
                <div className="pl-small-label">YOUR NEXT SESSION IS READY TO BE BUILT</div><h2>Make every question<br/>work for you.</h2><p>Choose a subject, chapter, and strategy on the left. Your set will be assembled from questions matching your preparation goal.</p>
                <div className="pl-session-benefits"><span><CheckCircle2 size={15}/> Step-by-step explanation</span><span><CheckCircle2 size={15}/> Save tough questions</span><span><CheckCircle2 size={15}/> Mistake-led revision</span></div>
                <button className="pl-primary-btn" onClick={() => startPractice()} disabled={!filteredQuestions.length}><Sparkles size={16}/> Generate {Math.min(targetCount, filteredQuestions.length)} questions <ArrowRight size={16}/></button>
              </div>}

              {sessionQuestions.length > 0 && !sessionComplete && activeQuestion && (
                <>
                  <div className="pl-session-toolbar">
                    <div><div className="pl-small-label">{mode.toUpperCase()}</div><h2>Focused practice set</h2><span>{exam} <i>·</i> {sessionQuestions.length} questions</span></div>
                    <div className={`pl-timer-pill ${remainingSeconds !== null && remainingSeconds < 60 ? "warning" : ""}`}><Timer size={16}/><div><small>{remainingSeconds === null ? "ELAPSED" : "TIME LEFT"}</small><strong>{formatDuration(remainingSeconds === null ? elapsedSeconds : remainingSeconds)}</strong></div></div>
                  </div>
                  <div className="pl-session-progress"><span>Question {activeIndex + 1} of {sessionQuestions.length}</span><span>{checkedAnswers.length} answered <i>·</i> {percent(checkedAnswers.length, sessionQuestions.length)}%</span><div><i style={{ width: `${((activeIndex + 1) / sessionQuestions.length) * 100}%` }}/></div></div>
                  <div className="pl-question-card">
                    <div className="pl-question-tags"><span className={`pl-subject-tag ${activeQuestion.subject.toLowerCase()}`}>{activeQuestion.subject}</span><span className="pl-neutral-tag">{activeQuestion.chapter}</span><span className={`pl-difficulty-tag ${activeQuestion.difficulty.toLowerCase()}`}>{activeQuestion.difficulty}</span><span className="pl-question-id">{activeQuestion.id}</span></div>
                    <div className="pl-question-title-row"><h3>{activeQuestion.question}</h3><button className={`pl-bookmark-btn ${savedQuestionSet.has(activeQuestion.id) ? "saved" : ""}`} onClick={() => toggleBookmark(activeQuestion.id)} title={savedQuestionSet.has(activeQuestion.id) ? "Remove bookmark" : "Save for revision"} aria-label="Toggle bookmark">{savedQuestionSet.has(activeQuestion.id) ? <BookmarkCheck size={18}/> : <Bookmark size={18}/>}</button></div>
                    <div className="pl-options">
                      {activeQuestion.options.map((option, index) => {
                        const selected = activeResponse?.selected === index;
                        const checked = activeResponse?.checked ?? false;
                        const isCorrect = activeQuestion.answerIndex === index;
                        const stateClass = checked && isCorrect ? "correct" : checked && selected && !isCorrect ? "incorrect" : selected ? "selected" : "";
                        return <button key={`${activeQuestion.id}-${index}`} className={`pl-option ${stateClass}`} onClick={() => !checked && setSessionResponses((prev) => ({ ...prev, [activeQuestion.id]: { selected: index, checked: false } }))} disabled={checked}><span className="pl-option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{checked && isCorrect && <CheckCircle2 size={18}/>}</button>;
                      })}
                    </div>
                    {activeResponse?.checked && <div className={`pl-explanation ${activeResponse.correct ? "right" : "review"}`}><div className="pl-explanation-heading">{activeResponse.correct ? <CheckCircle2 size={17}/> : <Lightbulb size={17}/>}<strong>{activeResponse.correct ? "Correct — keep that momentum." : "Review this concept before moving on."}</strong></div><p>{activeQuestion.explanation}</p><small>SOURCE: ORIGINAL GENERATED PRACTICE · NOT AN OFFICIAL PYQ</small></div>}
                    <div className="pl-question-footer"><span><ShieldCheck size={14}/> Pick an answer, check it, then read the explanation.</span><div>{!activeResponse?.checked ? <button className="pl-primary-btn" onClick={checkAnswer} disabled={!canAnswer}>Check answer <Check size={15}/></button> : <button className="pl-secondary-btn" onClick={() => activeIndex < sessionQuestions.length - 1 ? jumpToQuestion(activeIndex + 1) : finishSession()}>{activeIndex < sessionQuestions.length - 1 ? <>Next question <ArrowRight size={15}/></> : <>Finish set <CheckCircle2 size={15}/></>}</button>}</div></div>
                  </div>
                  <div className="pl-question-nav"><button className="pl-secondary-btn" onClick={() => jumpToQuestion(activeIndex - 1)} disabled={activeIndex === 0}><ChevronLeft size={15}/> Previous</button><div className="pl-question-dots">{sessionQuestions.map((q, i) => <button key={q.id} aria-label={`Go to question ${i + 1}`} title={`Question ${i + 1}`} className={`${i === activeIndex ? "current" : ""} ${sessionResponses[q.id]?.checked ? (sessionResponses[q.id]?.correct ? "answered-correct" : "answered-wrong") : ""}`} onClick={() => jumpToQuestion(i)}>{i + 1}</button>)}</div><button className="pl-secondary-btn" onClick={() => activeIndex < sessionQuestions.length - 1 ? jumpToQuestion(activeIndex + 1) : finishSession()}>{activeIndex < sessionQuestions.length - 1 ? <>Next <ChevronRight size={15}/></> : <>Finish <CheckCircle2 size={15}/></>}</button></div>
                  <div className="pl-finish-row"><span>{allDone ? "All questions answered. You're ready to review your results." : `${sessionQuestions.length - checkedAnswers.length} question${sessionQuestions.length - checkedAnswers.length === 1 ? "" : "s"} still to answer.`}</span><button onClick={finishSession}>Finish session <ArrowRight size={14}/></button></div>
                  {remainingSeconds === 0 && <div className="pl-time-alert"><Clock3 size={15}/> Time target reached. Finish the set or continue practising without a timer.</div>}
                </>
              )}

              {sessionQuestions.length > 0 && sessionComplete && (
                <div className="pl-results">
                  <div className="pl-result-icon"><TrophyIcon /></div><div className="pl-small-label">SESSION COMPLETE</div><h2>That’s a useful rep.</h2><p>Use the review to choose what needs attention next.</p>
                  <div className="pl-results-grid"><div><span>SCORE</span><strong>{correctInSession}<small> / {sessionQuestions.length}</small></strong></div><div><span>ACCURACY</span><strong>{percent(correctInSession, checkedAnswers.length)}%</strong></div><div><span>TIME</span><strong>{formatDuration(elapsedSeconds)}</strong></div></div>
                  <div className="pl-result-track"><span style={{ width: `${percent(correctInSession, sessionQuestions.length)}%` }}/></div>
                  <div className="pl-results-message">{correctInSession === sessionQuestions.length ? "Excellent work. Try a tougher level or switch to another chapter." : "Good practice. Revisit your incorrect answers, then retry the weak topics while the concepts are fresh."}</div>
                  <div className="pl-result-actions"><button className="pl-primary-btn" onClick={() => startPractice()}><RotateCcw size={16}/> New practice set</button><button className="pl-secondary-btn" onClick={() => setTab("revision")}><Bookmark size={15}/> Review mistakes</button><button className="pl-secondary-btn" onClick={resetSession}><ArrowLeft size={15}/> Back to builder</button></div>
                  <div className="pl-result-review"><h3>Session review</h3>{sessionQuestions.map((q, i) => { const answer = sessionResponses[q.id]; return <button key={q.id} className="pl-review-row" onClick={() => { setSessionComplete(false); setActiveIndex(i); setTab("practice"); }}><span className={answer?.correct ? "review-check good" : answer?.checked ? "review-check bad" : "review-check"}>{answer?.correct ? <Check size={13}/> : answer?.checked ? <X size={13}/> : i + 1}</span><span><strong>{q.topic}</strong><small>{q.subject} · {q.chapter}</small></span><ArrowRight size={15}/></button>; })}</div>
                </div>
              )}
            </section>
          )}

          {tab === "bank" && <section className="pl-bank-panel">
            <div className="pl-bank-title"><div><div className="pl-small-label">BROWSE & FILTER</div><h2>Your practice library</h2><p>Search by topic, chapter, formula, or question. Start a targeted set from any question.</p></div><button className="pl-secondary-btn" onClick={exportBank}><Download size={15}/> Export JSON</button></div>
            <div className="pl-bank-tools"><label className="pl-search-box"><Search size={17}/><input value={query} onChange={(e) => { setQuery(e.target.value); setBankPage(0); }} placeholder="Search questions and topics..."/></label><label className="pl-bank-select"><Filter size={15}/><select value={bankSubject} onChange={(e) => { setBankSubject(e.target.value as PrepSubject | "All"); setBankPage(0); }}><option value="All">All subjects</option>{PREP_SUBJECTS.filter((s) => exam !== "NEET UG" || s !== "Mathematics").map((s) => <option key={s}>{s}</option>)}</select></label></div>
            <div className="pl-bank-count"><span><strong>{filteredQuestions.length.toLocaleString()}</strong> matching questions</span><span>Page {bankPage + 1} of {maxBankPage + 1}</span></div>
            {bankRows.length ? <div className="pl-bank-list">{bankRows.map((q) => <article className="pl-bank-row" key={q.id}><div className={`pl-bank-subject-icon ${q.subject.toLowerCase()}`}>{q.subject === "Physics" ? <Activity size={17}/> : q.subject === "Chemistry" ? <FlaskConical size={17}/> : q.subject === "Mathematics" ? <Target size={17}/> : <Microscope size={17}/>}</div><div className="pl-bank-question"><div className="pl-bank-tags"><span>{q.subject}</span><i>·</i><span>{q.chapter}</span><i>·</i><span>{q.difficulty}</span></div><h3>{q.question}</h3><small>{q.topic} · {q.source === "User imported" ? "Your imported question" : "Original generated practice"}</small></div><div className="pl-bank-actions"><button className={`pl-bookmark-btn ${savedQuestionSet.has(q.id) ? "saved" : ""}`} onClick={() => toggleBookmark(q.id)} aria-label="Bookmark question">{savedQuestionSet.has(q.id) ? <BookmarkCheck size={17}/> : <Bookmark size={17}/>}</button><button className="pl-mini-practice" onClick={() => { setSubject(q.subject); setChapter(q.chapter); startPractice([q]); }}>Practice <ArrowRight size={14}/></button></div></article>)}</div> : <EmptyState title="No matching questions" detail="Try another subject, exam track, or search term."/>}
            <div className="pl-pagination"><button className="pl-secondary-btn" disabled={bankPage === 0} onClick={() => setBankPage((p) => Math.max(0, p - 1))}><ChevronLeft size={15}/> Previous</button><span>{bankPage * bankPageSize + 1}–{Math.min((bankPage + 1) * bankPageSize, filteredQuestions.length)} of {filteredQuestions.length}</span><button className="pl-secondary-btn" disabled={bankPage >= maxBankPage} onClick={() => setBankPage((p) => Math.min(maxBankPage, p + 1))}>Next <ChevronRight size={15}/></button></div>
            <div className="pl-import-card"><div className="pl-import-icon"><Upload size={18}/></div><div><strong>Add your own question set</strong><p>Import a JSON question array using the same shape as the exported bank. Invalid entries are skipped.</p>{importMessage && <small className="pl-import-message">{importMessage}</small>}</div><label className="pl-secondary-btn pl-upload-btn">Import JSON<input type="file" accept=".json,application/json" onChange={importBank}/></label></div>
          </section>}

          {tab === "revision" && <section className="pl-revision-panel">
            <div className="pl-bank-title"><div><div className="pl-small-label">TURN ERRORS INTO PROGRESS</div><h2>Mistakes & revision</h2><p>Questions you missed and saved items get a second pass here.</p></div><div className="pl-revision-stats"><span><strong>{recentMistakes.length}</strong><small>recent misses</small></span><span><strong>{bookmarks.length}</strong><small>bookmarks</small></span></div></div>
            <div className="pl-weak-topics"><div className="pl-small-label">TOPICS TO REVISIT</div>{topicMistakes.slice(0, 5).length ? topicMistakes.slice(0, 5).map((item) => <div className="pl-weak-row" key={`${item.subject}-${item.topic}`}><div className={`pl-weak-icon ${item.subject.toLowerCase()}`}>{item.subject === "Physics" ? <Activity size={16}/> : item.subject === "Chemistry" ? <FlaskConical size={16}/> : item.subject === "Mathematics" ? <Target size={16}/> : <Microscope size={16}/>}</div><div className="pl-weak-copy"><strong>{item.topic}</strong><small>{item.subject} · {item.chapter}</small></div><span className="pl-miss-count">{item.misses} miss{item.misses === 1 ? "" : "es"}</span><button className="pl-mini-practice" onClick={() => { const pool = allQuestions.filter((q) => q.subject === item.subject && q.topic === item.topic); setSubject(item.subject); setChapter(item.chapter); startPractice(pool); }}>Revise <ArrowRight size={14}/></button></div>) : <EmptyState title="No weak topics recorded yet" detail="Answer some questions first. Incorrect answers will shape your personalised revision queue."/>}</div>
            <div className="pl-revision-columns"><div className="pl-revision-list"><div className="pl-small-label">RECENT MISTAKES</div>{recentMistakes.length ? recentMistakes.slice(0, 10).map((a) => <article className="pl-mistake-card" key={a.id}><div className="pl-mistake-title"><span className="pl-mistake-badge"><X size={13}/></span><div><strong>{a.topic}</strong><small>{a.subject} · {a.chapter} · {new Date(a.at).toLocaleDateString()}</small></div><button className="pl-icon-btn" onClick={() => retryQuestion(a.questionId)} title="Retry this question" aria-label="Retry question"><RotateCcw size={15}/></button></div><p>{a.question}</p><div className="pl-answer-compare"><span><small>YOUR ANSWER</small><b className="wrong-text">{a.options[a.selected] ?? "Not recorded"}</b></span><span><small>CORRECT ANSWER</small><b className="right-text">{a.options[a.answerIndex]}</b></span></div><details><summary>Show explanation</summary><p>{a.explanation}</p></details></article>) : <EmptyState title="Mistake book is empty" detail="That is a good start. As you practise, your incorrect answers will be collected here."/>}</div>
              <div className="pl-revision-list"><div className="pl-small-label">SAVED FOR LATER</div>{bookmarks.length ? bookmarks.slice().reverse().slice(0, 12).map((id) => { const q = allQuestions.find((item) => item.id === id); if (!q) return null; return <article className="pl-saved-row" key={id}><div><strong>{q.topic}</strong><p>{q.question}</p><small>{q.subject} · {q.chapter}</small></div><div className="pl-saved-actions"><button className="pl-icon-btn" onClick={() => toggleBookmark(id)} title="Remove bookmark" aria-label="Remove bookmark"><BookmarkCheck size={16}/></button><button className="pl-mini-practice" onClick={() => retryQuestion(id)}>Retry</button></div></article>; }) : <EmptyState title="No saved questions" detail="Tap the bookmark on any question to add it to this list."/>}</div></div>
          </section>}
        </section>
      </div>

          {tab === "plan" && <section className="pl-plan-panel">
            <div className="pl-bank-title"><div><div className="pl-small-label">ADAPTIVE DAILY BLUEPRINT</div><h2>Your preparation plan</h2><p>Built from your practice history, saved questions and weakest recorded chapters. Your plan updates as you practise.</p></div><div className="pl-plan-total"><Clock3 size={17}/><strong>{studyPlan.reduce((sum, item) => sum + item.time, 0)} min</strong><small>planned today</small></div></div>
            <div className="pl-plan-summary">
              <div><span className="pl-small-label">TODAY'S TARGET</span><strong>{dailyGoal} answers</strong><small>{todayAttempts} answered so far</small><div className="pl-progress-track"><span style={{ width: `${Math.min(100, percent(todayAttempts, dailyGoal))}%` }} /></div></div>
              <div><span className="pl-small-label">REVISION QUEUE</span><strong>{reviewQueue.filter((item) => item.due).length} due now</strong><small>{reviewQueue.length} topics tracked from mistakes</small></div>
              <div><span className="pl-small-label">CHAPTER SIGNALS</span><strong>{chapterMastery.length} chapters</strong><small>{chapterMastery.length ? `${chapterMastery[0].mastery}% lowest recorded accuracy` : "Start practising to build mastery data"}</small></div>
            </div>
            <div className="pl-plan-columns">
              <div className="pl-plan-main">
                <div className="pl-small-label">RECOMMENDED ORDER</div>
                {studyPlan.map((item, index) => <article className="pl-plan-task" key={item.id}>
                  <div className="pl-plan-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="pl-plan-task-copy"><strong>{item.title}</strong><p>{item.detail}</p><span><Clock3 size={12}/> {item.time} min</span></div>
                  <button className="pl-mini-practice" onClick={() => {
                    if (item.kind === "revision") {
                      const ids = new Set(reviewQueue.slice(0, 5).map((topic) => topic.questionId));
                      const pool = allQuestions.filter((q) => ids.has(q.id) || savedQuestionSet.has(q.id));
                      if (pool.length) { setMode("Revision queue"); startPractice(pool); }
                      else { setTab("revision"); setImportMessage("Review saved questions or answer a few questions to populate your revision queue."); }
                    } else if (item.kind === "weak" && topicMistakes[0]) {
                      const topic = topicMistakes[0];
                      setSubject(topic.subject); setChapter(topic.chapter);
                      startPractice(allQuestions.filter((q) => q.subject === topic.subject && q.topic === topic.topic));
                    } else {
                      setSubject("All"); setChapter("All chapters"); setMode(item.kind === "practice" ? "Balanced mix" : "Smart weak topics");
                      startPractice();
                    }
                  }}>Start <ArrowRight size={14}/></button>
                </article>)}
                <div className="pl-plan-note"><ShieldCheck size={16}/><p>This is a suggested workflow, not a guarantee of exam readiness. Adjust it around school, rest, and your official syllabus.</p></div>
              </div>
              <aside className="pl-plan-side">
                <div className="pl-small-label">CHAPTER MASTERY</div>
                {chapterMastery.length ? chapterMastery.slice(0, 6).map((item) => <div className="pl-mastery-row" key={`${item.subject}-${item.chapter}`}><div><strong>{item.chapter}</strong><small>{item.subject} · {item.attempts} attempt{item.attempts === 1 ? "" : "s"}</small></div><b>{item.mastery}%</b><div className="pl-mastery-track"><span style={{ width: `${item.mastery}%` }} /></div></div>) : <EmptyState title="No chapter data yet" detail="Complete practice questions to calculate your personal chapter accuracy."/>}
                <div className="pl-small-label pl-due-label">SPACED REVIEW</div>
                {reviewQueue.length ? reviewQueue.slice(0, 5).map((item) => <div className="pl-due-row" key={`${item.subject}-${item.topic}`}><div><strong>{item.topic}</strong><small>{item.subject} · missed {item.misses} time{item.misses === 1 ? "" : "s"}</small></div><span className={item.due ? "due-now" : "due-later"}>{item.due ? "Due now" : item.dueAt.toLocaleDateString()}</span></div>) : <p className="pl-plan-empty-copy">Missed answers will appear here with a suggested review date.</p>}
              </aside>
            </div>
          </section>}

          {tab === "syllabus" && <section className="pl-syllabus-panel">
            <div className="pl-bank-title"><div><div className="pl-small-label">SYLLABUS COMMAND CENTRE</div><h2>Track your chapter progress</h2><p>Mark each chapter as you study it, then use your practice accuracy to decide what needs another pass.</p></div><div className="pl-syllabus-progress-ring"><strong>{syllabusTotals.total ? Math.round((syllabusTotals.completed / syllabusTotals.total) * 100) : 0}%</strong><small>completed</small></div></div>
            <div className="pl-syllabus-summary">
              <div><span className="pl-status-dot complete"/><strong>{syllabusTotals.completed}</strong><small>Completed</small></div>
              <div><span className="pl-status-dot progress"/><strong>{syllabusTotals.progress}</strong><small>In progress</small></div>
              <div><span className="pl-status-dot revise"/><strong>{syllabusTotals.revision}</strong><small>Needs revision</small></div>
              <div><span className="pl-status-dot pending"/><strong>{syllabusTotals.notStarted}</strong><small>Not started</small></div>
            </div>
            <div className="pl-syllabus-tools">
              <label className="pl-bank-select"><GraduationCap size={15}/><select aria-label="Filter syllabus by subject" value={syllabusSubject} onChange={(e) => setSyllabusSubject(e.target.value as PrepSubject | "All")}><option value="All">All subjects</option>{PREP_SUBJECTS.filter((s) => exam !== "NEET UG" || s !== "Mathematics").map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="pl-bank-select"><Filter size={15}/><select aria-label="Filter chapters by status" value={syllabusFilter} onChange={(e) => setSyllabusFilter(e.target.value as "All statuses" | SyllabusStatus)}><option>All statuses</option><option>Not started</option><option>In progress</option><option>Completed</option><option>Needs revision</option></select></label>
            </div>
            <div className="pl-syllabus-list">{syllabusRows.length ? syllabusRows.map((row) => <article className="pl-syllabus-row" key={row.key}>
              <div className="pl-syllabus-subject">{row.subject === "Physics" ? <Activity size={16}/> : row.subject === "Chemistry" ? <FlaskConical size={16}/> : row.subject === "Mathematics" ? <Target size={16}/> : <Microscope size={16}/>}<span>{row.subject}</span></div>
              <div className="pl-syllabus-chapter"><strong>{row.chapter}</strong><small>{row.attemptsForChapter ? `${row.attemptsForChapter} practice attempt${row.attemptsForChapter === 1 ? "" : "s"} · ${row.mastery}% accuracy` : "No practice data yet"}</small>{row.mastery !== undefined && <div className="pl-mastery-track"><span style={{ width: `${row.mastery}%` }}/></div>}</div>
              <label className={`pl-syllabus-status status-${row.status.toLowerCase().replaceAll(" ", "-")}`}><span>Status</span><select aria-label={`Status for ${row.subject} ${row.chapter}`} value={row.status} onChange={(e) => setSyllabusStatuses((previous) => ({ ...previous, [row.key]: e.target.value as SyllabusStatus }))}><option>Not started</option><option>In progress</option><option>Completed</option><option>Needs revision</option></select></label>
              <button className="pl-mini-practice" onClick={() => { setSubject(row.subject); setChapter(row.chapter); setTab("practice"); setMode("Balanced mix"); }}>{"Practise"} <ArrowRight size={14}/></button>
            </article>) : <EmptyState title="No chapters match this filter" detail="Change the subject or status filter to see more chapters."/>}</div>
            <div className="pl-syllabus-footnote"><ShieldCheck size={15}/><p>Progress is saved in this browser. Chapter names come from the current Prep Lab practice bank; this is a personal tracker, not a complete official JEE/NEET syllabus checklist.</p></div>
          </section>}

          {tab === "errors" && <section className="pl-errors-panel">
            <div className="pl-bank-title"><div><div className="pl-small-label">PERSONAL ERROR INTELLIGENCE</div><h2>Understand why answers go wrong</h2><p>Classify missed questions to spot repeat patterns. Your labels are saved in this browser and help you choose a more useful next revision step.</p></div><div className="pl-syllabus-progress-ring"><strong>{recentMistakes.length}</strong><small>recent misses</small></div></div>
            <div className="pl-error-metrics">
              {(["Concept gap", "Calculation error", "Careless mistake", "Question misunderstood", "Time pressure", "Lucky guess"] as ErrorCategory[]).map((category) => {
                const count = attempts.filter((item) => !item.correct && errorCategories[item.id] === category).length;
                return <div key={category}><span>{category}</span><strong>{count}</strong><small>classified errors</small></div>;
              })}
            </div>
            <div className="pl-errors-columns">
              <div className="pl-intel-card"><div className="pl-small-label">RECENT INCORRECT ANSWERS</div><h3>Label your mistakes</h3>
                {recentMistakes.length ? recentMistakes.map((item) => <article className="pl-error-row" key={item.id}>
                  <div className="pl-error-copy"><div><span>{item.subject}</span><span>{item.chapter}</span></div><strong>{item.topic}</strong><p>{item.question}</p><small>{new Date(item.at).toLocaleDateString()} · {item.exam}</small></div>
                  <label><span>Error type</span><select aria-label={`Error category for ${item.topic}`} value={errorCategories[item.id] ?? ""} onChange={(event) => setErrorCategories((previous) => ({ ...previous, [item.id]: event.target.value as ErrorCategory }))}><option value="">Choose type</option><option>Concept gap</option><option>Calculation error</option><option>Careless mistake</option><option>Question misunderstood</option><option>Time pressure</option><option>Lucky guess</option></select></label>
                  <button className="pl-mini-practice" onClick={() => { setSubject(item.subject); setChapter(item.chapter); setMode("Revision queue"); setTab("practice"); }}>Practise chapter <ArrowRight size={13}/></button>
                </article>) : <EmptyState title="No incorrect answers yet" detail="Complete a practice session and check your answers. Missed questions will appear here for reflection."/>}
              </div>
              <div className="pl-intel-card"><div className="pl-small-label">YOUR NEXT REVISION MOVE</div><h3>Pattern-based advice</h3>
                {(() => {
                  const counts = (["Concept gap", "Calculation error", "Careless mistake", "Question misunderstood", "Time pressure", "Lucky guess"] as ErrorCategory[]).map((category) => ({ category, count: attempts.filter((item) => !item.correct && errorCategories[item.id] === category).length })).sort((a, b) => b.count - a.count);
                  const top = counts[0];
                  const advice: Record<ErrorCategory, string> = { "Concept gap": "Pause new problem sets. Relearn one core idea, then solve two easy examples without looking at the solution.", "Calculation error": "Show each algebraic or numerical step and estimate the answer before finalising it.", "Careless mistake": "Use a 5-second final check for units, signs, copied values and the exact quantity asked.", "Question misunderstood": "Underline the given data and rewrite what the question asks in one short sentence before solving.", "Time pressure": "Practise a short timed set and mark a question to return to if progress stalls.", "Lucky guess": "Explain why each option is right or wrong; don't count a guessed correct answer as mastered." };
                  return top && top.count ? <><div className="pl-error-top-pattern"><strong>{top.category}</strong><span>{top.count} labelled</span></div><p className="pl-error-advice">{advice[top.category]}</p></> : <p className="pl-error-advice">Label a few missed questions first. A pattern will appear here, with a practical study adjustment based on the most common category.</p>;
                })()}
                <div className="pl-error-tip"><ShieldCheck size={15}/><p>These labels are your own reflection, not an automatic diagnosis. Choose the category that best describes what happened on that question.</p></div>
              </div>
            </div>
          </section>}

          {tab === "intelligence" && <section className="pl-intel-panel">
            <div className="pl-bank-title"><div><div className="pl-small-label">MOCK TEST INTELLIGENCE</div><h2>Turn scores into a smarter next step</h2><p>Log mock results or import a CSV/JSON file to track score trends, question selection and accuracy. Recommendations use your saved mock data and Prep Lab practice history.</p></div><div className="pl-intel-score"><strong>{mockAnalytics.averagePercent}%</strong><small>overall score rate</small></div></div>
            <div className="pl-intel-metrics">
              <div><span className="pl-small-label">MOCKS LOGGED</span><strong>{mockAnalytics.reports.length}</strong><small>saved on this device</small></div>
              <div><span className="pl-small-label">LATEST SCORE</span><strong>{mockAnalytics.latest ? `${mockAnalytics.latest.score}/${mockAnalytics.latest.maxScore}` : "—"}</strong><small>{mockAnalytics.latest ? new Date(mockAnalytics.latest.date).toLocaleDateString() : "Add your first mock"}</small></div>
              <div><span className="pl-small-label">LATEST ACCURACY</span><strong>{mockAnalytics.latest && mockAnalytics.latest.attempted ? `${percent(mockAnalytics.latest.correct, mockAnalytics.latest.attempted)}%` : "—"}</strong><small>correct out of attempted</small></div>
              <div><span className="pl-small-label">UNATTEMPTED</span><strong>{mockAnalytics.latest?.unattempted ?? "—"}</strong><small>in latest logged mock</small></div>
            </div>
            <div className="pl-intel-columns">
              <div className="pl-intel-card">
                <div className="pl-small-label">ADD A MOCK RESULT</div><h3>Quick score entry</h3>
                <div className="pl-intel-form-grid">
                  <label><span>Test name</span><input value={mockName} onChange={(e) => setMockName(e.target.value)} maxLength={90} placeholder="e.g. Sunday full mock"/></label>
                  <label><span>Subject scope</span><select value={mockSubject} onChange={(e) => setMockSubject(e.target.value)}><option>Mixed subjects</option>{PREP_SUBJECTS.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Total questions</span><input type="number" min={1} max={500} value={mockTotal} onChange={(e) => setMockTotal(Number(e.target.value))}/></label>
                  <label><span>Attempted</span><input type="number" min={0} max={500} value={mockAttempted} onChange={(e) => setMockAttempted(Number(e.target.value))}/></label>
                  <label><span>Correct</span><input type="number" min={0} max={500} value={mockCorrect} onChange={(e) => setMockCorrect(Number(e.target.value))}/></label>
                  <label><span>Score</span><input type="number" min={0} value={mockScore} onChange={(e) => setMockScore(Number(e.target.value))}/></label>
                  <label><span>Maximum score</span><input type="number" min={1} value={mockMaxScore} onChange={(e) => setMockMaxScore(Number(e.target.value))}/></label>
                  <label><span>Duration (minutes)</span><input type="number" min={1} value={mockDuration} onChange={(e) => setMockDuration(Number(e.target.value))}/></label>
                </div>
                <button className="pl-primary-btn pl-intel-submit" onClick={addMockReport}><Check size={16}/> Save mock result</button>
                <div className="pl-intel-import"><div><strong>Import results</strong><small>JSON array or CSV rows. Required: totalQuestions, attempted, correct, score, maxScore. Optional: name, exam, date, subject, durationMinutes.</small></div><label className="pl-upload-btn"><Upload size={15}/> Choose file<input type="file" accept=".json,.csv,application/json,text/csv" onChange={(e) => { void importMockFile(e.target.files?.[0]); e.currentTarget.value = ""; }}/></label></div>
                {mockImportMessage && <p className="pl-intel-message" role="status">{mockImportMessage}</p>}
                <button className="pl-secondary-btn pl-intel-export" onClick={() => { const blob = new Blob([JSON.stringify(mockReports, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "jee-prep-hub-mock-results.json"; link.click(); URL.revokeObjectURL(url); }} disabled={!mockReports.length}><Download size={14}/> Export saved results</button>
              </div>
              <div className="pl-intel-card">
                <div className="pl-small-label">NEXT ACTIONS</div><h3>Personalised recommendations</h3>
                {mockAnalytics.recommendations.map((recommendation, index) => <div className="pl-intel-recommendation" key={recommendation}><span>{String(index + 1).padStart(2, "0")}</span><p>{recommendation}</p></div>)}
                <div className="pl-small-label pl-intel-subhead">PRACTICE WEAK SPOTS</div>
                {mockAnalytics.weakSubjects.length ? mockAnalytics.weakSubjects.slice(0, 4).map((item) => <div className="pl-intel-subject" key={item.name}><div><strong>{item.name}</strong><small>{item.attempts} practice attempts</small></div><b>{item.accuracy}%</b><div className="pl-mastery-track"><span style={{ width: `${item.accuracy}%` }}/></div><button className="pl-mini-practice" onClick={() => { setSubject(item.name); setChapter("All chapters"); setMode("Smart weak topics"); setTab("practice"); }}>Practise <ArrowRight size={13}/></button></div>) : <p className="pl-plan-empty-copy">Complete some Prep Lab questions to reveal subject-level practice accuracy.</p>}
              </div>
            </div>
            <div className="pl-intel-history"><div className="pl-small-label">MOCK HISTORY</div>{mockAnalytics.reports.length ? mockAnalytics.reports.slice(0, 12).map((report) => <article key={report.id}><div><strong>{report.name}</strong><small>{report.exam} · {report.subject} · {new Date(report.date).toLocaleDateString()}</small></div><div className="pl-intel-history-score"><b>{report.score}/{report.maxScore}</b><small>{percent(report.score, report.maxScore)}% score rate</small></div><div className="pl-intel-history-stat"><b>{percent(report.correct, report.attempted)}%</b><small>accuracy</small></div><div className="pl-intel-history-stat"><b>{report.unattempted}</b><small>unattempted</small></div><button className="pl-icon-btn" aria-label={`Delete ${report.name}`} title="Delete result" onClick={() => setMockReports((previous) => previous.filter((item) => item.id !== report.id))}><X size={15}/></button></article>) : <EmptyState title="No mock results yet" detail="Enter your latest mock score above, or import a CSV/JSON export to start tracking progress."/>}</div>
            <div className="pl-syllabus-footnote"><ShieldCheck size={15}/><p>Results are stored in this browser only. This version analyses logged overall results and Prep Lab question history; it does not yet parse chapter-wise marks from coaching PDFs or connect to an external test platform.</p></div>
          </section>}

      <footer className="pl-footer"><span>PREPWIAN <i>·</i> PREP LAB</span><span><i/> YOUR WORK, YOUR DATA — STORED IN THIS BROWSER</span><span><ShieldCheck size={13}/> PRIVACY-FIRST PRACTICE</span></footer>
    </div>
    </AppShell>
  );
}

function SlidersIcon() {
  return <Filter size={17} />;
}
function TrophyIcon() {
  return <Target size={28} />;
}
