import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Attempt = {
  id: string;
  test_id: string;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  accuracy: number | null;
  correct: number | null;
  wrong: number | null;
  skipped: number | null;
  duration_sec: number | null;
  percentile: number | null;
};

type Result = {
  attempt_a: Attempt;
  attempt_b: Attempt;
  delta: Record<string, number>;
};

const fmt = (n: number | null | undefined) => Number(n ?? 0).toFixed(1);
const minutes = (s: number | null | undefined) =>
  Math.round(Number(s ?? 0) / 60);

export default function MockTestComparisonPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    const { data, error: rpcError } = await (supabase as any).rpc(
      "get_jee_mock_test_attempts",
      { _limit: 20 }
    );

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setAttempts((data?.attempts ?? data ?? []) as Attempt[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const compare = async () => {
    if (!a || !b || a === b) return;

    setError("");

    const { data, error: rpcError } = await (supabase as any).rpc(
      "get_jee_mock_test_comparison",
      {
        _attempt_a: a,
        _attempt_b: b,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setResult(null);
    } else {
      setResult(data as Result);
    }
  };

  const metric = (
    label: string,
    valueA: number | null | undefined,
    valueB: number | null | undefined,
    delta: number | undefined,
    suffix = ""
  ) => (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 grid grid-cols-3 items-end gap-2">
        <div>
          <div className="text-lg font-bold">
            {fmt(valueA)}
            {suffix}
          </div>
          <div className="text-xs text-muted-foreground">Test A</div>
        </div>

        <div>
          <div className="text-lg font-bold">
            {fmt(valueB)}
            {suffix}
          </div>
          <div className="text-xs text-muted-foreground">Test B</div>
        </div>

        <Badge variant={Number(delta ?? 0) >= 0 ? "secondary" : "destructive"}>
          {Number(delta ?? 0) > 0 ? "+" : ""}
          {fmt(delta)}
          {suffix}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
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
                <h1 className="text-2xl font-bold">Mock Test Comparison</h1>
              </div>

              <p className="text-sm text-muted-foreground">
                Compare two completed tests using your actual results.
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="p-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Select two completed tests</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <Select value={a} onValueChange={setA}>
              <SelectTrigger>
                <SelectValue placeholder="Select Test A" />
              </SelectTrigger>

              <SelectContent>
                {attempts.map((attempt) => (
                  <SelectItem key={attempt.id} value={attempt.id}>
                    {new Date(
                      attempt.submitted_at ?? ""
                    ).toLocaleDateString()}{" "}
                    · {fmt(attempt.score)}/{fmt(attempt.max_score)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={b} onValueChange={setB}>
              <SelectTrigger>
                <SelectValue placeholder="Select Test B" />
              </SelectTrigger>

              <SelectContent>
                {attempts.map((attempt) => (
                  <SelectItem key={attempt.id} value={attempt.id}>
                    {new Date(
                      attempt.submitted_at ?? ""
                    ).toLocaleDateString()}{" "}
                    · {fmt(attempt.score)}/{fmt(attempt.max_score)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="md:col-span-2"
              onClick={() => void compare()}
              disabled={!a || !b || a === b || loading}
            >
              Compare Tests
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {metric(
                "Score",
                result.attempt_a.score,
                result.attempt_b.score,
                result.delta.score
              )}

              {metric(
                "Accuracy",
                result.attempt_a.accuracy,
                result.attempt_b.accuracy,
                result.delta.accuracy,
                "%"
              )}

              {metric(
                "Correct",
                result.attempt_a.correct,
                result.attempt_b.correct,
                result.delta.correct
              )}

              {metric(
                "Wrong",
                result.attempt_a.wrong,
                result.attempt_b.wrong,
                result.delta.wrong
              )}

              {metric(
                "Skipped",
                result.attempt_a.skipped,
                result.attempt_b.skipped,
                result.delta.skipped
              )}

              {metric(
                "Time",
                minutes(result.attempt_a.duration_sec),
                minutes(result.attempt_b.duration_sec),
                Math.round(Number(result.delta.duration_sec ?? 0) / 60),
                " min"
              )}
            </div>

            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                The comparison is calculated from your stored completed test
                attempts. No estimated or placeholder performance data is used.
              </CardContent>
            </Card>
          </>
        )}

        {!loading && !attempts.length && (
          <Card>
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              No completed mock tests are available yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
