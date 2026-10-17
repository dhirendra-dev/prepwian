import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Target, Clock3, CheckCircle2, XCircle, MinusCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/jee-predictor/mock-analysis")({
  component: MockAnalysisPage,
});

type Attempt = {
  attempt_id: string; test_id: string; test_name: string; exam_type: string;
  started_at: string; submitted_at: string | null; score: number | null; max_score: number | null;
  correct_count: number; wrong_count: number; skipped_count: number; accuracy: number | null; percentile: number | null;
};
type Analysis = {
  success: boolean; has_attempt: boolean;
  attempt?: Record<string, any>;
  response_stats?: Record<string, any>;
  subject_analysis?: Array<Record<string, any>>;
  chapter_analysis?: Array<Record<string, any>>;
};

function MockAnalysisPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selected, setSelected] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadAttempts() {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_jee_mock_test_attempts", { _limit: 50 });
    if (error) {
      toast.error(error.message || "Could not load test attempts");
      setAttempts([]);
    } else {
      const rows = (data || []) as Attempt[];
      setAttempts(rows);
      if (rows.length > 0 && !selected) setSelected(rows[0].attempt_id);
    }
    setLoading(false);
  }

  async function loadAnalysis(id?: string) {
    setDetailLoading(true);
    const { data, error } = await (supabase as any).rpc("get_jee_mock_test_analysis", {
      _attempt_id: id || null,
    });
    if (error) {
      toast.error(error.message || "Could not load analysis");
      setAnalysis(null);
    } else {
      setAnalysis(data as Analysis);
    }
    setDetailLoading(false);
  }

  useEffect(() => { void loadAttempts(); }, []);
  useEffect(() => {
    if (selected) void loadAnalysis(selected);
  }, [selected]);

  const attempt = analysis?.attempt;
  const responseStats = analysis?.response_stats;
  const subjects = analysis?.subject_analysis || [];
  const chapters = analysis?.chapter_analysis || [];

  const scorePercent = useMemo(() => {
    const score = Number(attempt?.score || 0);
    const max = Number(attempt?.max_score || 0);
    return max > 0 ? Math.round((score / max) * 100) : 0;
  }, [attempt]);

  if (loading) return <PageShell><Empty text="Loading mock test attempts..." /></PageShell>;

  return (
    <PageShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-primary"><BarChart3 className="h-5 w-5" /><span className="text-sm font-semibold">JEE Study System</span></div>
        <h1 className="text-3xl font-bold tracking-tight">Mock Test Analysis</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Understand your score, accuracy, time usage and chapter-wise performance from completed tests.</p>
      </div>

      {attempts.length === 0 ? (
        <Card><CardContent className="py-14 text-center"><Target className="mx-auto mb-4 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">No completed mock tests yet</h2><p className="mt-1 text-sm text-muted-foreground">Complete a test and its analysis will appear here.</p></CardContent></Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-4">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Select a completed test" /></SelectTrigger>
                <SelectContent>
                  {attempts.map((a) => <SelectItem key={a.attempt_id} value={a.attempt_id}>{a.test_name} · {formatDate(a.submitted_at || a.started_at)}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {detailLoading ? <Empty text="Analysing your test..." /> : analysis?.has_attempt && attempt ? (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Score" value={`${attempt.score ?? 0} / ${attempt.max_score ?? 0}`} icon={<Target className="h-5 w-5" />} />
                <Stat label="Accuracy" value={`${attempt.accuracy ?? 0}%`} icon={<CheckCircle2 className="h-5 w-5" />} />
                <Stat label="Correct / Wrong" value={`${attempt.correct_count ?? 0} / ${attempt.wrong_count ?? 0}`} icon={<TrendingUp className="h-5 w-5" />} />
                <Stat label="Percentile" value={attempt.percentile == null ? "—" : `${attempt.percentile}`} icon={<BarChart3 className="h-5 w-5" />} />
              </div>

              <Card className="mb-6">
                <CardHeader><CardTitle>Attempt overview</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Answered" value={responseStats?.answered ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} />
                    <Metric label="Wrong" value={responseStats?.wrong ?? 0} icon={<XCircle className="h-4 w-4" />} />
                    <Metric label="Unanswered" value={responseStats?.unanswered ?? attempt.skipped_count ?? 0} icon={<MinusCircle className="h-4 w-4" />} />
                    <Metric label="Time spent" value={formatMinutes(Number(responseStats?.time_spent_sec ?? attempt.duration_sec ?? 0) / 60)} icon={<Clock3 className="h-4 w-4" />} />
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Score utilisation</span><span className="font-semibold">{scorePercent}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, scorePercent))}%` }} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader><CardTitle>Subject-wise performance</CardTitle></CardHeader>
                <CardContent>
                  {subjects.length === 0 ? <p className="text-sm text-muted-foreground">No subject-level question data is available.</p> : (
                    <div className="space-y-3">{subjects.map((row) => <AnalysisRow key={row.subject} name={formatLabel(row.subject)} total={Number(row.total_questions)} correct={Number(row.correct)} wrong={Number(row.wrong)} skipped={Number(row.skipped)} accuracy={Number(row.accuracy)} score={Number(row.score)} />)}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Chapter analysis</CardTitle></CardHeader>
                <CardContent>
                  {chapters.length === 0 ? <p className="text-sm text-muted-foreground">No chapter data is available for this test.</p> : (
                    <div className="space-y-3">{chapters.map((row) => <AnalysisRow key={`${row.subject}-${row.chapter}`} name={formatLabel(row.chapter)} subtitle={formatLabel(row.subject)} total={Number(row.total_questions)} correct={Number(row.correct)} wrong={Number(row.wrong)} skipped={Number(row.skipped)} accuracy={Number(row.accuracy)} score={Number(row.score)} />)}</div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : <Empty text="No analysis is available for this attempt." />}
        </>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background"><div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><div className="rounded-xl bg-muted p-3">{icon}</div></CardContent></Card>;
}
function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <div className="rounded-xl border p-4"><div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div><p className="text-xl font-bold">{value}</p></div>;
}
function AnalysisRow({ name, subtitle, total, correct, wrong, skipped, accuracy, score }: { name: string; subtitle?: string; total: number; correct: number; wrong: number; skipped: number; accuracy: number; score: number }) {
  return <div className="rounded-xl border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{name}</p>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div><div className="flex flex-wrap gap-3 text-xs"><span>✓ {correct}</span><span>✕ {wrong}</span><span>— {skipped}</span><span className="font-semibold">{accuracy}% accuracy</span><span>{score} marks</span></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, accuracy))}%` }} /></div><p className="mt-2 text-[11px] text-muted-foreground">{total} questions</p></div>;
}
function formatLabel(value: unknown) { return String(value ?? "").replaceAll("_", " ").replace(/\w/g, (c) => c.toUpperCase()); }
function formatDate(value: string) { return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function formatMinutes(minutes: number) { if (minutes < 1) return `${Math.round(minutes * 60)} sec`; const h = Math.floor(minutes / 60); const m = Math.round(minutes % 60); return h ? `${h}h ${m}m` : `${m} min`; }
