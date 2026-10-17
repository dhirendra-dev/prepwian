import { useEffect, useMemo, useState } from "react";

/**
 * Futuristic liquid-glass exam countdown HUD.
 *
 * Front: frosted glass panel with an animated progress ring, gradient
 * monospace digits and exam selector chips. Tap to flip to the back:
 * a motivational "signal" panel, plus (admin only) exact-date controls.
 *
 * Purely presentational — colours come from theme tokens so it adapts to
 * light and dark mode automatically.
 */

type ExamKey = "JEE" | "NEET" | "CBSE" | "C11";

const EXAM_LABELS: Record<ExamKey, string> = {
  JEE: "JEE 2028",
  NEET: "NEET 2028",
  CBSE: "CBSE Class 12",
  C11: "Class 11",
};

const EXAM_TAB_LABELS: Record<ExamKey, string> = {
  JEE: "JEE",
  NEET: "NEET",
  CBSE: "CBSE 12",
  C11: "Class 11",
};

const SUBTITLES: Record<ExamKey, string> = {
  JEE: "Every question you solve today is one less on exam day.",
  NEET: "Consistency now becomes your rank later.",
  CBSE: "Boards set the tone for everything after.",
  C11: "Strong fundamentals today, easier JEE/NEET tomorrow.",
};

const DEFAULT_TARGETS: Record<ExamKey, string> = {
  JEE: "2028-01-22T09:00:00+05:30",
  NEET: "2028-05-03T14:00:00+05:30",
  CBSE: "2028-02-15T10:30:00+05:30",
  C11: "2027-03-01T10:00:00+05:30",
};

const QUOTES: readonly (readonly [string, string, string])[] = [
  ["Discipline is the bridge between where you are and where the ", "rank card", " says you'll be."],
  ["Every solved PYQ is one fewer ", "surprise", " on exam day."],
  ["You don't rise to the exam. You fall to the level of your ", "revision", "."],
  ["Slow and correct beats fast and ", "careless", "."],
  ["The syllabus doesn't care how tired you feel. ", "Show up anyway.", ""],
  ["Mistakes in a mock are cheaper than mistakes on the ", "real day.", ""],
  ["A rank is the sum of a thousand ", "ordinary", " study hours."],
  ["Consistency is the only formula with ", "no exceptions.", ""],
  ["The version of you six months ahead is built by ", "today's timetable.", ""],
  ["Hard problems are just easy problems wearing a ", "disguise.", ""],
];

function formatTarget(d: Date) {
  return d
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .replace(",", " ·");
}

