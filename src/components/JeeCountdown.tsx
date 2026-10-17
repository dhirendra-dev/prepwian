import { useEffect, useState } from "react";
import { Clock, Rocket, ChevronRight } from "lucide-react";

type ExamTarget = {
  key: string;
  label: string;
  tag: string;
  date: Date;
  note: string;
  accent: string;
};

const EXAMS: ExamTarget[] = [
  {
    key: "jee",
    label: "JEE 2028",
    tag: "Engineering",
    date: new Date("2028-01-22T09:00:00+05:30"),
    note: "Target: 22 Jan 2028, 9:00 AM IST",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    key: "neet",
    label: "NEET 2028",
    tag: "Medical",
    date: new Date("2028-05-07T14:00:00+05:30"),
    note: "Target: 7 May 2028, 2:00 PM IST",
    accent: "from-emerald-400 to-teal-300",
  },
  {
    key: "cbse12",
    label: "CBSE Boards 2028",
    tag: "Boards",
    date: new Date("2028-02-15T10:30:00+05:30"),
    note: "Target: 15 Feb 2028, 10:30 AM IST",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    key: "cbse11",
    label: "Class 11 School Exam",
    tag: "School",
    date: new Date("2027-02-15T10:30:00+05:30"),
    note: "Target: 15 Feb 2027, 10:30 AM IST",
    accent: "from-amber-400 to-orange-300",
  },
];

function diff(target: number) {
  const now = Date.now();
  let ms = Math.max(0, target - now);
  const days = Math.floor(ms / 86_400_000); ms -= days * 86_400_000;
  const hours = Math.floor(ms / 3_600_000); ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000); ms -= minutes * 60_000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds };
}

const ZERO = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function JeeCountdown() {
  const [active, setActive] = useState<string>(EXAMS[0].key);
  const [t, setT] = useState(ZERO);

  const exam = EXAMS.find((e) => e.key === active) ?? EXAMS[0];

  useEffect(() => {
    const target = exam.date.getTime();
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [exam.date]);

  const cells = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Minutes", value: t.minutes },
    { label: "Seconds", value: t.seconds },
  ];

  return (
    <div className="dc-card group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 p-5 shadow-soft backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-6">
      {/* Liquid gradient orbs */}
      <span className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/25 blur-3xl transition-all duration-1000 group-hover:bg-blue-400/30 dark:bg-blue-500/20" />
      <span className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full bg-cyan-300/25 blur-3xl transition-all duration-1000 group-hover:bg-cyan-300/30 dark:bg-cyan-500/20" />
      <span className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-violet-400/15 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Mission Clock</p>
              <p className="text-liquid font-display text-sm font-bold">{exam.tag} Countdown</p>
            </div>
          </div>
          <span className="rounded-full border border-white/20 bg-white/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur dark:bg-white/5">
            T-minus
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMS.map((e) => {
            const isActive = e.key === active;
            return (
              <button
                key={e.key}
                type="button"
                onClick={() => setActive(e.key)}
                className={
                  "relative overflow-hidden rounded-full border px-3 py-1.5 text-xs font-semibold transition-all " +
                  (isActive
                    ? "border-transparent bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md shadow-blue-500/20"
                    : "border-white/25 bg-white/40 text-foreground/80 backdrop-blur hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10")
                }
                aria-pressed={isActive}
              >
                {e.label}
              </button>
            );
          })}
        </div>

        <h2 className="mt-3 bg-gradient-to-r from-foreground via-blue-600 to-cyan-500 bg-clip-text font-display text-2xl font-bold leading-tight text-transparent dark:from-white dark:via-blue-300 dark:to-cyan-200 sm:text-3xl">
          {exam.label}
        </h2>

        <div className="relative mt-5 grid grid-cols-4 gap-2 sm:gap-3">
          {cells.map((c) => (
            <div
              key={c.label}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 px-1 py-3 text-center backdrop-blur-sm transition hover:bg-white/50 dark:bg-white/5 sm:px-2"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 dark:from-white/5" />
              <div className="relative font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                {String(c.value).padStart(2, "0")}
              </div>
              <div className="relative mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(0, (t.days / 365) * 100))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            <span>{exam.note}</span>
            <span>{Math.round(Math.min(100, (t.days / 365) * 100))}% prep window left</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EngineeringCountdown({
  target = "2027-01-24T09:00:00+05:30",
  label = "JEE Main 2027",
  className = "",
}: {
  target?: string;
  label?: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const parts = (() => {
    const ms = Math.max(0, new Date(target).getTime() - now);
    const total = Math.floor(ms / 1000);
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
      ms,
    };
  })();

  const yearMs = 1000 * 60 * 60 * 24 * 365;
  const progress = Math.min(1, Math.max(0, 1 - parts.ms / (yearMs * 1.5)));
  const daysLeft = Math.max(0, Math.ceil(parts.ms / 86_400_000));

  return (
    <div className={`dc-card group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 p-5 shadow-soft backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-6 ${className}`}>
      {/* Liquid gradient orbs */}
      <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-400/25 blur-3xl transition-all duration-1000 group-hover:bg-violet-400/30 dark:bg-violet-500/20" />
      <span className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-fuchsia-300/25 blur-3xl transition-all duration-1000 group-hover:bg-fuchsia-300/30 dark:bg-fuchsia-500/20" />
      <span className="pointer-events-none absolute right-1/4 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-emerald-300/15 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white shadow-lg shadow-violet-500/20">
              <Rocket className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Mission Clock</p>
              <p className="text-liquid font-display text-sm font-bold">{label}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/20 bg-white/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur dark:bg-white/5">
            T-minus
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
          <Cell value={parts.days} unit="days" />
          <Cell value={parts.hours} unit="hrs" pad />
          <Cell value={parts.minutes} unit="min" pad />
          <Cell value={parts.seconds} unit="sec" pad pulse />
        </div>

        <div className="relative mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400 transition-[width] duration-700"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            <span>prep window</span>
            <span>{Math.round(progress * 100)}% elapsed</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/20 bg-white/40 px-3 py-2.5 backdrop-blur dark:bg-white/5">
          <span className="text-xs text-muted-foreground">Days left until exam</span>
          <span className="flex items-center gap-1 font-display text-sm font-bold">
            <ChevronRight className="h-3.5 w-3.5 text-violet-500" />
            {daysLeft}
          </span>
        </div>
      </div>
    </div>
  );
}

function Cell({ value, unit, pad, pulse }: { value: number; unit: string; pad?: boolean; pulse?: boolean }) {
  const text = pad ? String(value).padStart(2, "0") : String(value);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 px-1 py-3 text-center backdrop-blur-sm transition hover:bg-white/50 dark:bg-white/5 sm:px-2">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 dark:from-white/5" />
      <div
        key={text}
        className={`relative font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl ${pulse ? "motion-safe:animate-pulse" : ""}`}
      >
        {text}
      </div>
      <div className="relative mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">{unit}</div>
    </div>
  );
}
