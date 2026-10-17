// src/components/dashboard/pro/ProWidgets.tsx
// Dashboard cards shared by the Pro workspace and the classic dashboard. Uses the site's theme tokens.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Award,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  ListChecks,
  Lock,
  Medal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import {
  STATUSES,
  dayKey,
  fmt12,
  fmtDur,
  minutesBetween,
  statusOf,
  uid,
  useLocalState,
  type Segment,
  type StatusId,
} from "./proLib";

/* ---------- shared style tokens ---------- */

const eyebrowCls = "text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
const inputCls =
  "w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 [color-scheme:light] dark:[color-scheme:dark]";
const addBtnCls =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold text-foreground transition hover:bg-muted";
const primaryBtnCls =
  "rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]";
const ghostBtnCls =
  "rounded-xl border border-border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground";
const panelCls = "rounded-2xl border border-border bg-muted/40 p-3";
const rowCls = "rounded-xl bg-muted/50";
const delBtnCls = "shrink-0 p-1 text-muted-foreground transition hover:text-rose-500";
const dashedCls =
  "rounded-2xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`min-w-0 rounded-[28px] border border-border bg-card p-4 shadow-soft transition-colors sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={eyebrowCls}>{children}</p>;
}

/* ---------- Mood check-in ---------- */

const MOODS = [
  { id: "fired", label: "Fired up", emoji: "🔥" },
  { id: "good", label: "Feeling good", emoji: "😀" },
  { id: "getting", label: "Getting there", emoji: "🙂" },
  { id: "low", label: "Low battery", emoji: "🪫" },
  { id: "breather", label: "Need a breather", emoji: "🌿" },
];

export function MoodBanner({ onStart }: { onStart: (win: string, mood: string) => void }) {
  const [state, setState, ready] = useLocalState<{ done: boolean }>(`jph:pro:mood:${dayKey()}`, { done: false });
  const [mood, setMood] = useState<string | null>(null);
  const [win, setWin] = useState("");

  if (!ready || state.done) return null;

  return (
    <section className="relative rounded-[28px] border border-primary/25 bg-primary/5 p-4 shadow-soft sm:p-5">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setState({ done: true })}
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground">
          🤖
        </span>
        <div className="min-w-0 pr-6">
          <p className="text-lg font-bold">Good to see you 👋 How's the energy today?</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One tap and a line about today. I'll start your timer and build a plan around it.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMood(m.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              mood === m.id
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border bg-card text-foreground/85 hover:bg-muted"
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={win}
          onChange={(e) => setWin(e.target.value)}
          maxLength={120}
          placeholder="One win you'd love today…"
          className={`${inputCls} rounded-full px-4`}
        />
        <button
          type="button"
          onClick={() => {
            onStart(win.trim(), mood ?? "good");
            setState({ done: true });
          }}
          className="shrink-0 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          Let's go 🚀
        </button>
      </div>
    </section>
  );
}

/* ---------- Today's focus + daily goal ---------- */

export function TodayFocus({ seconds, goalMin, onEdit }: { seconds: number; goalMin: number; onEdit: () => void }) {
  const pct = goalMin > 0 ? Math.min(100, Math.round((seconds / 60 / goalMin) * 100)) : 0;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          Today's Focus <Info className="h-4 w-4 opacity-60" />
        </p>
        <button type="button" onClick={onEdit} aria-label="Edit target" className="p-1 text-muted-foreground transition hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-primary">{pct}%</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${Math.max(pct, seconds > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {fmtDur(seconds)} / {fmtDur(goalMin * 60)}
      </p>
    </Card>
  );
}

export function DailyGoal({ seconds, goalMin, onEdit }: { seconds: number; goalMin: number; onEdit: () => void }) {
  const mins = Math.floor(seconds / 60);
  const pct = goalMin > 0 ? Math.min(100, Math.round((mins / goalMin) * 100)) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <Card>
      <button type="button" onClick={onEdit} className="flex w-full items-center gap-4 text-left">
        <div className="relative h-[72px] w-[72px] shrink-0">
          <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
            <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
            <circle
              cx="42"
              cy="42"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (c * pct) / 100}
              className="text-primary transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{pct}%</span>
        </div>
        <div>
          <Eyebrow>Daily goal</Eyebrow>
          <p className="mt-1 text-lg font-bold">
            {mins}/{goalMin} min
          </p>
          <p className="text-xs text-muted-foreground">{Math.max(0, goalMin - mins)} min to goal</p>
        </div>
      </button>
    </Card>
  );
}

