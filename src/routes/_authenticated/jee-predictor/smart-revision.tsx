import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  RefreshCw,
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Suggestion = {
  id: string;
  subject: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimated_minutes: number;
  completed_minutes: number;
  deadline: string | null;
  chapter_id: string | null;
  topic_id: string | null;
  reason: string;
};

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/smart-revision",
)({
  component: SmartRevisionPage,
});

function SmartRevisionPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await (
      supabase as any
    ).rpc("get_smart_revision_suggestions", {
      _limit: 20,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setSuggestions(data?.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const totalMinutes = useMemo(
    () =>
      suggestions.reduce(
        (sum, item) =>
          sum + Math.max(
            0,
            item.estimated_minutes -
              item.completed_minutes,
          ),
        0,
      ),
    [suggestions],
  );

  const highPriorityCount = suggestions.filter(
    (item) => item.priority === "HIGH",
  ).length;

  const overdueCount = suggestions.filter(
    (item) =>
      item.deadline &&
      item.deadline <
        new Date().toISOString().slice(0, 10),
  ).length;

  const createRevision = async (
    item: Suggestion,
  ) => {
    setSaving(item.id);
    setError(null);

    const { data, error: rpcError } = await (
      supabase as any
    ).rpc("create_revision_from_backlog", {
      _backlog_id: item.id,
      _scheduled_for: scheduledDate,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(null);
      return;
    }

    if (!data?.success) {
      setError(
        data?.message ??
          "Unable to create revision task.",
      );
      setSaving(null);
      return;
    }

    setSuggestions((current) =>
      current.filter(
        (suggestion) =>
          suggestion.id !== item.id,
      ),
    );

    setSaving(null);
  };

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
                <Lightbulb className="h-5 w-5" />
                <h1 className="text-2xl font-bold">
                  Smart Revision
                </h1>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Turn your most important backlog items
                into revision tasks.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={loadSuggestions}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Suggestions"
            value={suggestions.length}
            icon={<Target className="h-5 w-5" />}
          />

          <StatCard
            label="Revision Time"
            value={`${totalMinutes} min`}
            icon={<Clock3 className="h-5 w-5" />}
          />

          <StatCard
            label="High Priority"
            value={highPriorityCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <StatCard
            label="Overdue"
            value={overdueCount}
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Revision Schedule
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">
                  Schedule created revision tasks for
                </label>

                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) =>
                    setScheduledDate(
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm md:max-w-xs"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Choose when the selected backlog items
                should appear in your Revision System.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              What should I revise?
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Analyzing your backlog...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10" />

                <h2 className="text-lg font-semibold">
                  Your backlog is under control
                </h2>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  There are no pending backlog items that
                  currently need a revision task.
                </p>

                <Button
                  asChild
                  variant="outline"
                  className="mt-5"
                >
                  <Link to="/jee-predictor/backlog">
                    Open Backlog
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((item) => (
                  <SuggestionCard
                    key={item.id}
                    item={item}
                    saving={saving === item.id}
                    onCreate={createRevision}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SuggestionCard({
  item,
  saving,
  onCreate,
}: {
  item: Suggestion;
  saving: boolean;
  onCreate: (
    item: Suggestion,
  ) => Promise<void>;
}) {
  const progress =
    item.estimated_minutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (item.completed_minutes /
              item.estimated_minutes) *
              100,
          ),
        );

  const overdue =
    item.deadline &&
    item.deadline <
      new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {item.subject}
              </Badge>

              <Badge
                variant={
                  item.priority === "HIGH"
                    ? "destructive"
                    : "outline"
                }
              >
                {item.priority}
              </Badge>

              {overdue && (
                <Badge variant="destructive">
                  Overdue
                </Badge>
              )}
            </div>

            <h2 className="mt-3 text-lg font-semibold">
              {item.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {item.reason}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Progress
                value={progress}
                className="max-w-md flex-1"
              />

              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {item.completed_minutes}/
                {item.estimated_minutes} min
              </span>
            </div>

            {item.deadline && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Deadline:{" "}
                {formatDisplayDate(item.deadline)}
              </div>
            )}
          </div>

          <Button
            disabled={saving}
            onClick={() => onCreate(item)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />

            {saving
              ? "Creating..."
              : "Add to Revision"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function formatDisplayDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
          {icon ? <div className="rounded-xl border p-2.5">{icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