function toDateInputValue(d: Date) {
  return d.toISOString().split("T")[0]!;
}
function toTimeInputValue(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export default function ExamCountdown({ isAdmin = false }: { isAdmin?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const [currentExam, setCurrentExam] = useState<ExamKey>("JEE");
  const [targets, setTargets] = useState<Record<ExamKey, Date>>(() => {
    const t = {} as Record<ExamKey, Date>;
    (Object.keys(DEFAULT_TARGETS) as ExamKey[]).forEach((k) => {
      t[k] = new Date(DEFAULT_TARGETS[k]);
    });
    return t;
  });
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  // `now` stays null until after hydration so SSR and client markup match.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = targets[currentExam];
  const ready = now !== null;
  const diff = ready ? Math.max(0, target.getTime() - now) : 0;
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  // Ring shows how far into the current prep window we are (2-year window).
  const progress = useMemo(() => {
    if (!ready) return 0;
    const windowMs = 730 * 86400000;
    return Math.min(1, Math.max(0, 1 - diff / windowMs));
  }, [diff, ready]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  function openSettings() {
    setDateInput(toDateInputValue(targets[currentExam]));
    setTimeInput(toTimeInputValue(targets[currentExam]));
    setSavedNote(false);
    setSettingsOpen(true);
  }

  function saveDate() {
    if (!dateInput) return;
    const time = timeInput || "09:00";
    const newDate = new Date(`${dateInput}T${time}:00+05:30`);
    if (isNaN(newDate.getTime())) return;
    setTargets((prev) => ({ ...prev, [currentExam]: newDate }));
    setSavedNote(true);
  }

  const quote = QUOTES[quoteIdx]!;

  const cells: { v: string; l: string; pulse?: boolean }[] = [
    { v: ready ? String(days).padStart(3, "0") : "---", l: "days" },
    { v: ready ? String(hrs).padStart(2, "0") : "--", l: "hrs" },
    { v: ready ? String(mins).padStart(2, "0") : "--", l: "min" },
    { v: ready ? String(secs).padStart(2, "0") : "--", l: "sec", pulse: true },
  ];

  return (
    <div className="xc-scene">
      <div
        className={`xc-card ${flipped ? "xc-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f);
        }}
        aria-label="Exam countdown — activate to flip"
      >
        {/* ── FRONT ─────────────────────────────────────────── */}
        <div className="xc-face xc-front">
          <span className="xc-orb xc-orb-a" />
          <span className="xc-orb xc-orb-b" />
          <span className="xc-sheen" />

          <div className="xc-head">
            <div className="xc-badge">
              <span className="xc-dot" /> mission clock
            </div>
            <span className="xc-tminus">T-minus</span>
          </div>

          <div className="xc-tabs">
            {(Object.keys(EXAM_TAB_LABELS) as ExamKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`xc-tab ${currentExam === key ? "xc-active" : ""}`}
                aria-pressed={currentExam === key}
                onClick={(e) => {
                  stop(e);
                  setCurrentExam(key);
                }}
              >
                {EXAM_TAB_LABELS[key]}
              </button>
            ))}
          </div>

          <h2 className="xc-title">{EXAM_LABELS[currentExam]}</h2>
          <p className="xc-sub">{SUBTITLES[currentExam]}</p>

          <div className="xc-ringwrap">
            <div
              className="xc-ring"
              style={{ ["--p" as string]: `${(progress * 360).toFixed(1)}deg` }}
            >
              <div className="xc-ringinner">
                <span className="xc-bigdays">{ready ? days : "—"}</span>
                <span className="xc-bigdaysl">days left</span>
              </div>
            </div>
          </div>

          <div className="xc-grid">
            {cells.map((c) => (
              <div className="xc-cell" key={c.l}>
                <span className={`xc-num ${c.pulse ? "xc-pulse" : ""}`} key={c.v}>
                  {c.v}
                </span>
                <span className="xc-unit">{c.l}</span>
              </div>
            ))}
          </div>

          <div className="xc-track">
            <span className="xc-fill" style={{ width: `${progress * 100}%` }} />
          </div>

          <div className="xc-foot">
            <div className="xc-target">
              <span>target</span>
              <b>{formatTarget(target)}</b>
            </div>
            <span className="xc-hint">↻ tap</span>
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────── */}
        <div className="xc-face xc-back">
          <span className="xc-orb xc-orb-b" />
          <span className="xc-sheen" />

          <div className="xc-head">
            <div className="xc-badge">
              <span className="xc-dot" /> signal
            </div>
            {isAdmin && (
              <button
                type="button"
                className="xc-gear"
                onClick={(e) => {
                  stop(e);
                  openSettings();
                }}
                title="Set exact exam date"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
          </div>

          <p className="xc-quote">
            {quote[0]}
            <span className="xc-mark">{quote[1]}</span>
            {quote[2]}
          </p>

          <div className="xc-foot">
            <span className="xc-page">{String(quoteIdx + 1).padStart(2, "0")} / {QUOTES.length}</span>
            <button
              type="button"
              className="xc-next"
              onClick={(e) => {
                stop(e);
                setQuoteIdx((i) => (i + 1) % QUOTES.length);
              }}
            >
              Next →
            </button>
          </div>

          {isAdmin && settingsOpen && (
            <div className="xc-panel" onClick={stop}>
              <div className="xc-ptitle">Set the real exam date</div>
              <div className="xc-psub">Editing {EXAM_LABELS[currentExam]}</div>
              <div className="xc-prow">
                <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
                <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />
              </div>
              <div className="xc-pactions">
                <button type="button" className="xc-save" onClick={saveDate}>Save</button>
                <button type="button" className="xc-cancel" onClick={() => setSettingsOpen(false)}>Cancel</button>
              </div>
              {savedNote && <div className="xc-saved">✓ Updated — flip back to see it live</div>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .xc-scene{ width:100%; max-width:420px; margin:0 auto; perspective:1600px;
          --c1: var(--primary); --c2: var(--accent); }
        .xc-card{ position:relative; width:100%; min-height:540px; transform-style:preserve-3d;
          transition:transform .8s cubic-bezier(.2,.9,.2,1); cursor:pointer; outline:none; }
        @media (max-width:400px){ .xc-card{ min-height:568px; } }
        .xc-flipped{ transform:rotateY(180deg); }
        .xc-face{ position:absolute; inset:0; backface-visibility:hidden; border-radius:28px;
          padding:18px 18px 20px; overflow:hidden; isolation:isolate;
          background:
            linear-gradient(150deg, color-mix(in oklab, var(--card) 72%, transparent),
                                     color-mix(in oklab, var(--card) 40%, transparent));
          border:1px solid color-mix(in oklab, var(--foreground) 12%, transparent);
          box-shadow:0 24px 60px -26px color-mix(in oklab, var(--c1) 55%, transparent),
                     inset 0 1px 0 color-mix(in oklab, #fff 45%, transparent);
          backdrop-filter:blur(22px) saturate(160%);
          -webkit-backdrop-filter:blur(22px) saturate(160%);
          display:flex; flex-direction:column; }
        .xc-back{ transform:rotateY(180deg); }
        .xc-orb{ position:absolute; border-radius:999px; filter:blur(42px); pointer-events:none; z-index:-1;
          animation:xc-drift 14s ease-in-out infinite alternate; }
        .xc-orb-a{ width:230px; height:230px; right:-70px; top:-90px;
          background:color-mix(in oklab, var(--c1) 55%, transparent); }
        .xc-orb-b{ width:200px; height:200px; left:-70px; bottom:-70px;
          background:color-mix(in oklab, var(--c2) 55%, transparent); animation-delay:-6s; }
        @keyframes xc-drift{ from{ transform:translate3d(0,0,0) scale(1);} to{ transform:translate3d(14px,-18px,0) scale(1.14);} }
        .xc-sheen{ position:absolute; inset:0; pointer-events:none; z-index:-1;
          background:linear-gradient(115deg, transparent 32%, color-mix(in oklab,#fff 32%, transparent) 48%, transparent 62%);
          transform:translateX(-40%); animation:xc-sheen 7s ease-in-out infinite; }
        @keyframes xc-sheen{ 0%,72%{ transform:translateX(-60%);} 100%{ transform:translateX(60%);} }

        .xc-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .xc-badge{ display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:800;
          letter-spacing:.22em; text-transform:uppercase; color:var(--muted-foreground); }
        .xc-dot{ width:6px; height:6px; border-radius:999px; background:var(--c2);
          box-shadow:0 0 0 4px color-mix(in oklab, var(--c2) 28%, transparent); animation:xc-blink 1.8s ease-in-out infinite; }
        @keyframes xc-blink{ 50%{ opacity:.35; } }
        .xc-tminus{ font-family:ui-monospace,'JetBrains Mono',monospace; font-size:10px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--muted-foreground);
          border:1px solid color-mix(in oklab, var(--foreground) 14%, transparent);
          border-radius:999px; padding:3px 9px; }

        .xc-tabs{ display:flex; gap:6px; margin-top:14px; flex-wrap:wrap; }
        .xc-tab{ font-size:11.5px; font-weight:700; padding:6px 12px; border-radius:999px; cursor:pointer;
          color:var(--muted-foreground); background:color-mix(in oklab, var(--foreground) 6%, transparent);
          border:1px solid color-mix(in oklab, var(--foreground) 10%, transparent);
          transition:transform .18s ease, background .2s ease, color .2s ease; }
        .xc-tab:hover{ transform:translateY(-1px); }
        .xc-tab.xc-active{ color:var(--primary-foreground);
          background:linear-gradient(120deg, var(--c1), var(--c2));
          border-color:transparent; box-shadow:0 6px 16px -8px color-mix(in oklab, var(--c1) 80%, transparent); }

        .xc-title{ margin:14px 0 2px; font-size:26px; font-weight:800; line-height:1.1;
          background:linear-gradient(100deg, var(--c1), var(--c2), var(--c1));
          background-size:220% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
          animation:xc-flow 7s ease-in-out infinite; }
        @keyframes xc-flow{ 0%,100%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } }
        .xc-sub{ margin:0; font-size:12.5px; color:var(--muted-foreground); }

        .xc-ringwrap{ display:flex; justify-content:center; margin:16px 0 4px; }
        .xc-ring{ width:150px; height:150px; border-radius:999px; display:grid; place-items:center;
          background:conic-gradient(var(--c2) var(--p,0deg), color-mix(in oklab, var(--foreground) 10%, transparent) 0);
          transition:background .8s linear;
          box-shadow:0 0 34px -10px color-mix(in oklab, var(--c2) 70%, transparent); }
        .xc-ringinner{ width:122px; height:122px; border-radius:999px; display:grid; place-items:center; gap:0;
          background:color-mix(in oklab, var(--card) 82%, transparent);
          border:1px solid color-mix(in oklab, var(--foreground) 10%, transparent);
          backdrop-filter:blur(8px); }
        .xc-bigdays{ font-family:ui-monospace,'JetBrains Mono',monospace; font-size:34px; font-weight:800;
          font-variant-numeric:tabular-nums; line-height:1; color:var(--foreground); }
        .xc-bigdaysl{ font-size:9.5px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
          color:var(--muted-foreground); margin-top:5px; }

        .xc-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-top:14px; }
        .xc-cell{ text-align:center; padding:10px 2px 8px; border-radius:16px;
          background:color-mix(in oklab, var(--card) 55%, transparent);
          border:1px solid color-mix(in oklab, var(--foreground) 10%, transparent);
          box-shadow:inset 0 1px 0 color-mix(in oklab,#fff 35%, transparent); }
        .xc-num{ display:block; font-family:ui-monospace,'JetBrains Mono',monospace; font-weight:800;
          font-size:clamp(16px,5.2vw,21px); font-variant-numeric:tabular-nums; color:var(--foreground); }
        .xc-pulse{ animation:xc-pop .45s cubic-bezier(.2,.9,.2,1); }
        @keyframes xc-pop{ from{ transform:scale(.86); opacity:.55; } to{ transform:scale(1); opacity:1; } }
        .xc-unit{ display:block; margin-top:3px; font-size:8.5px; font-weight:700; letter-spacing:.18em;
          text-transform:uppercase; color:var(--muted-foreground); }

        .xc-track{ margin-top:14px; height:6px; border-radius:999px; overflow:hidden;
          background:color-mix(in oklab, var(--foreground) 10%, transparent); }
        .xc-fill{ display:block; height:100%; border-radius:999px;
          background:linear-gradient(90deg, var(--c1), var(--c2), var(--c1));
          background-size:200% 100%; animation:xc-flow 5s ease-in-out infinite;
          transition:width .8s ease; }

        .xc-foot{ margin-top:auto; padding-top:14px; display:flex; align-items:flex-end;
          justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .xc-target{ min-width:0; }
        .xc-target span{ display:block; font-size:9.5px; font-weight:700; letter-spacing:.2em;
          text-transform:uppercase; color:var(--muted-foreground); }
        .xc-target b{ display:block; font-size:12.5px; line-height:1.35; color:var(--foreground); }
        .xc-hint{ font-size:10px; white-space:nowrap; color:var(--muted-foreground); }

        .xc-quote{ margin:22px 0 0; font-size:20px; line-height:1.5; font-weight:600; color:var(--foreground); }
        .xc-mark{ background:linear-gradient(120deg, var(--c1), var(--c2)); -webkit-background-clip:text;
          background-clip:text; color:transparent; }
        .xc-page{ font-family:ui-monospace,'JetBrains Mono',monospace; font-size:10.5px; color:var(--muted-foreground); }
        .xc-next{ font-size:11.5px; font-weight:800; padding:8px 15px; border-radius:999px; cursor:pointer;
          color:var(--primary-foreground); border:none;
          background:linear-gradient(120deg, var(--c1), var(--c2));
          box-shadow:0 8px 20px -10px color-mix(in oklab, var(--c1) 85%, transparent); }
        .xc-gear{ width:30px; height:30px; border-radius:999px; display:grid; place-items:center; cursor:pointer;
          color:var(--c1); background:color-mix(in oklab, var(--card) 70%, transparent);
          border:1px solid color-mix(in oklab, var(--foreground) 12%, transparent); }
        .xc-gear svg{ width:15px; height:15px; }

        .xc-panel{ margin-top:16px; padding:14px; border-radius:18px;
          background:color-mix(in oklab, var(--card) 78%, transparent);
          border:1px solid color-mix(in oklab, var(--foreground) 12%, transparent); }
        .xc-ptitle{ font-size:12.5px; font-weight:800; color:var(--foreground); }
        .xc-psub{ font-size:11px; color:var(--muted-foreground); margin-bottom:10px; }
        .xc-prow{ display:flex; gap:8px; margin-bottom:10px; }
        .xc-prow input{ flex:1; min-width:0; font-size:13px; padding:8px 9px; border-radius:10px;
          color:var(--foreground); background:color-mix(in oklab, var(--foreground) 5%, transparent);
          border:1px solid color-mix(in oklab, var(--foreground) 14%, transparent); }
        .xc-pactions{ display:flex; gap:10px; align-items:center; }
        .xc-save{ font-size:11.5px; font-weight:800; padding:8px 14px; border-radius:10px; border:none;
          cursor:pointer; color:var(--primary-foreground); background:linear-gradient(120deg, var(--c1), var(--c2)); }
        .xc-cancel{ font-size:11.5px; color:var(--muted-foreground); background:none; border:none;
          cursor:pointer; text-decoration:underline; }
        .xc-saved{ margin-top:9px; font-size:11px; font-weight:700; color:var(--c2); }

        @media (prefers-reduced-motion: reduce){
          .xc-orb, .xc-sheen, .xc-title, .xc-fill, .xc-dot, .xc-pulse{ animation:none !important; }
          .xc-card{ transition:none; }
        }
      `}</style>
    </div>
  );
}