/* ---------- Smart summary ---------- */

export type SummaryData = {
  headline: string;
  bullets: { text: string; color: string }[];
  recommendation: string;
};

export function SmartSummary({ data, onRefresh }: { data: SummaryData; onRefresh: () => void }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className={`flex items-center gap-2.5 ${eyebrowCls}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          Smart summary
        </p>
        <button type="button" onClick={onRefresh} aria-label="Refresh" className="p-1.5 text-muted-foreground transition hover:text-foreground">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <h3 className="mt-3 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{data.headline}</h3>
      <ul className="mt-3 space-y-2.5">
        {data.bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm leading-snug">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
            {b.text}
          </li>
        ))}
      </ul>
      <div className={`mt-4 ${panelCls} p-4`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">💡 Recommendation</p>
        <p className="mt-2 text-sm leading-relaxed">{data.recommendation}</p>
      </div>
    </Card>
  );
}

/* ---------- Schedule blocks ---------- */

type Block = { id: string; title: string; start: string; end: string; status: StatusId };

export function ScheduleCard({ onPlay }: { onPlay: (id: StatusId) => void }) {
  const [blocks, setBlocks] = useLocalState<Block[]>(`jph:pro:blocks:${dayKey()}`, []);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [status, setStatus] = useState<StatusId>("deep");

  const sorted = useMemo(() => [...blocks].sort((a, b) => a.start.localeCompare(b.start)), [blocks]);

  const add = () => {
    if (minutesBetween(start, end) <= 0) return;
    const st = statusOf(status);
    setBlocks((b) => [...b, { id: uid(), title: title.trim() || st.label, start, end, status }]);
    setTitle("");
    setOpen(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className={`flex items-center gap-2 ${eyebrowCls}`}>
          🗓 Upcoming schedule <Info className="h-4 w-4 opacity-60" />
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} className={addBtnCls}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {open && (
        <div className={`mt-3 space-y-2 ${panelCls}`}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the block? (e.g. Physics revision)" className={inputCls} maxLength={80} />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusId)} className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={add} className={`flex-1 ${primaryBtnCls}`}>
              Save block
            </button>
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnCls}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {sorted.length === 0 && !open && <p className={dashedCls}>Nothing planned yet. Block out your study time for today.</p>}
        {sorted.map((b) => {
          const st = statusOf(b.status);
          return (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: st.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{b.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmt12(b.start)} – {fmt12(b.end)} · {fmtDur(minutesBetween(b.start, b.end) * 60)} · {st.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPlay(b.status)}
                aria-label="Start this block"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Play className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setBlocks((l) => l.filter((x) => x.id !== b.id))} aria-label="Delete block" className={delBtnCls}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Tasks + Notes ---------- */

export type PlannerTask = { id: string; title: string; status: string; scheduled_date: string };

export function TasksCard({
  tasks,
  onToggle,
  onAdd,
}: {
  tasks: PlannerTask[];
  onToggle: (t: PlannerTask) => void;
  onAdd: (title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const pending = tasks.filter((t) => t.status === "pending");

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListChecks className="h-4 w-4" />
          </span>
          Tasks
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{pending.length} open</span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm font-semibold transition hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>
      {open && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onAdd(text.trim());
            setText("");
            setOpen(false);
          }}
        >
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" maxLength={120} className={inputCls} />
          <button type="submit" className="shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90">
            Add
          </button>
        </form>
      )}
      <div className="mt-3 space-y-1.5">
        {tasks.length === 0 && <p className="py-3 text-sm text-muted-foreground">No tasks for today.</p>}
        {tasks.map((t) => {
          const done = t.status === "completed";
          return (
            <button key={t.id} type="button" onClick={() => onToggle(t)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-muted/60">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"
                }`}
              >
                {done && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className={`min-w-0 flex-1 truncate text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

type Note = { id: string; text: string; at: number };

export function NotesCard() {
  const [notes, setNotes] = useLocalState<Note[]>("jph:pro:notes", []);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm">📝</span>
          Notes <span className="text-xs font-normal text-muted-foreground">{notes.length}</span>
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} className={addBtnCls}>
          <Plus className="h-4 w-4" /> Add note
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={600} placeholder="Jot something down…" className={inputCls} />
          <button
            type="button"
            onClick={() => {
              if (!text.trim()) return;
              setNotes((n) => [{ id: uid(), text: text.trim(), at: Date.now() }, ...n].slice(0, 50));
              setText("");
              setOpen(false);
            }}
            className={`w-full ${primaryBtnCls}`}
          >
            Save note
          </button>
        </div>
      )}
      <div className="mt-3 space-y-2">
        {notes.length === 0 && !open && <p className="py-3 text-sm text-muted-foreground">Quick notes live here.</p>}
        {notes.slice(0, 4).map((n) => (
          <div key={n.id} className={`flex items-start gap-2 px-3 py-2.5 ${rowCls}`}>
            <p className="line-clamp-3 min-w-0 flex-1 whitespace-pre-wrap text-sm">{n.text}</p>
            <button type="button" aria-label="Delete note" onClick={() => setNotes((l) => l.filter((x) => x.id !== n.id))} className={delBtnCls}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Upcoming events + calendar + countdown ---------- */

export type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  kind: "event" | "test";
};
export function useUserEvents() {
  return useLocalState<EventItem[]>("jph:pro:events", []);
}

export function UpcomingCard({
  items,
  onAdd,
  onDelete,
}: {
  items: EventItem[];
  onAdd: (e: Omit<EventItem, "id" | "kind">) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dayKey());
  const [time, setTime] = useState("");

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Eyebrow>Upcoming</Eyebrow>
        <button type="button" onClick={() => setOpen((v) => !v)} className={addBtnCls}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {open && (
        <div className={`mt-3 space-y-2.5 ${panelCls}`}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" className={inputCls} maxLength={80} />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!title.trim() || !date) return;
              onAdd({ title: title.trim(), date, time: time || undefined });
              setTitle("");
              setTime("");
              setOpen(false);
            }}
            className={`w-full ${primaryBtnCls}`}
          >
            Save event
          </button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {items.length === 0 && !open && (
          <button type="button" onClick={() => setOpen(true)} className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition hover:bg-muted/50">
            No upcoming events yet.
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <CalendarPlus className="h-4 w-4" /> Add your first event
            </span>
          </button>
        )}
        {items.slice(0, 5).map((e) => (
          <div key={e.id} className={`flex items-center gap-3 px-3 py-2.5 ${rowCls}`}>
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${e.kind === "test" ? "bg-rose-400" : "bg-primary"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                {e.time ? ` · ${fmt12(e.time)}` : ""}
                {e.kind === "test" ? " · Test" : ""}
              </p>
            </div>
            {e.kind === "event" && (
              <button type="button" aria-label="Delete event" onClick={() => onDelete(e.id)} className={delBtnCls}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CalendarCard({ marks }: { marks: Set<string> }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(y, m - 1, 1))} className="p-1.5 text-muted-foreground transition hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-xl font-bold tracking-wide">
          {cursor.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}{" "}
          <span className="font-normal text-muted-foreground">{y}</span>
        </p>
        <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(y, m + 1, 1))} className="p-1.5 text-muted-foreground transition hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center text-sm">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className={`text-xs font-bold ${i === 6 ? "text-rose-500" : "text-muted-foreground"}`}>
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isToday = key === dayKey(today);
          const isSunday = i % 7 === 6;
          return (
            <span key={i} className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                  isToday ? "bg-foreground font-bold text-background" : isSunday ? "text-rose-500" : "text-foreground"
                }`}
              >
                {d}
              </span>
              <span className={`mt-0.5 h-1 w-1 rounded-full ${marks.has(key) ? "bg-primary" : "bg-transparent"}`} />
            </span>
          );
        })}
      </div>
    </Card>
  );
}

