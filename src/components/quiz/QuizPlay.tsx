import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Flag, Grid3X3, Timer, X } from "lucide-react";
import { MathText } from "@/components/MathText";
import type { QuizQuestion } from "@/lib/quiz.functions";
import { Portal, PrimaryButton, Sheet } from "./ui";
import { formatTime } from "./quiz-utils";

type Props = {
  mode: "daily" | "battle";
  questions: QuizQuestion[];
  idx: number;
  onIdx: (n: number) => void;
  answers: Record<string, string | null>;
  onAnswer: (questionId: string, optionId: string) => void;
  seconds: number;
  submitting: boolean;
  onExit: () => void;
  onSubmit: () => void;
};

export default function QuizPlay({
  mode,
  questions,
  idx,
  onIdx,
  answers,
  onAnswer,
  seconds,
  submitting,
  onExit,
  onSubmit,
}: Props) {
  const q = questions[idx];
  const total = questions.length;
  const mainRef = useRef<HTMLElement | null>(null);
  const [sheet, setSheet] = useState<null | "nav" | "exit" | "finish">(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const answered = questions.filter((x) => answers[x.id]).length;
  const unanswered = total - answered;
  const isLast = idx >= total - 1;

  // lock page scroll while playing
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [idx]);

  const go = (n: number) => onIdx(Math.max(0, Math.min(total - 1, n)));
  const next = () => {
    if (!isLast) return go(idx + 1);
    if (unanswered > 0) return setSheet("finish");
    onSubmit();
  };

  // keyboard: arrows to move, A–D / 1–4 to answer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || zoom || e.ctrlKey || e.metaKey || e.altKey || !q) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright") next();
      else if (k === "arrowleft") go(idx - 1);
      else {
        const n = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
        if (n >= 0 && q.options[n]) onAnswer(q.id, q.options[n].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!q) return null;

  return (
    <Portal>
      <div
        className="quiz-theme quiz-play-overlay fixed inset-0 z-[2147483000] isolate flex flex-col bg-background text-foreground"
        style={{ height: "100dvh" }}
      >
        {/* Header */}
        <header className="shrink-0 border-b border-slate-200 bg-white px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-sm dark:border-white/10 dark:bg-[#0c1425]">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <button
              onClick={() => setSheet("exit")}
              aria-label="Exit"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900/[0.045] active:bg-slate-900/10 dark:bg-slate-800 dark:active:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
                {mode === "daily" ? "Daily challenge" : "Practice battle"}
              </p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Question {idx + 1} of {total}
              </p>
            </div>
            <div className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-900/[0.045] px-3 font-mono text-xs font-bold dark:bg-slate-800">
              <Timer className="h-4 w-4 text-amber-700 dark:text-amber-200" /> {formatTime(seconds)}
            </div>
            <button
              onClick={() => setSheet("nav")}
              aria-label="Question list"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900/[0.045] active:bg-slate-900/10 dark:bg-slate-800 dark:active:bg-slate-700"
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-auto mt-3 flex max-w-2xl gap-1">
            {questions.map((x, i) => (
              <button
                key={x.id}
                aria-label={`Go to question ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 flex-1 rounded-full ${i === idx ? "bg-amber-500 dark:bg-amber-300" : answers[x.id] ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"}`}
              />
            ))}
          </div>
        </header>

        {/* Scrollable question area */}
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">
                {q.subject ?? "Mixed"}
              </span>
              {q.chapter && (
                <span className="rounded-full bg-slate-900/[0.045] px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {q.chapter}
                </span>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-[0_12px_30px_rgba(30,64,120,0.08)] sm:p-6 dark:border-white/[0.09] dark:from-[#121d32] dark:to-[#0f1728] dark:shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <div className="text-[16px] leading-8 sm:text-lg">
                <MathText text={q.question_text} />
              </div>
              {q.image_url && (
                <img
                  src={q.image_url}
                  alt="Question diagram"
                  loading="lazy"
                  onClick={() => setZoom(q.image_url)}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  className="mt-4 max-h-72 w-full cursor-zoom-in rounded-2xl bg-white object-contain"
                />
              )}
            </div>

            <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Answer options">
              {q.options.map((o) => {
                const sel = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => onAnswer(q.id, o.id)}
                    className={`flex min-h-[3.75rem] w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.985] ${
                      sel
                        ? "border-amber-500 bg-amber-50 shadow-[0_0_0_1px_rgba(252,211,77,0.18),0_8px_24px_rgba(30,64,120,0.08)] dark:border-amber-300/80 dark:bg-[#29243a] dark:shadow-[0_0_0_1px_rgba(252,211,77,0.12),0_12px_32px_rgba(0,0,0,0.18)]"
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 dark:border-white/[0.09] dark:bg-[#10182a] dark:hover:border-white/20 dark:hover:bg-[#141f34]"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${sel ? "bg-amber-400 text-amber-950 dark:bg-amber-300 dark:text-[#17120a]" : "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200"}`}
                    >
                      {sel ? <Check className="h-5 w-5" /> : o.label}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] leading-6">
                      <MathText text={o.text} />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-6" />
          </div>
        </main>

        {/* Pinned action bar */}
        <footer className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_18px_rgba(30,64,120,0.06)] dark:border-white/10 dark:bg-[#0c1425] dark:shadow-none">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <button
              onClick={() => go(idx - 1)}
              disabled={idx === 0}
              className="inline-flex min-h-12 w-28 shrink-0 items-center justify-center gap-1 rounded-2xl bg-slate-900/[0.045] text-sm font-bold text-slate-800 disabled:opacity-35 active:bg-slate-900/10 dark:bg-slate-800 dark:text-white dark:active:bg-slate-700"
            >
              <ChevronLeft className="h-5 w-5" /> Prev
            </button>
            <PrimaryButton
              onClick={next}
              disabled={submitting}
              tone={isLast ? "green" : "blue"}
              className="flex-1 text-base"
            >
              {submitting ? (
                "Scoring…"
              ) : isLast ? (
                <>
                  Finish <Flag className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="h-5 w-5" />
                </>
              )}
            </PrimaryButton>
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-slate-600 dark:text-slate-400">
            {answered}/{total} answered
          </p>
        </footer>

        {/* Question list */}
        <Sheet open={sheet === "nav"} onClose={() => setSheet(null)} title="Jump to question">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => {
                  go(i);
                  setSheet(null);
                }}
                className={`aspect-square rounded-xl text-sm font-black ${
                  i === idx
                    ? "bg-slate-900 text-white dark:bg-white dark:text-[#0B1020]"
                    : answers[x.id]
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-3 w-3 rounded bg-sky-500" /> Answered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-3 w-3 rounded bg-slate-300 dark:bg-slate-700" /> Not answered
            </span>
          </div>
        </Sheet>

        {/* Exit confirm */}
        <Sheet open={sheet === "exit"} onClose={() => setSheet(null)} title="Leave this run?">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your answers for this run will be lost and no XP will be awarded.
          </p>
          <div className="mt-4 grid gap-2">
            <PrimaryButton onClick={() => setSheet(null)}>Keep playing</PrimaryButton>
            <PrimaryButton tone="danger" onClick={onExit}>
              Leave run
            </PrimaryButton>
          </div>
        </Sheet>

        {/* Finish confirm */}
        <Sheet
          open={sheet === "finish"}
          onClose={() => setSheet(null)}
          title="Finish with unanswered questions?"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You have <b className="text-slate-900 dark:text-white">{unanswered}</b> unanswered
            question
            {unanswered > 1 ? "s" : ""}. They will count as incorrect.
          </p>
          <div className="mt-4 grid gap-2">
            <PrimaryButton
              onClick={() => {
                setSheet(null);
                const first = questions.findIndex((x) => !answers[x.id]);
                if (first >= 0) go(first);
              }}
            >
              Review unanswered
            </PrimaryButton>
            <PrimaryButton
              tone="green"
              onClick={() => {
                setSheet(null);
                onSubmit();
              }}
            >
              Submit anyway
            </PrimaryButton>
          </div>
        </Sheet>

        {zoom && (
          <Portal>
            <div
              className="quiz-theme fixed inset-0 z-[2147483002] grid place-items-center bg-black p-3"
              onClick={() => setZoom(null)}
            >
              <button
                aria-label="Close image"
                className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] rounded-full bg-white/15 p-2"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={zoom}
                alt=""
                className="max-h-full max-w-full rounded-xl bg-white object-contain"
              />
            </div>
          </Portal>
        )}
      </div>
    </Portal>
  );
}
