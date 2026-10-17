import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Check, Clock3, RotateCcw } from "lucide-react";
import { Panel, PrimaryButton, SectionTitle } from "./ui";

type RecallSubject = "physics" | "chemistry" | "mathematics";
type RecallCard = {
  id: string;
  subject: RecallSubject;
  topic: string;
  prompt: string;
  answer: string;
};
type RecallProgress = {
  dueAt: number;
  confidentReviews: number;
  attempts: number;
};

type RecallState = Record<string, RecallProgress>;

const STORAGE_KEY = "jee-prep-hub:spaced-recall:v1";

const SUBJECTS: { id: "all" | RecallSubject; label: string }[] = [
  { id: "all", label: "All" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "mathematics", label: "Maths" },
];

const SUBJECT_STYLES: Record<RecallSubject, string> = {
  physics: "bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200",
  chemistry: "bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200",
  mathematics: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200",
};

const CARDS: RecallCard[] = [
  {
    id: "physics-kinematics",
    subject: "physics",
    topic: "Kinematics",
    prompt:
      "A body starts from rest and accelerates uniformly at a for t seconds. Recall its final speed and displacement.",
    answer: "v = at and s = ½at². With initial speed u: v = u + at and s = ut + ½at².",
  },
  {
    id: "physics-work-energy",
    subject: "physics",
    topic: "Work & Energy",
    prompt: "What does the work–energy theorem say about the net work done on a particle?",
    answer: "Net work equals the change in kinetic energy: Wₙₑₜ = Kᶠ − Kᵢ = ΔK.",
  },
  {
    id: "physics-electric-field",
    subject: "physics",
    topic: "Electrostatics",
    prompt: "What is the magnitude of the electric field due to a point charge q at distance r?",
    answer:
      "E = k|q|/r², where k = 1/(4πε₀). Its direction is away from a positive charge and toward a negative charge.",
  },
  {
    id: "physics-capacitance",
    subject: "physics",
    topic: "Capacitance",
    prompt:
      "Recall the capacitance of a parallel-plate capacitor in vacuum, neglecting edge effects.",
    answer:
      "C = ε₀A/d, where A is the plate area and d is the separation. A dielectric of relative permittivity εᵣ gives C = εᵣε₀A/d.",
  },
  {
    id: "chemistry-ph",
    subject: "chemistry",
    topic: "Ionic Equilibrium",
    prompt: "How is pH defined in terms of hydrogen-ion concentration?",
    answer: "pH = −log₁₀[H⁺], with concentration expressed in mol L⁻¹.",
  },
  {
    id: "chemistry-nernst",
    subject: "chemistry",
    topic: "Electrochemistry",
    prompt: "At 298 K, what is the Nernst equation for a cell reaction involving n electrons?",
    answer:
      "E = E° − (0.0591 V/n) log₁₀Q. Use the reaction quotient Q for the cell reaction as written.",
  },
  {
    id: "chemistry-kp-kc",
    subject: "chemistry",
    topic: "Chemical Equilibrium",
    prompt: "How are Kₚ and K꜀ related for a gaseous equilibrium?",
    answer:
      "Kₚ = K꜀(RT)^Δnᵍ, where Δnᵍ = gaseous product coefficients − gaseous reactant coefficients.",
  },
  {
    id: "chemistry-first-order",
    subject: "chemistry",
    topic: "Chemical Kinetics",
    prompt: "What is the half-life of a first-order reaction?",
    answer: "t₁/₂ = 0.693/k. It is independent of the initial reactant concentration.",
  },
  {
    id: "math-power-rule",
    subject: "mathematics",
    topic: "Differentiation",
    prompt: "State the power rule for differentiating xⁿ.",
    answer: "d(xⁿ)/dx = nxⁿ⁻¹.",
  },
  {
    id: "math-power-integral",
    subject: "mathematics",
    topic: "Integration",
    prompt: "What is ∫xⁿ dx for n ≠ −1?",
    answer: "∫xⁿ dx = xⁿ⁺¹/(n + 1) + C, for n ≠ −1.",
  },
  {
    id: "math-ap-sum",
    subject: "mathematics",
    topic: "Sequences & Series",
    prompt: "Recall the sum of the first n terms of an arithmetic progression.",
    answer:
      "Sₙ = n/2[2a + (n − 1)d] = n(a + l)/2, where a is the first term, d the common difference and l the last term.",
  },
  {
    id: "math-circle",
    subject: "mathematics",
    topic: "Coordinate Geometry",
    prompt: "Write the equation of a circle with centre (h, k) and radius r.",
    answer: "(x − h)² + (y − k)² = r².",
  },
];