type Countdown = { id: string; title: string; date: string };

export function CountdownCard() {
  const [list, setList] = useLocalState<Countdown[]>("jph:pro:countdowns", []);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const upcoming = [...list]
    .map((c) => ({ ...c, days: Math.ceil((new Date(c.date + "T00:00:00").getTime() - Date.now()) / 86400000) }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days);

  return (
    <section className="min-w-0 rounded-[28px] border border-dashed border-border bg-card p-4 shadow-soft sm:p-5">
      {upcoming.length > 0 && !open ? (
        <div>
          <div className="flex items-center justify-between">
            <Eyebrow>Countdown</Eyebrow>
            <button type="button" onClick={() => setOpen(true)} className={addBtnCls}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {upcoming.slice(0, 3).map((c, i) => (
            <div key={c.id} className="mt-3 flex items-center gap-4">
              <p className={`font-extrabold tabular-nums ${i === 0 ? "text-5xl text-primary" : "text-3xl text-foreground/80"}`}>{c.days}</p>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.days === 1 ? "day" : "days"} left</p>
              </div>
              <button type="button" aria-label="Delete countdown" onClick={() => setList((l) => l.filter((x) => x.id !== c.id))} className={delBtnCls}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : open ? (
        <div className="space-y-2.5">
          <Eyebrow>New countdown</Eyebrow>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="JEE Main, Boards, Mock test…" className={inputCls} maxLength={60} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!title.trim() || !date) return;
                setList((l) => [...l, { id: uid(), title: title.trim(), date }]);
                setTitle("");
                setDate("");
                setOpen(false);
              }}
              className={`flex-1 ${primaryBtnCls}`}
            >
              Save
            </button>
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnCls}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full flex-col items-center gap-2 py-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Plus className="h-5 w-5" />
          </span>
          <span className="font-bold">Add a countdown</span>
          <span className="text-sm text-muted-foreground">Track your exam or any big day. See the days left right here.</span>
        </button>
      )}
    </section>
  );
}

