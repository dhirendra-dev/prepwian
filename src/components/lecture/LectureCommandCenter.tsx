import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  Atom,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
  ListTodo,
  Loader2,
  PencilLine,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/lecture-command-center.css";

type Subject = "PHYSICS" | "CHEMISTRY" | "MATHEMATICS";
type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
type Priority = "low" | "medium" | "high";
type Lecture = {
  id: string;
  subject: Subject;
  title: string;
  chapter: string | null;
  teacher: string | null;
  duration_minutes: number;
  watched_minutes: number;
  status: Status;
  planned_for: string | null;
  lecture_url: string | null;
  source: string | null;
  notes: string | null;
  priority: Priority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
type LectureForm = {
  title: string;
  subject: Subject;
  chapter: string;
  teacher: string;
  duration: string;
  date: string;
  videoUrl: string;
  notes: string;
  priority: Priority;
};
type Tab = "Overview" | "Lecture Library" | "Study Planner" | "Analytics";
type SubjectMeta = { id: Subject; label: string; icon: LucideIcon; tone: string };

const SUBJECTS: SubjectMeta[] = [
  { id: "PHYSICS", label: "Physics", icon: Atom, tone: "blue" },
  { id: "CHEMISTRY", label: "Chemistry", icon: FlaskConical, tone: "pink" },
  { id: "MATHEMATICS", label: "Mathematics", icon: Calculator, tone: "amber" },
];
const STATUSES: Status[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"];
const TABS: { label: Tab; icon: LucideIcon }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Lecture Library", icon: LibraryBig },
  { label: "Study Planner", icon: CalendarClock },
  { label: "Analytics", icon: BarChart3 },
];
const EMPTY_FORM: LectureForm = {
  title: "",
  subject: "PHYSICS",
  chapter: "",
  teacher: "",
  duration: "45",
  date: "",
  videoUrl: "",
  notes: "",
  priority: "medium",
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dateLabel(value: string | null | undefined) {
  if (!value) return "Unscheduled";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function formatMinutes(value: number) {
  const minutes = Math.max(0, Math.round(value));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining} min`;
}
function subjectMeta(subject: string) {
  return SUBJECTS.find((item) => item.id === subject) ?? SUBJECTS[0]!;
}
function statusLabel(status: Status) {
  return status === "IN_PROGRESS"
    ? "In Progress"
    : status.charAt(0) + status.slice(1).toLowerCase();
}
function progressPercent(lecture: Lecture) {
  return lecture.duration_minutes > 0
    ? Math.min(100, Math.round((lecture.watched_minutes / lecture.duration_minutes) * 100))
    : 0;
}

export default function LectureCommandCenter() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [teacherFilter, setTeacherFilter] = useState("ALL");
  const [dailyTarget, setDailyTarget] = useState(3);
  const [savingTarget, setSavingTarget] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<LectureForm>(EMPTY_FORM);
  const [progressDraft, setProgressDraft] = useState(0);
  const [plannerView, setPlannerView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarDate, setCalendarDate] = useState(localDateKey());

  const loadLectures = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    const [lectureResult, targetResult] = await Promise.all([
      supabase.rpc("jee_lecture_command_center_list", {
        _search: undefined,
        _subject: undefined,
        _status: undefined,
        _priority: undefined,
      }),
      supabase.rpc("jee_lecture_command_center_get_preferences"),
    ]);
    if (lectureResult.error) {
      toast.error("Could not load your lectures. Check your connection and retry.");
      console.error("Lecture tracker load failed", lectureResult.error);
      setLoadError(true);
      setLectures([]);
    } else {
      setLoadError(false);
      setLectures((lectureResult.data ?? []) as Lecture[]);
    }
    if (!targetResult.error && Number.isInteger(targetResult.data)) {
      setDailyTarget(Number(targetResult.data));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadLectures();
  }, [loadLectures]);

  const today = localDateKey();
  const stats = useMemo(() => {
    const completed = lectures.filter((item) => item.status === "COMPLETED").length;
    const inProgress = lectures.filter((item) => item.status === "IN_PROGRESS").length;
    const pending = lectures.filter((item) => item.status === "PENDING").length;
    const skipped = lectures.filter((item) => item.status === "SKIPPED").length;
    const overdue = lectures.filter(
      (item) =>
        item.planned_for &&
        item.planned_for < today &&
        item.status !== "COMPLETED" &&
        item.status !== "SKIPPED",
    ).length;
    const totalMinutes = lectures.reduce((sum, item) => sum + item.duration_minutes, 0);
    const watchedMinutes = lectures.reduce((sum, item) => sum + item.watched_minutes, 0);
    return {
      total: lectures.length,
      completed,
      inProgress,
      pending,
      skipped,
      overdue,
      totalMinutes,
      watchedMinutes,
      remainingMinutes: Math.max(0, totalMinutes - watchedMinutes),
      percent: totalMinutes ? Math.min(100, Math.round((watchedMinutes / totalMinutes) * 100)) : 0,
      lecturePercent: lectures.length ? Math.round((completed / lectures.length) * 100) : 0,
    };
  }, [lectures, today]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const found = lectures.filter((item) => {
      const matchesTeacher = teacherFilter === "ALL" || item.teacher === teacherFilter;
      const matchesText = [
        item.title,
        item.subject,
        item.chapter ?? "",
        item.teacher ?? "",
        item.source ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle);
      return (
        matchesText &&
        matchesTeacher &&
        (subjectFilter === "ALL" || item.subject === subjectFilter) &&
        (statusFilter === "ALL" || item.status === statusFilter) &&
        (priorityFilter === "ALL" || item.priority === priorityFilter)
      );
    });
    return found.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") return progressPercent(b) - progressPercent(a);
      if (sortBy === "priority")
        return (
          ["high", "medium", "low"].indexOf(a.priority) -
          ["high", "medium", "low"].indexOf(b.priority)
        );
      return (a.planned_for ?? "9999-12-31").localeCompare(b.planned_for ?? "9999-12-31");
    });
  }, [lectures, query, subjectFilter, statusFilter, priorityFilter, teacherFilter, sortBy]);

  const teacherOptions = useMemo(
    () =>
      [
        ...new Set(
          lectures.map((item) => item.teacher).filter((name): name is string => Boolean(name)),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [lectures],
  );
  const completedToday = lectures.filter(
    (item) => item.status === "COMPLETED" && item.completed_at?.slice(0, 10) === today,
  ).length;

  const todayLectures = useMemo(
    () =>
      lectures
        .filter((item) => item.planned_for === today)
        .sort((a, b) => (a.planned_for ?? "").localeCompare(b.planned_for ?? "")),
    [lectures, today],
  );
  const selected = lectures.find((item) => item.id === selectedId);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: today });
    setShowForm(true);
  }
  function openEdit(lecture: Lecture) {
    setEditingId(lecture.id);
    setForm({
      title: lecture.title,
      subject: lecture.subject,
      chapter: lecture.chapter ?? "",
      teacher: lecture.teacher ?? "",
      duration: String(lecture.duration_minutes),
      date: lecture.planned_for ?? "",
      videoUrl: lecture.lecture_url ?? "",
      notes: lecture.notes ?? "",
      priority: lecture.priority,
    });
    setShowForm(true);
  }

  async function saveLecture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const duration = Number(form.duration);
    if (!title || title.length > 180) return toast.error("Enter a title up to 180 characters.");
    if (!Number.isInteger(duration) || duration < 1 || duration > 600)
      return toast.error("Duration must be 1–600 minutes.");
    if (form.videoUrl && !/^https?:\/\//i.test(form.videoUrl.trim()))
      return toast.error("Use a valid http or https video link.");
    setSaving(true);
    const { error } = await supabase.rpc("jee_lecture_command_center_save", {
      _lecture_id: editingId,
      _subject: form.subject,
      _title: title,
      _chapter: form.chapter.trim() || null,
      _teacher: form.teacher.trim() || null,
      _duration_minutes: duration,
      _lecture_url: form.videoUrl.trim() || null,
      _planned_for: form.date || null,
      _notes: form.notes.trim() || null,
      _priority: form.priority,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save this lecture.");
      return;
    }
    toast.success(editingId ? "Lecture updated" : "Lecture added to your library");
    setShowForm(false);
    setEditingId(null);
    await loadLectures(true);
  }

  async function saveDailyTarget(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 12) {
      toast.error("Choose a daily target between 1 and 12 lectures.");
      return;
    }
    setSavingTarget(true);
    const { error } = await supabase.rpc("jee_lecture_command_center_set_preferences", {
      _daily_target: value,
    });
    setSavingTarget(false);
    if (error) {
      toast.error("Could not save your daily target.");
      return;
    }
    setDailyTarget(value);
    toast.success("Daily lecture target saved");
  }

  async function changeProgress(lecture: Lecture, watchedMinutes: number, status?: Status) {
    setBusyId(lecture.id);
    const { error } = await supabase.rpc("jee_lecture_command_center_progress", {
      _lecture_id: lecture.id,
      _watched_minutes: Math.max(0, Math.min(lecture.duration_minutes, watchedMinutes)),
      _status: status,
    });
    setBusyId(null);
    if (error) {
      toast.error("Could not update lecture progress.");
      return;
    }
    if (status === "COMPLETED") toast.success("Lecture completed");
    await loadLectures(true);
  }

  async function deleteLecture(lecture: Lecture) {
    if (!window.confirm(`Delete “${lecture.title}”? This cannot be undone.`)) return;
    setBusyId(lecture.id);
    const { error } = await supabase.rpc("jee_lecture_command_center_delete", {
      _lecture_id: lecture.id,
    });
    setBusyId(null);
    if (error) {
      toast.error(error.message || "Could not delete lecture.");
      return;
    }
    setSelectedId(null);
    toast.success("Lecture deleted");
    await loadLectures(true);
  }

  const week = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + index);
      return localDateKey(date);
    });
    return dates.map((date) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
      count: lectures.filter(
        (item) => item.status === "COMPLETED" && item.completed_at?.slice(0, 10) === date,
      ).length,
    }));
  }, [lectures]);
  const weekMax = Math.max(1, ...week.map((day) => day.count));
  const consistencyDays = week.filter((day) => day.count > 0).length;
  const monthDays = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  ).getDate();
  const monthOffset = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const monthKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthLectures = lectures.filter((item) => item.planned_for?.startsWith(monthKey));
  const selectedDateLectures = lectures
    .filter((item) => item.planned_for === calendarDate)
    .sort((a, b) => (a.planned_for ?? "").localeCompare(b.planned_for ?? ""));
  const upcoming = lectures
    .filter((item) => item.status !== "COMPLETED" && item.status !== "SKIPPED")
    .sort((a, b) => (a.planned_for ?? "9999-12-31").localeCompare(b.planned_for ?? "9999-12-31"));

  return (
    <main className="lcc-shell">
      <div className="lcc-app">
        <aside className="lcc-sidebar" aria-label="Lecture workspace navigation">
          <div className="lcc-brand" aria-label="PREPWIAN study system">
            <span className="lcc-brand-mark">
              <Sparkles size={19} />
            </span>
            <span>
              PREPWIAN<small>STUDY SYSTEM</small>
            </span>
          </div>
          <div className="lcc-side-label">WORKSPACE</div>
          {TABS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`lcc-nav ${tab === label ? "active" : ""}`}
              onClick={() => setTab(label)}
              aria-current={tab === label ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Lecture Library" && (
                <span className="lcc-nav-count">{lectures.length}</span>
              )}
            </button>
          ))}
          <div className="lcc-side-bottom">
            <div className="lcc-goal-card">
              <Target size={18} />
              <strong>Make today count.</strong>
              <p>Small, consistent sessions beat last-minute marathons.</p>
            </div>
            <div className="lcc-profile">
              <div className="lcc-avatar">JP</div>
              <div>
                <strong>Your study space</strong>
                <small>Personal dashboard</small>
              </div>
            </div>
          </div>
        </aside>

        <section className="lcc-main">
          <header className="lcc-topbar">
            <div className="lcc-breadcrumb">
              Workspace <span>/</span> <b>{tab}</b>
            </div>
            <div className="lcc-top-actions">
              <span className="lcc-date">
                <CalendarDays size={15} />{" "}
                {new Date().toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button className="lcc-primary lcc-small" onClick={openNew}>
                <Plus size={16} /> Add lecture
              </button>
            </div>
          </header>
          <nav className="lcc-mobile-tabs" aria-label="Lecture sections">
            {TABS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={tab === label ? "active" : ""}
                onClick={() => setTab(label)}
              >
                <Icon size={15} />
                <span>
                  {label === "Lecture Library"
                    ? "Library"
                    : label === "Study Planner"
                      ? "Planner"
                      : label}
                </span>
              </button>
            ))}
          </nav>

          <div className="lcc-content">
            {loading ? (
              <div className="lcc-loading" role="status">
                <Loader2 className="lcc-spinner" size={22} /> Loading your lecture workspace…
              </div>
            ) : loadError ? (
              <section className="lcc-panel lcc-error-state" role="alert">
                <div className="lcc-empty-icon">
                  <Activity size={22} />
                </div>
                <strong>We couldn’t load your lecture workspace</strong>
                <p>Your saved lectures are unchanged. Check your connection and try again.</p>
                <button className="lcc-primary" onClick={() => void loadLectures()}>
                  <Activity size={15} /> Retry loading
                </button>
              </section>
            ) : (
              <>
                {tab === "Overview" && (
                  <>
                    <section className="lcc-hero">
                      <div className="lcc-hero-copy">
                        <div className="lcc-eyebrow">
                          <span className="lcc-pulse" /> YOUR PREPARATION, IN CONTROL
                        </div>
                        <h1>
                          Build momentum.
                          <br />
                          <span>One lecture at a time.</span>
                        </h1>
                        <p>
                          Your personal command center for lectures, backlog and study progress.
                        </p>
                        <div className="lcc-hero-actions">
                          <button
                            className="lcc-primary"
                            onClick={() => {
                              const next = upcoming[0];
                              setTab("Lecture Library");
                              if (next) {
                                setSelectedId(next.id);
                                setProgressDraft(next.watched_minutes);
                              }
                            }}
                          >
                            <Play size={16} fill="currentColor" /> Continue studying
                          </button>
                          <button className="lcc-secondary" onClick={() => setTab("Study Planner")}>
                            <CalendarDays size={16} /> Plan my day
                          </button>
                        </div>
                      </div>
                      <div className="lcc-orbit">
                        <div className="lcc-orbit-ring ring-one" />
                        <div className="lcc-orbit-ring ring-two" />
                        <div className="lcc-orbit-core">
                          <BookOpen size={34} />
                          <span>FOCUS</span>
                        </div>
                        <div className="lcc-orbit-chip chip-one">
                          <CheckCircle2 size={15} /> Stay consistent
                        </div>
                        <div className="lcc-orbit-chip chip-two">
                          <Timer size={15} /> {formatMinutes(stats.remainingMinutes)} left
                        </div>
                      </div>
                    </section>
                    <div className="lcc-section-heading">
                      <div>
                        <h2>Your progress</h2>
                        <p>Live totals calculated from your saved lectures.</p>
                      </div>
                      <button className="lcc-link-button" onClick={() => setTab("Analytics")}>
                        View analytics <span>↗</span>
                      </button>
                    </div>
                    <div className="lcc-stat-grid">
                      <Stat
                        icon={BookOpen}
                        label="Total lectures"
                        value={stats.total}
                        note="In your library"
                        tone="blue"
                      />
                      <Stat
                        icon={CheckCircle2}
                        label="Completed"
                        value={stats.completed}
                        note={`${stats.lecturePercent}% of all lectures`}
                        tone="green"
                      />
                      <Stat
                        icon={Activity}
                        label="In progress"
                        value={stats.inProgress}
                        note="Pick up where you left off"
                        tone="violet"
                      />
                      <Stat
                        icon={Clock3}
                        label="Overdue"
                        value={stats.overdue}
                        note={`${stats.pending} pending lectures`}
                        tone="amber"
                      />
                    </div>
                    <div className="lcc-two-col">
                      <section className="lcc-panel">
                        <div className="lcc-panel-head">
                          <div>
                            <h3>Today’s plan</h3>
                            <p>
                              {dateLabel(today)} · {todayLectures.length} scheduled
                            </p>
                          </div>
                          <button
                            className="lcc-icon-btn"
                            aria-label="Open planner"
                            onClick={() => setTab("Study Planner")}
                          >
                            <CalendarDays size={17} />
                          </button>
                        </div>
                        {todayLectures.length ? (
                          <div className="lcc-timeline">
                            {todayLectures.slice(0, 4).map((lecture) => (
                              <LectureRow
                                key={lecture.id}
                                lecture={lecture}
                                onOpen={() => {
                                  setSelectedId(lecture.id);
                                  setProgressDraft(lecture.watched_minutes);
                                }}
                                onStatus={() =>
                                  void changeProgress(
                                    lecture,
                                    lecture.status === "COMPLETED" ? 0 : lecture.duration_minutes,
                                    lecture.status === "COMPLETED" ? "PENDING" : "COMPLETED",
                                  )
                                }
                                busy={busyId === lecture.id}
                                compact
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="A clean slate"
                            body="Add a lecture and schedule it for today."
                            action="Add a lecture"
                            onClick={openNew}
                          />
                        )}
                      </section>
                      <section className="lcc-panel">
                        <div className="lcc-panel-head">
                          <div>
                            <h3>Overall progress</h3>
                            <p>Completed study time across your library</p>
                          </div>
                          <span className="lcc-tag">{stats.percent}%</span>
                        </div>
                        <div className="lcc-progress-hero">
                          <div className="lcc-progress-number">
                            {stats.percent}
                            <small>%</small>
                          </div>
                          <div>
                            <strong>{formatMinutes(stats.watchedMinutes)} studied</strong>
                            <p>of {formatMinutes(stats.totalMinutes)} planned</p>
                          </div>
                        </div>
                        <div className="lcc-progress-track">
                          <span style={{ width: `${stats.percent}%` }} />
                        </div>
                        <div className="lcc-progress-foot">
                          <span>
                            <i className="dot green-dot" /> Progress recorded
                          </span>
                          <span>{formatMinutes(stats.remainingMinutes)} remaining</span>
                        </div>
                        <div className="lcc-mini-metrics">
                          <div>
                            <span>Pending backlog</span>
                            <strong>{stats.pending + stats.inProgress} lectures</strong>
                          </div>
                          <div>
                            <span>Overdue tasks</span>
                            <strong>{stats.overdue} lectures</strong>
                          </div>
                        </div>
                      </section>
                    </div>
                    <div className="lcc-section-heading lcc-library-heading">
                      <div>
                        <h2>Pick up where you left off</h2>
                        <p>Your next unfinished lectures.</p>
                      </div>
                      <button className="lcc-link-button" onClick={() => setTab("Lecture Library")}>
                        Open library <span>↗</span>
                      </button>
                    </div>
                    <div className="lcc-continue-grid">
                      {upcoming.slice(0, 3).map((lecture) => (
                        <LectureCard
                          key={lecture.id}
                          lecture={lecture}
                          onClick={() => {
                            setSelectedId(lecture.id);
                            setProgressDraft(lecture.watched_minutes);
                          }}
                        />
                      ))}
                    </div>
                    {!lectures.length && (
                      <div className="lcc-panel lcc-onboard">
                        <EmptyState
                          title="Start your lecture library"
                          body="Add your first lecture to plan study sessions and track your real progress."
                          action="Add your first lecture"
                          onClick={openNew}
                        />
                      </div>
                    )}
                    {!!lectures.length && !upcoming.length && (
                      <div className="lcc-panel lcc-onboard">
                        <EmptyState
                          title="You’re all caught up"
                          body="All saved lectures are complete. Add another lecture when you’re ready."
                          action="Add a lecture"
                          onClick={openNew}
                        />
                      </div>
                    )}
                  </>
                )}

                {tab === "Lecture Library" && (
                  <>
                    <PageHeading
                      eyebrow="YOUR KNOWLEDGE BASE"
                      title="Lecture library"
                      subtitle="Organize lectures, track progress and get back to learning."
                      action={
                        <button className="lcc-primary" onClick={openNew}>
                          <Plus size={16} /> Add lecture
                        </button>
                      }
                    />
                    <div className="lcc-filter-panel">
                      <div className="lcc-search">
                        <Search size={17} />
                        <input
                          aria-label="Search lectures"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search title, chapter, teacher…"
                        />
                      </div>
                      <div className="lcc-filter-row">
                        <div className="lcc-pills">
                          <button
                            onClick={() => setSubjectFilter("ALL")}
                            className={`lcc-pill ${subjectFilter === "ALL" ? "selected" : ""}`}
                          >
                            All subjects
                          </button>
                          {SUBJECTS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setSubjectFilter(item.id)}
                              className={`lcc-pill ${subjectFilter === item.id ? "selected" : ""}`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        <div className="lcc-filter-selects">
                          <label className="lcc-select-wrap">
                            <span className="sr-only">Filter by status</span>
                            <select
                              value={statusFilter}
                              onChange={(event) => setStatusFilter(event.target.value)}
                            >
                              <option value="ALL">All statuses</option>
                              {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabel(status)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={15} />
                          </label>
                          <label className="lcc-select-wrap">
                            <span className="sr-only">Filter by priority</span>
                            <select
                              value={priorityFilter}
                              onChange={(event) => setPriorityFilter(event.target.value)}
                            >
                              <option value="ALL">All priorities</option>
                              <option value="high">High priority</option>
                              <option value="medium">Medium priority</option>
                              <option value="low">Low priority</option>
                            </select>
                            <ChevronDown size={15} />
                          </label>
                          <label className="lcc-select-wrap">
                            <span className="sr-only">Filter by teacher</span>
                            <select
                              value={teacherFilter}
                              onChange={(event) => setTeacherFilter(event.target.value)}
                            >
                              <option value="ALL">All teachers</option>
                              {teacherOptions.map((teacher) => (
                                <option key={teacher} value={teacher}>
                                  {teacher}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={15} />
                          </label>
                          <label className="lcc-select-wrap">
                            <span className="sr-only">Sort lectures</span>
                            <select
                              value={sortBy}
                              onChange={(event) => setSortBy(event.target.value)}
                            >
                              <option value="date">Sort: planned date</option>
                              <option value="title">Sort: title</option>
                              <option value="priority">Sort: priority</option>
                              <option value="progress">Sort: progress</option>
                            </select>
                            <ChevronDown size={15} />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="lcc-library-summary">
                      <span>
                        {filtered.length} lecture{filtered.length === 1 ? "" : "s"} found
                      </span>
                      <span>
                        {formatMinutes(
                          filtered.reduce((sum, item) => sum + item.duration_minutes, 0),
                        )}{" "}
                        total duration
                      </span>
                    </div>
                    <div className="lcc-lecture-list">
                      {filtered.map((lecture) => (
                        <LectureRow
                          key={lecture.id}
                          lecture={lecture}
                          onOpen={() => {
                            setSelectedId(lecture.id);
                            setProgressDraft(lecture.watched_minutes);
                          }}
                          onStatus={() =>
                            void changeProgress(
                              lecture,
                              lecture.status === "COMPLETED" ? 0 : lecture.duration_minutes,
                              lecture.status === "COMPLETED" ? "PENDING" : "COMPLETED",
                            )
                          }
                          onEdit={() => openEdit(lecture)}
                          onDelete={() => void deleteLecture(lecture)}
                          busy={busyId === lecture.id}
                          showDate
                        />
                      ))}
                    </div>
                    {!filtered.length && (
                      <div className="lcc-panel">
                        <EmptyState
                          title={lectures.length ? "No lectures match" : "Your library is ready"}
                          body={
                            lectures.length
                              ? "Try a different search or filter."
                              : "Add a lecture to start tracking your study plan."
                          }
                          action="Add lecture"
                          onClick={openNew}
                        />
                      </div>
                    )}
                  </>
                )}

                {tab === "Study Planner" && (
                  <>
                    <PageHeading
                      eyebrow="PLAN WITH PURPOSE"
                      title="Study planner"
                      subtitle="See upcoming work, overdue lectures and the day’s study plan."
                      action={
                        <button className="lcc-primary" onClick={openNew}>
                          <Plus size={16} /> Schedule lecture
                        </button>
                      }
                    />
                    <div className="lcc-planner-banner">
                      <div className="lcc-planner-icon">
                        <CalendarClock size={23} />
                      </div>
                      <div className="lcc-target-summary">
                        <strong>
                          Today’s target · {completedToday}/{dailyTarget} lectures completed
                        </strong>
                        <p>
                          {todayLectures.length} scheduled ·{" "}
                          {formatMinutes(
                            todayLectures.reduce((sum, item) => sum + item.duration_minutes, 0),
                          )}{" "}
                          estimated study time · {stats.overdue} overdue
                        </p>
                        <div className="lcc-target-track">
                          <span
                            style={{
                              width: `${Math.min(100, Math.round((completedToday / dailyTarget) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <label className="lcc-target-control">
                        <span>Daily target</span>
                        <select
                          disabled={savingTarget}
                          value={dailyTarget}
                          onChange={(event) => void saveDailyTarget(Number(event.target.value))}
                        >
                          {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                            <option key={value} value={value}>
                              {value} lecture{value === 1 ? "" : "s"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="lcc-secondary"
                        onClick={() => {
                          setStatusFilter("PENDING");
                          setTab("Lecture Library");
                        }}
                      >
                        View backlog <ListTodo size={15} />
                      </button>
                    </div>
                    <div className="lcc-planner-controls">
                      <div className="lcc-section-heading">
                        <div>
                          <h2>
                            {plannerView === "calendar" ? "Monthly calendar" : "Upcoming schedule"}
                          </h2>
                          <p>
                            {plannerView === "calendar"
                              ? "Choose a date to view its lectures."
                              : "Scheduled lectures first; unscheduled items last."}
                          </p>
                        </div>
                        <div className="lcc-view-switch">
                          <button
                            className={plannerView === "list" ? "active" : ""}
                            onClick={() => setPlannerView("list")}
                            aria-pressed={plannerView === "list"}
                          >
                            List
                          </button>
                          <button
                            className={plannerView === "calendar" ? "active" : ""}
                            onClick={() => setPlannerView("calendar")}
                            aria-pressed={plannerView === "calendar"}
                          >
                            Calendar
                          </button>
                        </div>
                      </div>
                    </div>
                    {plannerView === "calendar" ? (
                      <section className="lcc-panel lcc-calendar-panel">
                        <div className="lcc-calendar-head">
                          <button
                            className="lcc-icon-btn"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() - 1,
                                  1,
                                ),
                              )
                            }
                            aria-label="Previous month"
                          >
                            <ChevronLeft size={17} />
                          </button>
                          <h3>
                            {calendarMonth.toLocaleDateString(undefined, {
                              month: "long",
                              year: "numeric",
                            })}
                          </h3>
                          <button
                            className="lcc-icon-btn"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() + 1,
                                  1,
                                ),
                              )
                            }
                            aria-label="Next month"
                          >
                            <ChevronRight size={17} />
                          </button>
                        </div>
                        <div className="lcc-calendar-grid">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <span key={day} className="lcc-calendar-weekday">
                              {day}
                            </span>
                          ))}
                          {Array.from({ length: monthOffset }, (_, index) => (
                            <span key={`blank-${index}`} />
                          ))}
                          {Array.from({ length: monthDays }, (_, index) => {
                            const day = index + 1;
                            const key = `${monthKey}-${String(day).padStart(2, "0")}`;
                            const count = monthLectures.filter(
                              (item) => item.planned_for === key,
                            ).length;
                            return (
                              <button
                                key={key}
                                className={`lcc-calendar-day ${calendarDate === key ? "selected" : ""} ${today === key ? "today" : ""}`}
                                onClick={() => setCalendarDate(key)}
                                aria-label={`${key}, ${count} lectures`}
                              >
                                {day}
                                {count > 0 && <i>{count}</i>}
                              </button>
                            );
                          })}
                        </div>
                        <div className="lcc-calendar-agenda">
                          <div className="lcc-panel-head">
                            <div>
                              <h3>{dateLabel(calendarDate)}</h3>
                              <p>
                                {selectedDateLectures.length} scheduled lecture
                                {selectedDateLectures.length === 1 ? "" : "s"}
                              </p>
                            </div>
                            <button className="lcc-link-button" onClick={openNew}>
                              Add to date +
                            </button>
                          </div>
                          {selectedDateLectures.length ? (
                            selectedDateLectures.map((lecture) => (
                              <LectureRow
                                key={lecture.id}
                                lecture={lecture}
                                onOpen={() => {
                                  setSelectedId(lecture.id);
                                  setProgressDraft(lecture.watched_minutes);
                                }}
                                onStatus={() =>
                                  void changeProgress(
                                    lecture,
                                    lecture.status === "COMPLETED" ? 0 : lecture.duration_minutes,
                                    lecture.status === "COMPLETED" ? "PENDING" : "COMPLETED",
                                  )
                                }
                                onEdit={() => openEdit(lecture)}
                                onDelete={() => void deleteLecture(lecture)}
                                busy={busyId === lecture.id}
                                showDate
                              />
                            ))
                          ) : (
                            <p className="lcc-muted-copy">Nothing planned for this date.</p>
                          )}
                        </div>
                      </section>
                    ) : (
                      <>
                        {stats.overdue > 0 && (
                          <section className="lcc-overdue-panel">
                            <div>
                              <Clock3 size={17} />
                              <strong>
                                {stats.overdue} overdue lecture{stats.overdue === 1 ? "" : "s"}
                              </strong>
                              <span>
                                Reschedule or complete overdue items to clear your backlog.
                              </span>
                            </div>
                            <button
                              className="lcc-link-button"
                              onClick={() => {
                                setStatusFilter("ALL");
                                setTab("Lecture Library");
                              }}
                            >
                              Review backlog ↗
                            </button>
                          </section>
                        )}
                        <div className="lcc-lecture-list">
                          {upcoming.map((lecture) => (
                            <LectureRow
                              key={lecture.id}
                              lecture={lecture}
                              onOpen={() => {
                                setSelectedId(lecture.id);
                                setProgressDraft(lecture.watched_minutes);
                              }}
                              onStatus={() =>
                                void changeProgress(
                                  lecture,
                                  lecture.status === "COMPLETED" ? 0 : lecture.duration_minutes,
                                  lecture.status === "COMPLETED" ? "PENDING" : "COMPLETED",
                                )
                              }
                              onEdit={() => openEdit(lecture)}
                              onDelete={() => void deleteLecture(lecture)}
                              busy={busyId === lecture.id}
                              showDate
                            />
                          ))}
                        </div>
                        {!upcoming.length && (
                          <div className="lcc-panel">
                            <EmptyState
                              title="Your schedule is clear"
                              body="All lectures are complete. Schedule the next topic when you’re ready."
                              action="Schedule lecture"
                              onClick={openNew}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {tab === "Analytics" && (
                  <>
                    <PageHeading
                      eyebrow="MEASURE WHAT MATTERS"
                      title="Study analytics"
                      subtitle="A clear view of progress calculated from your saved lecture records."
                      action={
                        <button
                          className="lcc-secondary"
                          onClick={() => void loadLectures(true)}
                          disabled={refreshing}
                        >
                          {refreshing ? (
                            <Loader2 className="lcc-spinner" size={15} />
                          ) : (
                            <Activity size={15} />
                          )}{" "}
                          Refresh data
                        </button>
                      }
                    />
                    <div className="lcc-stat-grid">
                      <Stat
                        icon={Timer}
                        label="Total workload"
                        value={formatMinutes(stats.totalMinutes)}
                        note="Planned lecture duration"
                        tone="blue"
                      />
                      <Stat
                        icon={CheckCircle2}
                        label="Completed"
                        value={stats.completed}
                        note={`${stats.lecturePercent}% by lecture count`}
                        tone="green"
                      />
                      <Stat
                        icon={Clock3}
                        label="Remaining estimate"
                        value={formatMinutes(stats.remainingMinutes)}
                        note="Based on saved watch progress"
                        tone="amber"
                      />
                      <Stat
                        icon={Target}
                        label="Consistency"
                        value={`${consistencyDays}/7`}
                        note="Days with completed lectures"
                        tone="violet"
                      />
                    </div>
                    <div className="lcc-two-col">
                      <section className="lcc-panel">
                        <div className="lcc-panel-head">
                          <div>
                            <h3>Subject progress</h3>
                            <p>Completion rate by subject</p>
                          </div>
                        </div>
                        {SUBJECTS.map((meta) => {
                          const group = lectures.filter((item) => item.subject === meta.id);
                          const done = group.filter((item) => item.status === "COMPLETED").length;
                          const pct = group.length ? Math.round((done / group.length) * 100) : 0;
                          const Icon = meta.icon;
                          return (
                            <div className="lcc-subject-progress" key={meta.id}>
                              <div className={`lcc-subject-icon ${meta.tone}`}>
                                <Icon size={17} />
                              </div>
                              <div className="lcc-subject-progress-body">
                                <div>
                                  <strong>{meta.label}</strong>
                                  <span>
                                    {done}/{group.length} completed
                                  </span>
                                </div>
                                <div className="lcc-progress-track">
                                  <span style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              <b>{pct}%</b>
                            </div>
                          );
                        })}
                      </section>
                      <section className="lcc-panel">
                        <div className="lcc-panel-head">
                          <div>
                            <h3>Last 7 days</h3>
                            <p>Completed lecture activity</p>
                          </div>
                          <span className="lcc-tag">{consistencyDays} active days</span>
                        </div>
                        <div
                          className="lcc-week-chart"
                          role="img"
                          aria-label={`${consistencyDays} of the last 7 days had completed lectures`}
                        >
                          {week.map((day) => (
                            <div
                              className="lcc-week-column"
                              key={day.date}
                              title={`${day.date}: ${day.count} completed`}
                            >
                              <strong>{day.count || ""}</strong>
                              <span
                                style={{ height: `${Math.max(8, (day.count / weekMax) * 100)}%` }}
                              />
                              <small>{day.label}</small>
                            </div>
                          ))}
                        </div>
                        <div className="lcc-insight">
                          <Sparkles size={17} />
                          <span>
                            {stats.overdue
                              ? `You have ${stats.overdue} overdue lectures. Reschedule them or make a catch-up plan.`
                              : stats.pending + stats.inProgress
                                ? `You have ${stats.pending + stats.inProgress} unfinished lectures. Schedule the next study block to keep momentum.`
                                : "Your unfinished backlog is clear. Add a new study target when ready."}
                          </span>
                        </div>
                      </section>
                    </div>
                    <section className="lcc-panel lcc-analytics-backlog">
                      <div className="lcc-panel-head">
                        <div>
                          <h3>Backlog by status</h3>
                          <p>Pending work and progress in your library</p>
                        </div>
                      </div>
                      {STATUSES.map((status) => {
                        const count = lectures.filter((item) => item.status === status).length;
                        const percent = lectures.length ? (count / lectures.length) * 100 : 0;
                        return (
                          <div className="lcc-status-breakdown" key={status}>
                            <div>
                              <span>{statusLabel(status)}</span>
                              <strong>{count}</strong>
                            </div>
                            <div className="lcc-progress-track">
                              <span style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  </>
                )}
              </>
            )}
          </div>
          <footer className="lcc-footer">
            <span>
              PREPWIAN <i>·</i> LECTURE COMMAND CENTER
            </span>
            <span>Consistency over intensity.</span>
          </footer>
        </section>
      </div>

      {showForm && (
        <div
          className="lcc-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setShowForm(false);
          }}
        >
          <form
            className="lcc-modal"
            onSubmit={(event) => void saveLecture(event)}
            aria-modal="true"
            role="dialog"
            aria-labelledby="lecture-form-title"
          >
            <div className="lcc-modal-head">
              <div>
                <span className="lcc-eyebrow">LECTURE DETAILS</span>
                <h2 id="lecture-form-title">{editingId ? "Edit lecture" : "Add a lecture"}</h2>
              </div>
              <button
                type="button"
                className="lcc-icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Lecture title
              <input
                required
                maxLength={180}
                autoFocus
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Units and Dimensions — L1"
              />
            </label>
            <div className="lcc-form-grid">
              <label>
                Subject
                <select
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value as Subject })}
                >
                  {SUBJECTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  min="1"
                  max="600"
                  required
                  value={form.duration}
                  onChange={(event) => setForm({ ...form, duration: event.target.value })}
                />
              </label>
            </div>
            <div className="lcc-form-grid">
              <label>
                Chapter or topic
                <input
                  maxLength={160}
                  value={form.chapter}
                  onChange={(event) => setForm({ ...form, chapter: event.target.value })}
                  placeholder="e.g. Units and Measurements"
                />
              </label>
              <label>
                Teacher or faculty
                <input
                  maxLength={120}
                  value={form.teacher}
                  onChange={(event) => setForm({ ...form, teacher: event.target.value })}
                  placeholder="Optional"
                />
              </label>
            </div>
            <div className="lcc-form-grid">
              <label>
                Planned date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </label>
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value as Priority })
                  }
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
            <label>
              Video URL (optional)
              <input
                type="url"
                maxLength={2048}
                value={form.videoUrl}
                onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
                placeholder="https://…"
              />
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                maxLength={4000}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Add a reminder, resource or key concept…"
              />
            </label>
            <div className="lcc-modal-actions">
              <button
                type="button"
                className="lcc-secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button className="lcc-primary" type="submit" disabled={saving}>
                {saving ? <Loader2 className="lcc-spinner" size={16} /> : <Check size={16} />}
                {saving ? " Saving…" : editingId ? " Save changes" : " Add lecture"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && !showForm && (
        <div
          className="lcc-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <section
            className="lcc-modal lcc-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lecture-detail-title"
          >
            <div className="lcc-modal-head">
              <div>
                <span className="lcc-eyebrow">
                  {subjectMeta(selected.subject).label.toUpperCase()} ·{" "}
                  {selected.chapter || "LECTURE"}
                </span>
                <h2 id="lecture-detail-title">{selected.title}</h2>
                <p>
                  {selected.duration_minutes} min · {dateLabel(selected.planned_for)}
                  {selected.teacher ? ` · ${selected.teacher}` : ""}
                </p>
              </div>
              <button
                className="lcc-icon-btn"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {selected.lecture_url && (
              <a
                className="lcc-video-link"
                href={selected.lecture_url}
                target="_blank"
                rel="noreferrer"
              >
                <Play size={18} fill="currentColor" /> Open lecture video <span>↗</span>
              </a>
            )}
            <div className="lcc-detail-meta">
              <span className={`lcc-priority-chip ${selected.priority}`}>
                {selected.priority} priority
              </span>
              <span
                className={`lcc-status-label ${selected.status.toLowerCase().replace("_", "-")}`}
              >
                {statusLabel(selected.status)}
              </span>
            </div>
            <div className="lcc-detail-status">
              <label htmlFor="lecture-status">Status</label>
              <select
                id="lecture-status"
                value={selected.status}
                onChange={(event) => {
                  const next = event.target.value as Status;
                  void changeProgress(
                    selected,
                    next === "COMPLETED"
                      ? selected.duration_minutes
                      : next === "PENDING"
                        ? 0
                        : selected.watched_minutes,
                    next,
                  );
                }}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="lcc-range-label">
              <span>Watch progress</span>
              <strong>
                {Math.round((progressDraft / selected.duration_minutes) * 100)}% · {progressDraft}/
                {selected.duration_minutes} min
              </strong>
            </div>
            <input
              className="lcc-range"
              aria-label="Watched minutes"
              type="range"
              min="0"
              max={selected.duration_minutes}
              step="1"
              value={Math.min(progressDraft, selected.duration_minutes)}
              onChange={(event) => setProgressDraft(Number(event.target.value))}
            />
            <p className="lcc-detail-note">
              {selected.notes ||
                "No notes yet. Edit this lecture to add a reminder or key concept."}
            </p>
            <div className="lcc-modal-actions">
              <button
                className="lcc-secondary"
                onClick={() => {
                  setSelectedId(null);
                  openEdit(selected);
                }}
              >
                <PencilLine size={15} /> Edit lecture
              </button>
              <button
                className="lcc-primary"
                onClick={() => void changeProgress(selected, progressDraft)}
                disabled={busyId === selected.id}
              >
                {busyId === selected.id ? (
                  <Loader2 className="lcc-spinner" size={15} />
                ) : (
                  <CheckCircle2 size={16} />
                )}{" "}
                Save progress
              </button>
              {selected.status !== "COMPLETED" && (
                <button
                  className="lcc-complete-button"
                  onClick={() =>
                    void changeProgress(selected, selected.duration_minutes, "COMPLETED")
                  }
                  disabled={busyId === selected.id}
                >
                  Mark complete
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <div className="lcc-stat-card">
      <div className={`lcc-stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="lcc-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <div className={`lcc-stat-glow ${tone}`} />
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="lcc-page-heading">
      <div>
        <div className="lcc-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function EmptyState({
  title,
  body,
  action,
  onClick,
}: {
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="lcc-empty">
      <div className="lcc-empty-icon">
        <BookOpen size={22} />
      </div>
      <strong>{title}</strong>
      <p>{body}</p>
      <button className="lcc-secondary" onClick={onClick}>
        {action}
      </button>
    </div>
  );
}
function LectureCard({ lecture, onClick }: { lecture: Lecture; onClick: () => void }) {
  const meta = subjectMeta(lecture.subject);
  const Icon = meta.icon;
  return (
    <button className="lcc-continue-card" onClick={onClick}>
      <div className={`lcc-subject-icon ${meta.tone}`}>
        <Icon size={18} />
      </div>
      <div className="lcc-continue-body">
        <span>
          {meta.label} <i>·</i> {lecture.chapter || "Lecture"}
        </span>
        <strong>{lecture.title}</strong>
        <div className="lcc-progress-track">
          <span style={{ width: `${progressPercent(lecture)}%` }} />
        </div>
        <small>
          <Clock3 size={13} /> {lecture.duration_minutes} min{" "}
          <b>{progressPercent(lecture)}% complete</b>
        </small>
      </div>
      <span className="lcc-play-button">
        <Play size={15} fill="currentColor" />
      </span>
    </button>
  );
}
function LectureRow({
  lecture,
  onOpen,
  onStatus,
  onEdit,
  onDelete,
  compact = false,
  showDate = false,
  busy = false,
}: {
  lecture: Lecture;
  onOpen: () => void;
  onStatus: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showDate?: boolean;
  busy?: boolean;
}) {
  const meta = subjectMeta(lecture.subject);
  const Icon = meta.icon;
  return (
    <div className={`lcc-lecture-row ${compact ? "compact" : ""}`}>
      <button
        className={`lcc-status-check ${lecture.status === "COMPLETED" ? "done" : ""}`}
        onClick={onStatus}
        title={lecture.status === "COMPLETED" ? "Mark pending" : "Mark completed"}
        aria-label={lecture.status === "COMPLETED" ? "Mark pending" : "Mark completed"}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="lcc-spinner" size={14} />
        ) : lecture.status === "COMPLETED" ? (
          <Check size={15} />
        ) : lecture.status === "IN_PROGRESS" ? (
          <Play size={12} fill="currentColor" />
        ) : (
          <Circle size={15} />
        )}
      </button>
      <div className={`lcc-subject-icon ${meta.tone}`}>
        <Icon size={17} />
      </div>
      <button className="lcc-row-main" onClick={onOpen}>
        <span>
          {meta.label}
          {lecture.chapter ? ` · ${lecture.chapter}` : ""}
          {lecture.teacher ? ` · ${lecture.teacher}` : ""}
        </span>
        <strong>{lecture.title}</strong>
        <small>
          <Clock3 size={12} /> {lecture.duration_minutes} min{" "}
          {showDate && ` · ${dateLabel(lecture.planned_for)}`}
        </small>
      </button>
      <div className="lcc-row-end">
        <span className={`lcc-status-label ${lecture.status.toLowerCase().replace("_", "-")}`}>
          {statusLabel(lecture.status)}
        </span>
        <span className={`lcc-priority-chip ${lecture.priority}`}>{lecture.priority}</span>
        {!compact && (
          <div className="lcc-row-actions">
            {onEdit && (
              <button onClick={onEdit} aria-label="Edit lecture">
                <PencilLine size={15} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} aria-label="Delete lecture">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
