import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Recommendation = {
  source_id: string;
  source_type:
    | "BACKLOG"
    | "REVISION"
    | "STUDY_TASK"
    | "MISTAKE";
  subject: string;
  title: string;
  minutes: number;
  priority_score: number;
};

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/study-now",
)({
  component: StudyNowPage,
});

function StudyNowPage() {
  const [availableMinutes, setAvailableMinutes] =
    useState(90);

  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await (
      supabase as any
    ).rpc("get_jee_next_study_recommendation", {
      _available_minutes: availableMinutes,
    });

    if (rpcError) {
      setError(rpcError.message);
      setRecommendations([]);
      setLoading(false);
      return;
    }

    if (!data?.success) {
      setError(
        data?.message ??
          "Unable to generate a study recommendation.",
      );
      setRecommendations([]);
      setLoading(false);
      return;
    }

    setRecommendations(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadRecommendations();
  }, [availableMinutes]);

  const totalRecommendedMinutes = useMemo(
    () =>
      recommendations.reduce(
        (total, item) =>
          total + item.minutes,
        0,
      ),
    [recommendations],
  );

  const progress =
    availableMinutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (totalRecommendedMinutes /
              availableMinutes) *
              100,
          ),
        );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
            >
              <Link to="/jee-predictor">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />

                <h1 className="text-2xl font-bold">
                  What Should I Study Now?
                </h1>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Your next study session, chosen from
                your actual preparation data.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={loadRecommendations}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              How much time do you have?
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120, 180].map(
                (minutes) => (
                  <Button
                    key={minutes}
                    variant={
                      availableMinutes === minutes
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setAvailableMinutes(minutes)
                    }
                  >
                    {minutes} min
                  </Button>
                ),
              )}
            </div>

            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-muted-foreground" />

              <div className="flex-1">
                <div className="mb-2 flex justify-between text-sm">
                  <span>
                    Recommended session
                  </span>

                  <span className="font-medium">
                    {totalRecommendedMinutes} /{" "}
                    {availableMinutes} min
                  </span>
                </div>

                <Progress value={progress} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Tasks"
            value={recommendations.length}
            icon={
              <Target className="h-5 w-5" />
            }
          />

          <StatCard
            label="Study Time"
            value={`${totalRecommendedMinutes} min`}
            icon={
              <Clock3 className="h-5 w-5" />
            }
          />

          <StatCard
            label="Sources"
            value={
              new Set(
                recommendations.map(
                  (item) => item.source_type,
                ),
              ).size
            }
            icon={
              <Brain className="h-5 w-5" />
            }
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Your Study Session
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Building your study session...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10" />

                <h2 className="text-lg font-semibold">
                  Nothing urgent right now
                </h2>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Your current backlog, revisions,
                  study tasks, and unresolved mistakes
                  don't have a suitable task for this
                  time window.
                </p>

                <Button
                  asChild
                  variant="outline"
                  className="mt-5"
                >
                  <Link to="/jee-predictor/backlog">
                    Review Backlog
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map(
                  (item, index) => (
                    <RecommendationCard
                      key={`${item.source_type}-${item.source_id}`}
                      item={item}
                      index={index}
                    />
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecommendationCard({
  item,
  index,
}: {
  item: Recommendation;
  index: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-semibold">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {item.subject}
            </Badge>

            <Badge variant="outline">
              {formatSource(item.source_type)}
            </Badge>

            <Badge variant="outline">
              {item.minutes} min
            </Badge>
          </div>

          <h3 className="font-semibold">
            {item.title}
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Recommendation priority:{" "}
            {item.priority_score}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link
            to={
              item.source_type === "BACKLOG"
                ? "/jee-predictor/backlog"
                : item.source_type ===
                    "REVISION"
                  ? "/jee-predictor/revision"
                  : item.source_type ===
                      "MISTAKE"
                    ? "/jee-predictor/mistake-book"
                    : "/jee-predictor/study-planner"
            }
          >
            Open
          </Link>
        </Button>
      </div>
    </div>
  );
}
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold">
              {value}
            </p>
          </div>

          <div className="rounded-xl border p-2.5">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSource(
  source: Recommendation["source_type"],
) {
  switch (source) {
    case "BACKLOG":
      return "Backlog";

    case "REVISION":
      return "Revision";

    case "STUDY_TASK":
      return "Study Planner";

    case "MISTAKE":
      return "Mistake Book";

    default:
      return source;
  }
}
<Link
  to="/jee-predictor/study-now"
  className="group block rounded-xl border bg-card p-5 transition-colors hover:bg-accent"
>
  <div className="flex items-center gap-3">
    <div className="rounded-lg bg-primary/10 p-3">
      <Sparkles className="h-6 w-6 text-primary" />
    </div>

    <div>
      <h3 className="font-semibold">
        What Should I Study Now?
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Get your next study tasks based on backlog,
        revision, mistakes and planned work.
      </p>
    </div>
  </div>
</Link>