/* ---------- Trophy journey ---------- */

const TROPHIES = [
  { id: "warm", name: "Warming Up", hours: 5, Icon: Sparkles },
  { id: "ten", name: "First Ten", hours: 10, Icon: Medal },
  { id: "q", name: "Quarter Century", hours: 25, Icon: Award },
  { id: "half", name: "Half Century", hours: 50, Icon: Trophy },
  { id: "cent", name: "Century Club", hours: 100, Icon: Trophy },
  { id: "two", name: "Two Hundred", hours: 200, Icon: Trophy },
];

export function TrophyJourney({ totalSeconds }: { totalSeconds: number }) {
  const hours = totalSeconds / 3600;
  const first = Math.max(0, TROPHIES.findIndex((t) => hours < t.hours));
  const [page, setPage] = useState<number | null>(null);
  const p = page ?? Math.floor(first / 2);
  const pages = Math.ceil(TROPHIES.length / 2);
  const items = TROPHIES.slice(p * 2, p * 2 + 2);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className={`flex items-center gap-2 ${eyebrowCls}`}>
          <Trophy className="h-4 w-4 text-primary" /> Trophy journey
        </p>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous" disabled={p === 0} onClick={() => setPage(p - 1)} className="p-1.5 text-muted-foreground disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Next" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="p-1.5 text-muted-foreground disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((t) => {
          const idx = TROPHIES.indexOf(t);
          const earned = hours >= t.hours;
          const inProgress = idx === first && !earned;
          const prev = idx > 0 ? TROPHIES[idx - 1].hours : 0;
          const pct = Math.min(100, Math.round(((hours - prev) / (t.hours - prev)) * 100));
          return (
            <div key={t.id} className="flex flex-col items-center text-center">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                  earned
                    ? "border-primary bg-primary/15 text-primary"
                    : inProgress
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {earned || inProgress ? <t.Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
              </span>
              {inProgress && (
                <div className="mt-2 w-full">
                  <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-300">
                    IN PROGRESS {pct}%
                  </span>
                  <div className="mx-auto mt-1.5 h-1.5 w-4/5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              {earned && <span className="mt-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary">EARNED</span>}
              <p className="mt-2 text-sm font-bold leading-tight">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {inProgress ? `${(t.hours - hours).toFixed(1)}h to go · ${hours.toFixed(1)}h logged` : `${t.hours}h`}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Today's timeline ---------- */

export function TimelineCard({ segments, now }: { segments: Segment[]; now: number }) {
  const d0 = new Date(now);
  d0.setHours(6, 0, 0, 0);
  const startMs = d0.getTime();
  const span = 18 * 3600 * 1000; // 6 AM → midnight
  const pct = (ms: number) => Math.min(100, Math.max(0, ((ms - startMs) / span) * 100));
  const ticks = [
    { l: "6 AM", h: 6 },
    { l: "9 AM", h: 9 },
    { l: "12 PM", h: 12 },
    { l: "3 PM", h: 15 },
    { l: "6 PM", h: 18 },
    { l: "9 PM", h: 21 },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-base font-bold">
          Today's Timeline <Info className="h-4 w-4 text-muted-foreground opacity-60" />
        </p>
      </div>
      <div className="relative mt-4 h-10 overflow-hidden rounded-2xl bg-muted">
        {segments.map((s, i) => {
          const left = pct(s.start);
          const width = Math.max(0.6, pct(s.end) - left);
          return (
            <span key={i} className="absolute inset-y-0 opacity-90" style={{ left: `${left}%`, width: `${width}%`, background: statusOf(s.id).color }} title={statusOf(s.id).label} />
          );
        })}
        <span className="absolute inset-y-0 w-px bg-foreground/60" style={{ left: `${pct(now)}%` }} />
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-muted-foreground">
        {ticks.map((t) => (
          <span key={t.h} className="absolute -translate-x-1/2" style={{ left: `${((t.h - 6) / 18) * 100}%` }}>
            {t.l}
          </span>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Install banner (only when the browser offers installation) ---------- */

export function InstallBanner() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [evt, setEvt] = useState<any>(null);
  const [hidden, setHidden, ready] = useLocalState<boolean>("jph:pro:install-hidden", false);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (!ready || hidden || !evt) return null;

  return (
    <section className="relative rounded-[28px] border border-primary/25 bg-primary/5 p-4 shadow-soft sm:p-5">
      <button type="button" aria-label="Dismiss" onClick={() => setHidden(true)} className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
        <X className="h-4 w-4" />
      </button>
      <p className="text-lg font-bold">Install JEE Prep Hub on your device</p>
      <p className="mt-1 pr-6 text-sm text-muted-foreground">
        Get a home-screen icon, full-screen focus mode and faster access. No app store needed.
      </p>
      <button
        type="button"
        onClick={async () => {
          await evt.prompt();
          setEvt(null);
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
      >
        <Download className="h-4 w-4" /> Install app
      </button>
    </section>
  );
}
