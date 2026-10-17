import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type ReviewData = {
  success?: boolean;
  period_start?: string;
  period_end?: string;
  performance?: {
    summary?: {
      tests?: number;
      avg_accuracy?: number;
      avg_score_pct?: number;
      correct?: number;
      wrong?: number;
      skipped?: number;
    };
  };
  weak_chapters?: {
    chapters?: Array<{
      subject: string;
      chapter: string;
      accuracy: number;
      weakness_score: number;
      weakness_level: string;
    }>;
  } | Array<{
    subject: string;
    chapter: string;
    accuracy: number;
    weakness_score: number;
    weakness_level: string;
  }>;
  revision?: {
    tasks?: Array<{
      title: string;
      status: string;
      revision_type: string;
      scheduled_for: string;
    }>;
  } | Array<any>;
};

export default function WeeklyReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    const { data: result, error: rpcError } = await (supabase as any).rpc(
      "get_jee_weekly_review"
    );

    if (rpcError) {
      setError(rpcError.message || "Unable to load weekly review.");
      setData(null);
    } else {
      setData(result as ReviewData);
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = data?.performance?.summary;

  const weak = useMemo(() => {
    const value: any = data?.weak_chapters;
    return Array.isArray(value) ? value : value?.chapters ?? [];
  }, [data]);

  const revision = useMemo(() => {
    const value: any = data?.revision;
    return Array.isArray(value) ? value : value?.tasks ?? [];
  }, [data]);

  const completedRevision = revision.filter(
    (item: any) => item.status === "COMPLETED"
  ).length;

  const revisionProgress = revision.length
    ? Math.round((completedRevision / revision.length) * 100)
    : 0;

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
                <h1 className="text-2xl font-bold">Weekly Study Review</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                A compact review of your recent tests, weak chapters and revisions.
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
            <CardContent className="p-5 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Tests reviewed</p>
                  <p className="mt-1 text-2xl font-bold">{summary?.tests ?? 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Average accuracy</p>
                  <p className="mt-1 text-2xl font-bold">
                    {Number(summary?.avg_accuracy ?? 0).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Average score</p>
                  <p className="mt-1 text-2xl font-bold">
                    {Number(summary?.avg_score_pct ?? 0).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Revision progress</p>
                  <p className="mt-1 text-2xl font-bold">{revisionProgress}%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border p-3">
                      <div className="font-bold">{summary?.correct ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <div className="font-bold">{summary?.wrong ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Wrong</div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <div className="font-bold">{summary?.skipped ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{Number(summary?.avg_accuracy ?? 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={Number(summary?.avg_accuracy ?? 0)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Weak chapters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weak.length ? (
                    weak.map((item: any, index: number) => (
                      <div
                        key={`${item.subject}-${item.chapter}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border p-3"
                      >
                        <div>
                          <div className="font-medium">{item.chapter}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.subject} · {Number(item.accuracy ?? 0).toFixed(1)}% accuracy
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.weakness_level === "HIGH"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {item.weakness_level}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No chapter-level weakness data is available yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Revision review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>
                      {completedRevision} of {revision.length} tasks completed
                    </span>
                    <span>{revisionProgress}%</span>
                  </div>
                  <Progress value={revisionProgress} />
                </div>

                {revision.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {revision.slice(0, 8).map((item: any, index: number) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="rounded-xl border p-3"
                      >
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.revision_type} · {item.scheduled_for}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No revision tasks scheduled for this review period.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
