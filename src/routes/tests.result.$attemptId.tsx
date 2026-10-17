import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAttemptResult } from "@/lib/tests.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/MathText";
import { CheckCircle2, XCircle, MinusCircle, Trophy, Loader2, ChevronLeft, ChevronRight, LayoutGrid, FileDown } from "lucide-react";
import { generateTestReportPdf, downloadPdf } from "@/lib/test-pdf";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/tests/result/$attemptId")({
  head: () => ({ meta: [
      { name: "description", content: "Review your CBT score, saved responses and question analysis." },
      { property: "og:title", content: "Test Result | PREPWIAN" },
      { property: "og:description", content: "Review your CBT score, saved responses and question analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Test Result | PREPWIAN" },
      { name: "twitter:description", content: "Review your CBT score, saved responses and question analysis." },
{ title: "Test Result | PREPWIAN" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: number } => {
    const n = Number(search['q']);
    return Number.isFinite(n) && n >= 1 ? { q: Math.floor(n) } : {};
  },
  component: ResultPage,
});

function ResultPage() {
  const { attemptId } = Route.useParams();
  const fn = useServerFn(getAttemptResult);
  const { data, isLoading, error } = useQuery({
    queryKey: ["attempt-result", attemptId],
    queryFn: () => fn({ data: { attemptId } }),
    staleTime: 0,
    refetchInterval: (q) => ((q.state.data as any)?.locked ? 5000 : false),
  });
  const navigate = useNavigate();
  const { q: qParam } = Route.useSearch();
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const [showAll, setShowAll] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(Math.max(0, (qParam ?? 1) - 1));
  const [exporting, setExporting] = useState(false);
  const locked = (data as any)?.locked === true;

  const view = useMemo(() => {
    if (!data || (data as any).locked) return null;
    const d = data as any;
    const responsesById = new Map<string, any>((d.responses ?? []).map((r: any) => [r.question_id, r]));
    const items = (d.questions ?? []).map((q: any, qi: number) => {
      const r = responsesById.get(q.id);
      const opts = (d.options ?? []).filter((o: any) => o.question_id === q.id);
      const answered = r && ((r.selected_option_ids?.length ?? 0) > 0 || r.numerical_answer != null);
      const status = !answered ? "skipped" : r.is_correct === true ? "correct" : "wrong";
      return { q, r, opts, status, pos: q.order_no != null ? Number(q.order_no) + 1 : qi + 1 };
    });
    return { ...d, items };
  }, [data]);

  const filteredItems: any[] = view
    ? view.items.filter((x: any) => filter === "all" || x.status === filter)
    : [];
  const maxIdx = Math.max(0, filteredItems.length - 1);
  const safeIdx = Math.min(reviewIdx, maxIdx);

  useEffect(() => {
    setReviewIdx(0);
  }, [filter]);

  useEffect(() => {
    if (!filteredItems.length || showAll) return;
    navigate({ to: ".", search: { q: safeIdx + 1 }, replace: true, resetScroll: false });
  }, [safeIdx, showAll, filteredItems.length]);

  useEffect(() => {
    if (showAll) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowLeft") setReviewIdx((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setReviewIdx((i) => Math.min(maxIdx, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxIdx, showAll]);

  if (isLoading) return <AppShell><div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div></AppShell>;
  if (locked) return <AppShell><PendingResult resultsAt={(data as any)?.resultsAt} testName={(data as any)?.test?.name} /></AppShell>;
  if (error || !view) return <AppShell><div className="rounded-lg border bg-card p-6 text-center text-sm">Result not available. <Link to="/tests" className="underline">Back</Link></div></AppShell>;


  const a = view.attempt;
  const t = view.test;
  const filtered = filteredItems;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent dark:from-slate-800 dark:via-slate-900/75 dark:to-transparent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{t?.name}</CardTitle>
                <div className="mt-1 flex gap-1.5 text-xs">
                  <Badge variant="outline" className="uppercase">{t?.exam_type?.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className="uppercase">{t?.subject}</Badge>
                  <Badge className={a.status === "auto_submitted" ? "bg-orange-500" : "bg-green-600"}>{a.status.replace("_", " ")}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting}
                  onClick={async () => {
                    setExporting(true);
                    try {
                      const bytes = await generateTestReportPdf({
                        testName: t?.name ?? "Test Report",
                        examType: t?.exam_type ?? null,
                        subject: t?.subject ?? null,
                        studentName: (view as any)?.profile?.full_name ?? null,
                        attemptedAt: a.submitted_at ?? a.created_at ?? null,
                        stats: {
                          score: `${Number(a.score).toFixed(2)} / ${Number(a.max_score)}`,
                          accuracy: `${Number(a.accuracy).toFixed(1)}%`,
                          correct: String(a.correct_count),
                          wrong: String(a.wrong_count),
                          skipped: String(a.skipped_count),
                          percentile: a.percentile != null ? Number(a.percentile).toFixed(2) : null,
                        },
                        includeExplanations: true,
                        items: view.items.map((it: any) => {
                          const numeric = it.q.question_type === "integer" || it.q.question_type === "numerical";
                          return {
                            pos: it.pos,
                            status: it.status,
                            chapter: it.q.chapter ?? null,
                            questionText: it.q.question_text ?? "",
                            numeric,
                            yourAnswer: numeric ? (it.r?.numerical_answer ?? null) : null,
                            correctAnswer: numeric ? String(it.q.correct_numerical ?? "") : null,
                            options: numeric
                              ? []
                              : it.opts.map((o: any) => ({
                                  label: o.label,
                                  text: o.text ?? "",
                                  correct: !!o.is_correct,
                                  chosen: !!it.r?.selected_option_ids?.includes(o.id),
                                })),
                            explanation: it.q.explanation ?? null,
                          };
                        }),
                      });
                      downloadPdf(bytes, `${(t?.name ?? "test-report").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-jeeprephub.pdf`);
                    } catch (e: any) {
                      toast.error(e?.message ?? "Could not generate PDF");
                    } finally {
                      setExporting(false);
                    }
                  }}
                >
                  {exporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
                  {exporting ? "Preparing…" : "Download PDF"}
                </Button>
                <Button asChild variant="outline" size="sm"><Link to="/tests/leaderboard/$testId" params={{ testId: a.test_id }}><Trophy className="mr-1.5 h-4 w-4" /> Leaderboard</Link></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Score" value={`${Number(a.score).toFixed(2)} / ${Number(a.max_score)}`} />
              <Stat label="Accuracy" value={`${Number(a.accuracy).toFixed(1)}%`} />
              <Stat label="Correct" value={String(a.correct_count)} tone="green" />
              <Stat label="Wrong" value={String(a.wrong_count)} tone="red" />
              <Stat label="Skipped" value={String(a.skipped_count)} tone="muted" />
            </div>
            {a.percentile != null && <div className="mt-3 rounded-md border bg-amber-50 p-3 text-sm dark:bg-amber-950/30"><b>Percentile:</b> {Number(a.percentile).toFixed(2)}</div>}
            <SubjectBreakdown items={view.items} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          {(["all", "correct", "wrong", "skipped"] as const).map((k) => (
            <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)} className="capitalize">
              {k}
            </Button>
          ))}
          <button
            onClick={() => setShowAll((v) => !v)}
            className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {showAll ? "Single-question view" : "View all on one page"}
          </button>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No questions in this filter.
          </div>
        )}

        {!showAll && filtered.length > 0 && (
          <div className="lg:flex lg:items-start lg:gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="lg:hidden">
                <Button size="sm" variant="outline" onClick={() => setMapOpen((v) => !v)}>
                  <LayoutGrid className="mr-1.5 h-4 w-4" /> Question Map
                </Button>
                {mapOpen && (
                  <div className="mt-2">
                    <Palette items={filtered} current={safeIdx} onPick={(i: number) => setReviewIdx(i)} />
                  </div>
                )}
              </div>

              <ReviewCard item={filtered[safeIdx]} />

              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" disabled={safeIdx === 0} onClick={() => setReviewIdx(safeIdx - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  Question {filtered[safeIdx]?.pos} of {view.items.length}
                </span>
                <Button size="sm" variant="outline" disabled={safeIdx >= maxIdx} onClick={() => setReviewIdx(safeIdx + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <aside className="hidden w-56 shrink-0 lg:block">
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question map</div>
                <Palette items={filtered} current={safeIdx} onPick={(i: number) => setReviewIdx(i)} />
              </div>
            </aside>
          </div>
        )}

        {showAll && (
          <div className="space-y-3">
            {filtered.map((it: any) => (
              <ReviewCard key={it.q.id} item={it} />
            ))}
          </div>
        )}


        <div className="pb-8 pt-2 text-center">
          <Button asChild variant="outline"><Link to="/tests">Back to tests</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}

function Palette({ items, current, onPick }: { items: any[]; current: number; onPick: (i: number) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
      {items.map((it, i) => {
        const tone =
          it.status === "correct"
            ? "bg-green-600 text-white border-green-600"
            : it.status === "wrong"
              ? "bg-red-600 text-white border-red-600"
              : "bg-muted text-muted-foreground";
        return (
          <button
            key={it.q.id}
            onClick={() => onPick(i)}
            className={`h-8 rounded-md border text-xs font-semibold transition-transform active:scale-95 ${tone} ${
              i === current ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
            }`}
            aria-label={`Question ${it.pos}`}
          >
            {it.pos}
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ item }: { item: any }) {
  if (!item) return null;
  const q = item.q;
  const r = item.r;
  const opts = item.opts;
  const numeric = q.question_type === "integer" || q.question_type === "numerical";
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">Q {item.pos}</Badge>
          {item.status === "correct" && <Badge className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Correct · +{Number(r?.marks_awarded ?? q.marks)}</Badge>}
          {item.status === "wrong" && <Badge className="bg-red-600"><XCircle className="mr-1 h-3 w-3" /> Wrong · {Number(r?.marks_awarded ?? 0)}</Badge>}
          {item.status === "skipped" && <Badge variant="outline"><MinusCircle className="mr-1 h-3 w-3" /> Skipped</Badge>}
          {q.chapter && <span className="text-muted-foreground">{q.chapter}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <MathText text={q.question_text} className="text-sm" />
        {numeric ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Your answer</div><div className="font-mono">{r?.numerical_answer ?? "—"}</div></div>
            <div className="rounded-md border bg-green-50 p-2 dark:bg-green-950/30"><div className="text-xs text-muted-foreground">Correct</div><div className="font-mono">{q.correct_numerical} <span className="text-xs text-muted-foreground">±{q.numerical_tolerance}</span></div></div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {opts.map((o: any) => {
              const chosen = r?.selected_option_ids?.includes(o.id);
              const correct = o.is_correct;
              const cls = correct ? "border-green-600 bg-green-50 dark:bg-green-950/30"
                : chosen ? "border-red-600 bg-red-50 dark:bg-red-950/30"
                : "";
              return (
                <div key={o.id} className={`flex items-start gap-3 rounded-md border p-2.5 ${cls}`}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{o.label}</span>
                  <MathText text={o.text} className="flex-1 text-sm" />
                  {correct && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {chosen && !correct && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                </div>
              );
            })}
          </div>
        )}
        {q.explanation && (
          <details className="rounded-md border bg-muted/30 p-3 text-xs">
            <summary className="cursor-pointer font-semibold">Explanation</summary>
            <MathText text={q.explanation} className="mt-2" />
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "muted" }) {
  const c = tone === "green" ? "text-green-600 dark:text-green-400" : tone === "red" ? "text-red-600 dark:text-red-400" : tone === "muted" ? "text-muted-foreground" : "";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${c}`}>{value}</div>
    </div>
  );
}

function SubjectBreakdown({ items }: { items: any[] }) {
  const bySubject = new Map<string, { correct: number; wrong: number; skipped: number; scored: number; total: number }>();
  const byChapter = new Map<string, { correct: number; wrong: number; skipped: number; scored: number; total: number }>();
  for (const it of items) {
    const subj = it.q.subject || "other";
    const chap = it.q.chapter || null;
    const marks = Number(it.r?.marks_awarded ?? 0);
    const max = Number(it.q.marks ?? 0);
    const add = (m: Map<string, any>, k: string) => {
      const cur = m.get(k) || { correct: 0, wrong: 0, skipped: 0, scored: 0, total: 0 };
      cur.total += max; cur.scored += marks;
      if (it.status === "correct") cur.correct++;
      else if (it.status === "wrong") cur.wrong++;
      else cur.skipped++;
      m.set(k, cur);
    };
    add(bySubject, subj);
    if (chap) add(byChapter, `${subj}::${chap}`);
  }
  const subjRows = Array.from(bySubject.entries());
  const chapRows = Array.from(byChapter.entries()).sort((a, b) => (b[1].scored / (b[1].total || 1)) - (a[1].scored / (a[1].total || 1)));
  if (subjRows.length === 0) return null;
  return (
    <div className="mt-4 space-y-3">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject breakdown</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {subjRows.map(([subj, s]) => {
            const pct = s.total ? (s.scored / s.total) * 100 : 0;
            return (
              <div key={subj} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold capitalize">{subj}</span>
                  <span className="text-xs text-muted-foreground">{s.scored.toFixed(1)}/{s.total}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                </div>
                <div className="mt-1.5 flex gap-2 text-[10px] text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">✓ {s.correct}</span>
                  <span className="text-red-600 dark:text-red-400">✗ {s.wrong}</span>
                  <span>— {s.skipped}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {chapRows.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chapter performance (top → weakest)</div>
          <div className="space-y-1">
            {chapRows.slice(0, 12).map(([key, s]) => {
              const [subj, chap] = key.split("::");
              const pct = s.total ? (s.scored / s.total) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div className="w-24 truncate text-muted-foreground capitalize">{subj}</div>
                  <div className="min-w-0 flex-1 truncate">{chap}</div>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${pct >= 70 ? "bg-green-600" : pct >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
                  </div>
                  <div className="w-16 text-right font-mono">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingResult({ resultsAt, testName }: { resultsAt?: string | null; testName?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = resultsAt ? new Date(resultsAt).getTime() : null;
  const left = target ? Math.max(0, Math.ceil((target - now) / 1000)) : null;
  const mm = left != null ? String(Math.floor(left / 60)).padStart(2, "0") : "--";
  const ss = left != null ? String(left % 60).padStart(2, "0") : "--";

  return (
    <div className="mx-auto max-w-md">
      <Card className="overflow-hidden text-center">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent dark:from-slate-800 dark:via-slate-900/75 dark:to-transparent">
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> Test submitted successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {testName && <p className="text-sm text-muted-foreground">{testName}</p>}
          <div className="font-display text-4xl font-bold tabular-nums">{mm}:{ss}</div>
          <p className="text-sm text-muted-foreground">
            Your answers are saved. The result will be published automatically and you'll get an in-app notification
            the moment it's ready.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Waiting for results…
          </div>
          <Button asChild variant="outline" className="w-full"><Link to="/tests">Back to Test Series</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
