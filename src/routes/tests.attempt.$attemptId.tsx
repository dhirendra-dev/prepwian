import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAttemptForPlayer, saveResponse, submitAttempt, recordAntiCheat } from "@/lib/tests.functions";
import { LazyMathText } from "@/components/LazyMathText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, Clock, ChevronLeft, ChevronRight, Flag, LayoutGrid, X, Calculator, WifiOff, Check, Eraser } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Modal, PaletteContent, PlayerImage, Portal, Stat, type ImgRef, type PaletteGroup, type Status } from "@/components/test-player/PlayerParts";

const CalculatorPanel = lazy(() =>
  import("@/components/test-player/CalculatorPanel").then((module) => ({
    default: module.CalculatorPanel,
  })),
);

export const Route = createFileRoute("/tests/attempt/$attemptId")({
  head: () => ({
    meta: [
      { property: "og:title", content: "CBT Test — In Progress | JEE Prep Hub" },
      { property: "og:description", content: "Live JEE CBT attempt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "CBT Test — In Progress | JEE Prep Hub" },
      { name: "twitter:description", content: "Live JEE CBT attempt." },

      { title: "CBT Test — In Progress | JEE Prep Hub" },
      { name: "description", content: "Live JEE CBT attempt." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AttemptPlayer,
});

type Q = {
  id: string; order_no: number; question_type: string; question_text: string;
  image_url: string | null; images?: ImgRef[] | null;
  marks: number; negative_marks: number; subject?: string | null; chapter?: string | null; section?: string | null;
};
type O = { id: string; question_id: string; label: string; text: string; image_path?: string | null; order_no: number };
type R = { question_id: string; selected_option_ids: string[]; numerical_answer: number | null; marked_for_review: boolean; visited: boolean; time_spent_sec: number };
type QState = { selected: string[]; numerical: string; marked: boolean; visited: boolean; timeSpent: number };

const EMPTY: QState = { selected: [], numerical: "", marked: false, visited: true, timeSpent: 0 };
const isNumericType = (t: string) => t === "integer" || t === "numerical" || t === "range";

function AttemptPlayer() {
  const { attemptId } = Route.useParams();
  const nav = useNavigate();
  const fetchAttempt = useServerFn(getAttemptForPlayer);
  const saveFn = useServerFn(saveResponse);
  const submitFn = useServerFn(submitAttempt);
  const antiCheatFn = useServerFn(recordAntiCheat);
  const { data, isLoading, error } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => fetchAttempt({ data: { attemptId } }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [idx, setIdx] = useState(0);
  const [local, setLocal] = useState<Record<string, QState>>({});
  const [remaining, setRemaining] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [calcOpen, setCalcOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [tabWarn, setTabWarn] = useState(false);
  const [online, setOnline] = useState(true);
  const [saveTick, setSaveTick] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const tickRef = useRef(Date.now());
  const mainRef = useRef<HTMLElement | null>(null);
  const warnedRef = useRef({ five: false, one: false });
  const submittedRef = useRef(false);

  const questions: Q[] = (data as any)?.questions ?? [];
  const options: O[] = (data as any)?.options ?? [];
  const test = (data as any)?.test;
  const attempt = (data as any)?.attempt;
  const responses: R[] = (data as any)?.responses ?? [];
  const imageUrls: Record<string, string> = (data as any)?.imageUrls ?? {};

  // Hydrate from server
  useEffect(() => {
    if (!data) return;
    const seed: Record<string, QState> = {};
    for (const q of questions) {
      const r = responses.find((x) => x.question_id === q.id);
      seed[q.id] = {
        selected: r?.selected_option_ids ?? [],
        numerical: r?.numerical_answer != null ? String(r.numerical_answer) : "",
        marked: r?.marked_for_review ?? false,
        visited: r?.visited ?? false,
        timeSpent: r?.time_spent_sec ?? 0,
      };
    }
    setLocal(seed);
    const total = (test?.duration_min ?? 0) * 60;
    const elapsed = attempt ? Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000) : 0;
    setRemaining(Math.max(0, total - elapsed));
    tickRef.current = Date.now();
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // countdown
  useEffect(() => {
    if (!attempt) return;
    const t = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [attempt]);

  // time warnings
  useEffect(() => {
    if (!hydrated) return;
    if (remaining <= 300 && remaining > 60 && !warnedRef.current.five) { warnedRef.current.five = true; toast.warning("5 minutes left"); }
    if (remaining <= 60 && remaining > 0 && !warnedRef.current.one) { warnedRef.current.one = true; toast.error("Only 1 minute left!"); }
  }, [remaining, hydrated]);

  // auto-submit at 0
  useEffect(() => {
    if (hydrated && remaining === 0 && attempt && !submittedRef.current && !isLoading) {
      submittedRef.current = true;
      doSubmit(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, remaining, attempt, isLoading]);

  // tab switch logging
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        setTabSwitches((n) => n + 1);
        antiCheatFn({ data: { attemptId, kind: "tab_switch" } }).catch(() => {});
      } else {
        setTabWarn(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [antiCheatFn, attemptId]);

  // online / offline
  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // warn before leaving mid-test
  useEffect(() => {
    if (!attempt || submitting) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [attempt, submitting]);

  const current = questions[idx];
  const currentOpts = useMemo(() => options.filter((o) => o.question_id === current?.id), [options, current]);

  // visited + time spent per question
  useEffect(() => {
    if (!current) return;
    setLocal((prev) => ({ ...prev, [current.id]: { ...(prev[current.id] ?? EMPTY), visited: true } }));
    tickRef.current = Date.now();
    return () => {
      const spent = Math.floor((Date.now() - tickRef.current) / 1000);
      setLocal((prev) => {
        const s = prev[current.id];
        return s ? { ...prev, [current.id]: { ...s, timeSpent: (s.timeSpent ?? 0) + spent } } : prev;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const buildPayload = useCallback((q: Q, s: QState, extraSec: number) => {
    const numeric = isNumericType(q.question_type);
    return {
      data: {
        attemptId, questionId: q.id,
        selectedOptionIds: numeric ? [] : s.selected,
        numericalAnswer: numeric && s.numerical.trim() !== "" && Number.isFinite(Number(s.numerical)) ? Number(s.numerical) : null,
        markedForReview: s.marked, visited: true, timeSpentSec: s.timeSpent + extraSec,
      },
    };
  }, [attemptId]);

  const persist = useCallback(async (qid: string) => {
    const s = local[qid];
    const q = questions.find((x) => x.id === qid);
    if (!s || !q) return;
    const extra = current?.id === qid ? Math.floor((Date.now() - tickRef.current) / 1000) : 0;
    setSaveState("saving");
    try {
      await saveFn(buildPayload(q, s, extra));
      setSaveState("saved");
    } catch (e: any) {
      setSaveState("idle");
      toast.error(`Answer not saved: ${e?.message ?? "network error"}`);
    }
  }, [local, questions, current, saveFn, buildPayload]);

  // autosave 1.2s after any change
  useEffect(() => {
    if (!saveTick || !current) return;
    const t = setTimeout(() => { persist(current.id); }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTick]);

  // Navigation is instant; saving happens in the background.
  const goto = (n: number) => {
    const target = Math.max(0, Math.min(questions.length - 1, n));
    if (current) void persist(current.id);
    setIdx(target);
    setPaletteOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const patchCurrent = (fn: (s: QState) => QState) => {
    if (!current) return;
    setLocal((prev) => ({ ...prev, [current.id]: fn(prev[current.id] ?? EMPTY) }));
    setSaveTick((n) => n + 1);
  };
  const setSelected = (optId: string) => {
    if (!current) return;
    patchCurrent((s) => {
      if (current.question_type === "single") return { ...s, selected: [optId] };
      return { ...s, selected: s.selected.includes(optId) ? s.selected.filter((x) => x !== optId) : [...s.selected, optId] };
    });
  };
  const setNumerical = (v: string) => patchCurrent((s) => ({ ...s, numerical: v.replace(/[^0-9eE.+\-]/g, "") }));
  const toggleSign = () => patchCurrent((s) => ({ ...s, numerical: s.numerical.startsWith("-") ? s.numerical.slice(1) : "-" + s.numerical }));
  const toggleMark = () => patchCurrent((s) => ({ ...s, marked: !s.marked }));
  const clearAnswer = () => patchCurrent((s) => ({ ...s, selected: [], numerical: "" }));

  async function doSubmit(auto = false) {
    setSubmitting(true);
    setConfirmSubmit(false);
    const saves = questions
      .filter((q) => !!local[q.id])
      .map((q) => {
        const payload = buildPayload(q, local[q.id], q.id === current?.id ? Math.floor((Date.now() - tickRef.current) / 1000) : 0);
        return saveFn(payload).catch(() => saveFn(payload)); // one retry
      });
    try {
      const results = await Promise.allSettled(saves);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const reason = (failed[0] as PromiseRejectedResult).reason;
        throw new Error(`${failed.length} answer(s) could not be saved: ${reason?.message ?? "network error"}. Please try submitting again.`);
      }
      await submitFn({ data: { attemptId, auto } });
      toast.success("Test submitted successfully — your result will be published in 2 minutes.");
      nav({ to: "/tests/result/$attemptId", params: { attemptId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Submit failed");
      submittedRef.current = false;
      setSubmitting(false);
    }
  }

  const statusOf = useCallback((qid: string): Status => {
    const s = local[qid];
    if (!s) return "unvisited";
    const answered = s.selected.length > 0 || s.numerical.trim() !== "";
    if (answered && s.marked) return "answered_marked";
    if (answered) return "answered";
    if (s.marked) return "marked";
    return s.visited ? "visited" : "unvisited";
  }, [local]);

  const counts = useMemo(() => {
    const c = { answered: 0, marked: 0, notAnswered: 0, unvisited: 0 };
    for (const q of questions) {
      const s = statusOf(q.id);
      if (s === "answered" || s === "answered_marked") c.answered++;
      if (s === "marked" || s === "answered_marked") c.marked++;
      if (s === "visited" || s === "marked") c.notAnswered++;
      if (s === "unvisited") c.unvisited++;
    }
    return c;
  }, [questions, statusOf]);

  // desktop keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || !current) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright") goto(idx + 1);
      else if (k === "arrowleft") goto(idx - 1);
      else if (k === "m") toggleMark();
      else if (k === "c") clearAnswer();
      else if (!isNumericType(current.question_type)) {
        const n = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
        if (n >= 0 && currentOpts[n]) setSelected(currentOpts[n].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error || !data || !current) {
    const message = error instanceof Error ? error.message : "Attempt could not be loaded.";
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border bg-white p-6 text-center text-sm shadow dark:bg-slate-900">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <div className="font-semibold">Attempt could not be loaded</div>
          <p className="mt-1 text-muted-foreground">{message}</p>
          <Button className="mt-4" onClick={() => nav({ to: "/tests" })}>Back to Test Series</Button>
        </div>
      </div>
    );
  }

  const st = local[current.id] ?? EMPTY;
  const numeric = isNumericType(current.question_type);
  const multiple = current.question_type === "multiple";
  const isLast = idx >= questions.length - 1;
  const hh = Math.floor(remaining / 3600);
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const timeLabel = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  const timeCls = remaining <= 60 ? "bg-red-600 text-white" : remaining <= 300 ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
  const progressPct = questions.length ? (counts.answered / questions.length) * 100 : 0;
  const questionImages = (current.images ?? []).filter((im) => im?.path && imageUrls[im.path]);

  const groups: PaletteGroup[] = [];
  questions.forEach((q, i) => {
    const name = q.subject || q.section || "";
    let g = groups.find((x) => x.name === name);
    if (!g) { g = { name, items: [] }; groups.push(g); }
    g.items.push({ id: q.id, i });
  });
  const paletteProps = { groups, counts, idx, statusOf, onGoto: goto };
  const askSubmit = () => { setPaletteOpen(false); setConfirmSubmit(true); };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:h-[calc(100dvh-var(--site-global-header-height))]">
      {/* Header (always pinned) */}
      <header className="shrink-0 border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{test?.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              Q {idx + 1}/{questions.length} · {counts.answered} answered
              {tabSwitches > 0 && <span className="text-amber-600 dark:text-amber-400"> · {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""}</span>}
            </div>
          </div>
          <div className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 font-mono text-sm font-bold tabular-nums ${timeCls}`}>
            <Clock className="h-4 w-4" /> {timeLabel}
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setCalcOpen((v) => !v)} aria-label="Calculator"><Calculator className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 lg:hidden" onClick={() => setPaletteOpen(true)} aria-label="Question palette"><LayoutGrid className="h-4 w-4" /></Button>
        </div>
        <div className="h-1 bg-slate-200 dark:bg-slate-700"><div className="h-full bg-blue-600" style={{ width: `${progressPct}%` }} /></div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-red-600 px-3 py-1 text-xs font-medium text-white">
            <WifiOff className="h-3.5 w-3.5" /> You're offline — answers save when the connection returns. Keep this tab open.
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Scrollable question area */}
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">Q {idx + 1}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase">{current.question_type}</Badge>
              {current.subject && <Badge variant="outline" className="text-[10px] capitalize">{current.subject}</Badge>}
              {current.chapter && <Badge variant="outline" className="text-[10px]">{current.chapter}</Badge>}
              <span className="ml-auto rounded-md border px-2 py-0.5 text-xs font-medium">
                <span className="text-green-600 dark:text-green-400">+{Number(current.marks)}</span> / <span className="text-red-600 dark:text-red-400">−{Number(current.negative_marks)}</span>
              </span>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5">
              {current.question_text?.trim() ? <LazyMathText text={current.question_text} className="text-[15px] leading-relaxed sm:text-base" /> : null}
              {questionImages.length > 0
                ? questionImages.map((im, i) => <PlayerImage key={i} src={imageUrls[im.path]} im={im} onZoom={setZoomSrc} />)
                : current.image_url
                  ? <img src={current.image_url} alt="" onClick={() => setZoomSrc(current.image_url!)} onError={(e) => (e.currentTarget.style.display = "none")} className="mt-3 max-h-80 max-w-full cursor-zoom-in rounded-md border object-contain" />
                  : null}
            </div>

            {!numeric && multiple && <p className="mt-3 text-xs text-muted-foreground">One or more options can be correct. Select all that apply.</p>}

            <div className="mt-3 space-y-2.5">
              {numeric ? (
                <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {current.question_type === "integer" ? "Enter an integer answer" : "Enter your numerical answer"}
                  </label>
                  <div className="flex max-w-sm items-center gap-2">
                    <Input inputMode="decimal" value={st.numerical} onChange={(e) => setNumerical(e.target.value)} placeholder={current.question_type === "integer" ? "e.g. 42" : "e.g. 3.14"} className="h-12 font-mono text-lg" />
                    <Button type="button" variant="outline" className="h-12 w-12 shrink-0 text-lg" onClick={toggleSign} aria-label="Toggle sign">±</Button>
                  </div>
                </div>
              ) : (
                currentOpts.map((o) => {
                  const isSel = st.selected.includes(o.id);
                  const optImg = o.image_path ? imageUrls[o.image_path] : undefined;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setSelected(o.id)}
                      className={`flex min-h-[3.25rem] w-full items-start gap-3 rounded-xl border bg-white p-3 text-left dark:bg-slate-900 ${isSel ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:border-blue-400 dark:bg-blue-950" : ""}`}
                    >
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold ${multiple ? "rounded-md" : "rounded-full"} ${isSel ? "border-blue-600 bg-blue-600 text-white" : ""}`}>
                        {isSel && multiple ? <Check className="h-4 w-4" /> : o.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        {o.text?.trim() ? <LazyMathText text={o.text} className="text-sm sm:text-[15px]" /> : null}
                        {optImg && (
                          <img src={optImg} alt={`Option ${o.label}`} onClick={(e) => { e.stopPropagation(); setZoomSrc(optImg); }} onError={(e) => (e.currentTarget.style.display = "none")} className="mt-1.5 max-h-44 max-w-full cursor-zoom-in rounded-md border bg-white object-contain" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Desktop actions */}
            <div className="mt-6 hidden flex-wrap items-center gap-2 lg:flex">
              <Button variant="outline" size="sm" onClick={() => goto(idx - 1)} disabled={idx === 0}><ChevronLeft className="h-4 w-4" /> Prev</Button>
              <Button variant={st.marked ? "default" : "secondary"} size="sm" onClick={toggleMark}><Flag className="mr-1 h-3.5 w-3.5" /> {st.marked ? "Marked" : "Mark for review"}</Button>
              <Button variant="ghost" size="sm" onClick={clearAnswer}>Clear</Button>
              <span className="text-xs text-muted-foreground">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}</span>
              <div className="ml-auto flex gap-2">
                {!isLast && <Button size="sm" onClick={() => goto(idx + 1)}>Save & Next <ChevronRight className="h-4 w-4" /></Button>}
                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={askSubmit}>Submit Test</Button>
              </div>
            </div>
            <p className="mt-3 hidden text-[11px] text-muted-foreground lg:block">Shortcuts: ← → move · A–D pick option · M mark · C clear</p>
            <div className="h-4 lg:hidden" />
          </div>
        </main>

        {/* Desktop palette */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-white p-4 dark:bg-slate-900 lg:block">
          <PaletteContent {...paletteProps} />
        </aside>
      </div>

      {/* Mobile action bar (always visible at the bottom) */}
      <div className="shrink-0 border-t bg-white px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] dark:bg-slate-900 lg:hidden">
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" className="h-12 w-28 shrink-0" onClick={() => goto(idx - 1)} disabled={idx === 0}>
              <ChevronLeft className="mr-1 h-5 w-5" /> Prev
            </Button>
            {isLast ? (
              <Button className="h-12 flex-1 bg-green-600 text-base text-white hover:bg-green-700" onClick={askSubmit}>Finish & Submit</Button>
            ) : (
              <Button className="h-12 flex-1 text-base" onClick={() => goto(idx + 1)}>Save & Next <ChevronRight className="ml-1 h-5 w-5" /></Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant={st.marked ? "default" : "secondary"} className="h-10 px-1 text-xs" onClick={toggleMark}><Flag className="mr-1 h-4 w-4" /> {st.marked ? "Marked" : "Review"}</Button>
            <Button variant="outline" className="h-10 px-1 text-xs" onClick={clearAnswer}><Eraser className="mr-1 h-4 w-4" /> Clear</Button>
            <Button variant="outline" className="h-10 border-red-300 px-1 text-xs font-semibold text-red-600" onClick={askSubmit}>Submit Test</Button>
          </div>
        </div>
      </div>

      {calcOpen && (
        <Suspense fallback={null}>
          <CalculatorPanel onClose={() => setCalcOpen(false)} />
        </Suspense>
      )}

      {/* Mobile palette sheet */}
      {paletteOpen && (
        <Portal>
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setPaletteOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-semibold">Question palette</div>
                <button onClick={() => setPaletteOpen(false)} aria-label="Close palette" className="rounded-md p-1"><X className="h-6 w-6" /></button>
              </div>
              <PaletteContent {...paletteProps} />
              <Button className="mt-4 h-12 w-full bg-green-600 text-base text-white hover:bg-green-700" onClick={askSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit Test
              </Button>
            </div>
          </div>
        </Portal>
      )}

      {/* Image zoom */}
      {zoomSrc && (
        <Portal>
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black p-3" onClick={() => setZoomSrc(null)}>
            <button className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white" aria-label="Close image"><X className="h-6 w-6" /></button>
            <img src={zoomSrc} alt="" className="max-h-full max-w-full rounded-md bg-white object-contain" />
          </div>
        </Portal>
      )}

      <Modal
        open={tabWarn}
        onClose={() => setTabWarn(false)}
        title={<><AlertTriangle className="h-5 w-5 text-amber-500" /> Tab switch detected</>}
        actions={<Button onClick={() => setTabWarn(false)}>Continue test</Button>}
      >
        You left the test tab. This is logged with your attempt ({tabSwitches} so far) and is visible to admins. The timer keeps running.
      </Modal>

      <Modal
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        title="Submit test?"
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Keep attempting</Button>
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => doSubmit(false)} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Yes, submit
            </Button>
          </>
        }
      >
        <p>Once submitted you cannot change your answers. Unanswered questions score 0.</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Stat n={counts.answered} label="Answered" cls="text-green-600" />
          <Stat n={counts.notAnswered} label="Not ans." cls="text-red-600" />
          <Stat n={counts.marked} label="Marked" cls="text-purple-600" />
              <Stat n={counts.unvisited} label="Not visited" cls="text-slate-500 dark:text-slate-300" />
        </div>
      </Modal>
    </div>
  );
}
