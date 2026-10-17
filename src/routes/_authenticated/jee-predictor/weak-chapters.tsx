import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Target, Clock3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/jee-predictor/weak-chapters")({
  component: WeakChaptersPage,
});

type WeakChapter = {
  subject: string;
  chapter: string;
  total_questions: number;
  attempted_questions: number;
  correct_questions: number;
  wrong_questions: number;
  skipped_questions: number;
  accuracy: number;
  avg_time_sec: number;
  total_tests: number;
  weakness_score: number;
  weakness_level: "HIGH" | "MEDIUM" | "LOW";
};

function WeakChaptersPage() {
  const [rows, setRows] = useState<WeakChapter[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_jee_weak_chapters", { _limit: 30 });
    if (error) {
      toast.error(error.message || "Could not load weak chapters");
      setRows([]);
    } else {
      setRows((data || []) as WeakChapter[]);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const high = rows.filter((r) => r.weakness_level === "HIGH").length;
  const medium = rows.filter((r) => r.weakness_level === "MEDIUM").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-semibold">JEE Study System</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Weak Chapter Detector</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Find chapters that need more practice using your real completed-test performance.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Chapters analysed" value={rows.length} icon={<BookOpen className="h-5 w-5" />} />
          <Stat label="High priority" value={high} icon={<AlertTriangle className="h-5 w-5" />} />
          <Stat label="Medium priority" value={medium} icon={<Target className="h-5 w-5" />} />
          <Stat label="Tests used" value={rows.reduce((m, r) => Math.max(m, r.total_tests), 0)} icon={<Clock3 className="h-5 w-5" />} />
        </div>

        {loading ? (
          <div className="rounded-2xl border p-10 text-center text-sm text-muted-foreground">Analysing your completed tests...</div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <AlertTriangle className="mb-4 h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">Not enough test data yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Complete at least one test with chapter-tagged questions. The detector will then identify areas needing attention.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={`${row.subject}-${row.chapter}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border bg-muted px-2.5 py-1 text-[11px] font-medium">{formatLabel(row.subject)}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${row.weakness_level === "HIGH" ? "border-destructive/40 text-destructive" : ""}`}>
                          {row.weakness_level} PRIORITY
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold">{row.chapter}</h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                        <span>Accuracy: <strong className="text-foreground">{row.accuracy}%</strong></span>
                        <span>Correct: <strong className="text-foreground">{row.correct_questions}</strong></span>
                        <span>Wrong: <strong className="text-foreground">{row.wrong_questions}</strong></span>
                        <span>Skipped: <strong className="text-foreground">{row.skipped_questions}</strong></span>
                        <span>Avg time: <strong className="text-foreground">{Math.round(row.avg_time_sec)}s</strong></span>
                      </div>
                    </div>
                    <div className="w-full lg:w-56">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-muted-foreground">Weakness score</span>
                        <strong>{row.weakness_score}</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, row.weakness_score))}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><div className="rounded-xl bg-muted p-3">{icon}</div></CardContent></Card>;
}
function formatLabel(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