function loadProgress(): RecallState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const saved = parsed as Record<string, unknown>;
    const clean: RecallState = {};
    for (const card of CARDS) {
      const entry = saved[card.id];
      if (!entry || typeof entry !== "object") continue;
      const value = entry as Record<string, unknown>;
      const dueAt = value.dueAt;
      const confidentReviews = value.confidentReviews;
      const attempts = value.attempts;
      if (
        typeof dueAt === "number" &&
        Number.isFinite(dueAt) &&
        typeof confidentReviews === "number" &&
        Number.isFinite(confidentReviews) &&
        typeof attempts === "number" &&
        Number.isFinite(attempts)
      ) {
        clean[card.id] = {
          dueAt: Math.max(0, dueAt),
          confidentReviews: Math.max(0, Math.floor(confidentReviews)),
          attempts: Math.max(0, Math.floor(attempts)),
        };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

function formatWait(milliseconds: number) {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default function RecallSprint() {
  const [progress, setProgress] = useState<RecallState>({});
  const [subject, setSubject] = useState<"all" | RecallSubject>("all");
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewEarly, setReviewEarly] = useState(false);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
    setNow(Date.now());
    setReady(true);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const deck = useMemo(
    () => (subject === "all" ? CARDS : CARDS.filter((card) => card.subject === subject)),
    [subject],
  );
  const dueCount = ready
    ? CARDS.filter((card) => (progress[card.id]?.dueAt ?? 0) <= now).length
    : 0;
  const dueCards = deck.filter((card) => (progress[card.id]?.dueAt ?? 0) <= now);
  const nextScheduled = [...deck].sort(
    (a, b) => (progress[a.id]?.dueAt ?? 0) - (progress[b.id]?.dueAt ?? 0),
  )[0];
  const currentCard = dueCards[0] ?? (reviewEarly ? nextScheduled : undefined);

  const rateCard = (confident: boolean) => {
    if (!currentCard) return;
    const previous = progress[currentCard.id] ?? {
      dueAt: 0,
      confidentReviews: 0,
      attempts: 0,
    };
    const confidentReviews = confident ? previous.confidentReviews + 1 : 0;
    const delay = confident
      ? [1, 3, 7][Math.min(previous.confidentReviews, 2)] * 24 * 60 * 60 * 1000
      : 10 * 60 * 1000;
    const next: RecallState = {
      ...progress,
      [currentCard.id]: {
        dueAt: Date.now() + delay,
        confidentReviews,
        attempts: previous.attempts + 1,
      },
    };
    setProgress(next);
    setNow(Date.now());
    setShowAnswer(false);
    setReviewEarly(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The sprint remains usable for this visit if browser storage is unavailable.
    }
  };

  const visibleDueCount = deck.filter((card) => (progress[card.id]?.dueAt ?? 0) <= now).length;
  const nextWait = nextScheduled ? (progress[nextScheduled.id]?.dueAt ?? 0) - now : 0;

  return (
    <Panel>
      <SectionTitle
        eyebrow="STUDY SMARTER"
        title="Spaced Recall Sprint"
        right={
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">
            <Clock3 className="h-3.5 w-3.5" /> {ready ? `${dueCount} due` : "Loading"}
          </span>
        }
      />
      <p className="-mt-2 mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        Recall a formula from memory, then rate your confidence. Missed cards return in 10 minutes;
        confident cards spread out over 1, 3 and 7 days.
      </p>

      <div
        className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1"
        role="group"
        aria-label="Recall subject"
      >
        {SUBJECTS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={subject === item.id}
            onClick={() => {
              setSubject(item.id);
              setReviewEarly(false);
              setShowAnswer(false);
            }}
            className={`min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-bold transition ${
              subject === item.id
                ? "border-sky-600 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
          Loading your saved recall schedule…
        </div>
      ) : currentCard ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0b1427] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${SUBJECT_STYLES[currentCard.subject]}`}
            >
              {currentCard.subject}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {currentCard.topic} ·{" "}
              {visibleDueCount ? `${visibleDueCount} due in this deck` : "early review"}
            </span>
          </div>
          <div className="mt-4 min-h-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {showAnswer ? "Recall answer" : "Try from memory"}
            </p>
            <h3 className="mt-1.5 text-base font-extrabold leading-7 text-slate-900 dark:text-white sm:text-lg">
              {showAnswer ? currentCard.answer : currentCard.prompt}
            </h3>
          </div>
          {!showAnswer ? (
            <PrimaryButton onClick={() => setShowAnswer(true)} className="mt-3 w-full sm:w-auto">
              <BookOpenText className="h-4 w-4" /> Reveal answer
            </PrimaryButton>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <PrimaryButton tone="ghost" onClick={() => rateCard(false)}>
                <RotateCcw className="h-4 w-4" /> Review again · 10 min
              </PrimaryButton>
              <PrimaryButton tone="green" onClick={() => rateCard(true)}>
                <Check className="h-4 w-4" /> Got it · schedule next review
              </PrimaryButton>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06] dark:text-white sm:p-5">
          <p className="text-sm font-extrabold">You’re caught up. Nice work.</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {nextScheduled
              ? `Your next ${subject === "all" ? "recall" : SUBJECTS.find((item) => item.id === subject)?.label} card is due in ${formatWait(nextWait)}.`
              : "There are no cards in this deck yet."}{" "}
            Your schedule is saved on this device.
          </p>
          {nextScheduled && (
            <PrimaryButton
              tone="ghost"
              className="mt-3"
              onClick={() => {
                setReviewEarly(true);
                setShowAnswer(false);
              }}
            >
              Review one early
            </PrimaryButton>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {ready ? `${CARDS.length - dueCount} scheduled for later` : "12 short JEE prompts"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" /> 1 · 3 · 7 day spacing
        </span>
      </div>
    </Panel>
  );
}
