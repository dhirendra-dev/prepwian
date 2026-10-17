import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type TrendRow = {
  sequence: number;
  attempt_id: string;
  date: string | null;
  score: number | null;
  max_score: number | null;
  score_percent: number | null;
  accuracy: number | null;
  correct: number | null;
  wrong: number | null;
  skipped: number | null;
  duration_sec: number | null;
};

type TrendData = {
  success?: boolean;
  summary?: {
    tests?: number;
    avg_accuracy?: number | null;
    avg_score_pct?: number | null;
    correct?: number;
    wrong?: number;
    skipped?: number;
    total_time_sec?: number;
  };
  trend?: TrendRow[];
};

function pct(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

function formatMinutes(seconds: number | null | undefined) {
  return `${Math.round(Number(seconds ?? 0) / 60)} min`;
}

export default function PerformanceTrendsPage() {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    const { data: result, error: rpcError } = await (supabase as any).rpc(
      "get_jee_performance_trends",
      { _limit: 12 }
    );

    if (rpcError) {
      setError(rpcError.message || "Unable to load performance trends.");
      setData(null);
    } else {
      setData(result as TrendData);
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const trend = data?.trend ?? [];
  const summary = data?.summary;

  const direction = useMemo(() => {
    if (trend.length < 2) return "stable";
    const first = Number(trend[0]?.score_percent ?? 0);
    const last = Number(trend[trend.length - 1]?.score_percent ?? 0);
    if (last > first + 3) return "up";
    if (last < first - 3) return "down";
    return "stable";
  }, [trend]);

  const maxScore = Math.max(...trend.map((x) => Number(x.score_percent ?? 0)), 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/jee-predictor">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h1 className="text-2xl font-bold">Performance Trends</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Track how your completed mock-test performance changes over time.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {!loading && trend.length === 0 && !error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No completed tests yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Complete a mock test and submit it. Your real test data will appear here
                automatically.
              </p>
              <Button asChild>
                <Link to="/jee-predictor/mock-analysis">Open Mock Analysis</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {trend.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Tests analysed</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{summary?.tests ?? trend.length}</CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Average accuracy</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{pct(summary?.avg_accuracy)}</CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Average score %</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{pct(summary?.avg_score_pct)}</CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Overall direction</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={direction === "down" ? "destructive" : "secondary"}>
                    {direction === "up" && <TrendingUp className="mr-1 h-4 w-4" />}
                    {direction === "down" && <TrendingDown className="mr-1 h-4 w-4" />}
                    {direction === "stable" ? "Stable" : direction === "up" ? "Improving" : "Needs attention"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Score progression</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {trend.map((item) => (
                    <div key={item.attempt_id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          Test {item.sequence} · {formatDate(item.date)}
                        </span>
                        <span className="font-semibold">{pct(item.score_percent)}</span>
                      </div>
                      <Progress
                        value={(Number(item.score_percent ?? 0) / maxScore) * 100}
                      />
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {item.correct ?? 0} correct
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          {item.wrong ?? 0} wrong
                        </span>
                        <span>Skipped {item.skipped ?? 0}</span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatMinutes(item.duration_sec)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12-test snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4" />
                      Accuracy
                    </div>
                    <Progress value={Number(summary?.avg_accuracy ?? 0)} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {pct(summary?.avg_accuracy)} average
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold">{summary?.correct ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold">{summary?.wrong ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Wrong</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold">{summary?.skipped ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="text-sm font-medium">Total test time</div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatMinutes(summary?.total_time_sec)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based only on completed/submitted test attempts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
