import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Play,
  Target,
  Trophy,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/daily-practice",
)({
  component: DailyPractice,
});

type PracticeSet = {
  practice_set_id: string;
  practice_date: string;
  exam: string;
  title: string;
  description: string | null;
  target_questions: number;
  duration_minutes: number | null;
  difficulty: string | null;
  attempt_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  started_at: string | null;
  completed_at: string | null;
  questions_attempted: number;
  correct_answers: number;
  total_questions: number;
  time_spent_seconds: number;
  question_count: number;
};

type StreakDay = {
  practice_date: string;
  status: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy: number;
};

function DailyPractice() {
  const [exam, setExam] = React.useState<
    "JEE_MAIN" | "JEE_ADVANCED"
  >("JEE_MAIN");

  const [practice, setPractice] =
    React.useState<PracticeSet | null>(null);

  const [history, setHistory] =
    React.useState<StreakDay[]>([]);

  const [loading, setLoading] =
    React.useState(true);

  const [starting, setStarting] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const loadPractice = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const { data, error: practiceError } =
        await (supabase as any).rpc(
          "get_jee_daily_practice",
          {
            _date: today,
            _exam: exam,
          },
        );

      if (practiceError) {
        throw practiceError;
      }

      setPractice(
        data && data.length > 0
          ? normalizePractice(data[0])
          : null,
      );

      const {
        data: streakData,
        error: streakError,
      } = await (supabase as any).rpc(
        "get_jee_daily_practice_streak",
        {
          _exam: exam,
          _days: 60,
        },
      );

      if (streakError) {
        throw streakError;
      }

      setHistory(
        (streakData ?? []).map(
          (item: any) => ({
            practice_date: item.practice_date,
            status: item.status,
            questions_attempted: Number(
              item.questions_attempted ?? 0,
            ),
            correct_answers: Number(
              item.correct_answers ?? 0,
            ),
            accuracy: Number(
              item.accuracy ?? 0,
            ),
          }),
        ),
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ??
          "Unable to load daily practice.",
      );
    } finally {
      setLoading(false);
    }
  }, [exam]);

  React.useEffect(() => {
    loadPractice();
  }, [loadPractice]);

  const startPractice = async () => {
    if (!practice) return;

    setStarting(true);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "start_jee_daily_practice",
        {
          _practice_set_id:
            practice.practice_set_id,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to start practice.",
      );
      setStarting(false);
      return;
    }

    await loadPractice();

    setStarting(false);

    /*
     * The question-solving screen can be connected
     * to the PYQ practice engine next.
     */
  };

  const completedDays = history.filter(
    (day) => day.status === "COMPLETED",
  ).length;

  const currentStreak =
    calculateCurrentStreak(history);

  const averageAccuracy =
    history.length === 0
      ? 0
      : Math.round(
          history.reduce(
            (sum, day) =>
              sum + day.accuracy,
            0,
          ) / history.length,
        );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            window.history.back()
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="space-y-4">
          <Badge variant="outline">
            JEE Study System
          </Badge>

          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Daily JEE Practice
            </h1>

            <p className="mt-3 max-w-3xl text-muted-foreground">
              Build a consistent JEE practice habit with
              a focused daily question target.
            </p>
          </div>
        </div>

        {/* Exam selector */}
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-5">
            <Button
              variant={
                exam === "JEE_MAIN"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setExam("JEE_MAIN")
              }
            >
              JEE Main
            </Button>

            <Button
              variant={
                exam === "JEE_ADVANCED"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setExam("JEE_ADVANCED")
              }
            >
              JEE Advanced
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <Flame className="h-5 w-5" />
            }
            label="Current Streak"
            value={`${currentStreak} days`}
          />

          <StatCard
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Completed Days"
            value={String(completedDays)}
          />

          <StatCard
            icon={
              <Target className="h-5 w-5" />
            }
            label="Average Accuracy"
            value={`${averageAccuracy}%`}
          />

          <StatCard
            icon={
              <Trophy className="h-5 w-5" />
            }
            label="Practice History"
            value={`${history.length} days`}
          />
        </div>

        {/* Error */}
        {error && (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="flex min-h-56 items-center justify-center text-muted-foreground">
              Loading today's practice...
            </CardContent>
          </Card>
        )}

        {/* Today's practice */}
        {!loading && practice && (
          <TodayPractice
            practice={practice}
            starting={starting}
            onStart={startPractice}
          />
        )}

        {/* No practice */}
        {!loading && !practice && (
          <Card>
            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground" />

              <h2 className="mt-5 text-2xl font-semibold">
                No practice set for today
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                The Daily Practice system is ready, but
                an administrator has not published today's
                {exam === "JEE_MAIN"
                  ? " JEE Main"
                  : " JEE Advanced"}{" "}
                practice set yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {!loading && (
          <HistorySection history={history} />
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              How Daily Practice works
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            <Info
              number="01"
              title="Daily Target"
              text="Complete the questions assigned to today's practice set."
            />

            <Info
              number="02"
              title="Track Accuracy"
              text="Your correct answers and practice statistics are stored with your account."
            />

            <Info
              number="03"
              title="Build Consistency"
              text="Your completed practice days contribute to your practice history and streak."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TodayPractice({
  practice,
  starting,
  onStart,
}: {
  practice: PracticeSet;
  starting: boolean;
  onStart: () => Promise<void>;
}) {
  const total =
    practice.total_questions ||
    practice.question_count ||
    practice.target_questions;

  const progress =
    total === 0
      ? 0
      : Math.round(
          (practice.questions_attempted /
            total) *
            100,
        );

  const accuracy =
    practice.questions_attempted === 0
      ? 0
      : Math.round(
          (practice.correct_answers /
            practice.questions_attempted) *
            100,
        );

  const completed =
    practice.attempt_status ===
    "COMPLETED";

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>
                {practice.exam ===
                "JEE_ADVANCED"
                  ? "JEE Advanced"
                  : "JEE Main"}
              </Badge>

              {practice.difficulty && (
                <Badge variant="outline">
                  {practice.difficulty}
                </Badge>
              )}
            </div>

            <CardTitle className="mt-4 text-2xl">
              {practice.title}
            </CardTitle>

            {practice.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {practice.description}
              </p>
            )}
          </div>

          {completed && (
            <Badge className="w-fit">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            icon={
              <Target className="h-4 w-4" />
            }
            label="Questions"
            value={String(total)}
          />

          <Metric
            icon={
              <Clock3 className="h-4 w-4" />
            }
            label="Duration"
            value={
              practice.duration_minutes
                ? `${practice.duration_minutes} min`
                : "Flexible"
            }
          />

          <Metric
            icon={
              <CheckCircle2 className="h-4 w-4" />
            }
            label="Accuracy"
            value={`${accuracy}%`}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Today's progress
            </span>

            <span className="font-semibold">
              {practice.questions_attempted}/
              {total}
            </span>
          </div>

          <Progress value={progress} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            disabled={starting || completed}
            onClick={onStart}
          >
            <Play className="mr-2 h-4 w-4" />

            {starting
              ? "Starting..."
              : completed
                ? "Practice Completed"
                : practice.attempt_status ===
                    "IN_PROGRESS"
                  ? "Continue Practice"
                  : "Start Today's Practice"}
          </Button>

          {practice.questions_attempted >
            0 && (
            <p className="text-sm text-muted-foreground">
              {practice.correct_answers} correct out
              of{" "}
              {practice.questions_attempted} attempted
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistorySection({
  history,
}: {
  history: StreakDay[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Recent Practice History
          </CardTitle>

          <Badge variant="outline">
            Last 60 days
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {history.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-muted-foreground" />

            <p className="mt-3 text-sm text-muted-foreground">
              Your practice history will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, 30).map((day) => (
              <div
                key={day.practice_date}
                className="rounded-xl border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {formatDate(
                      day.practice_date,
                    )}
                  </span>

                  {day.status ===
                  "COMPLETED" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {day.questions_attempted}{" "}
                    attempted
                  </span>

                  <span>
                    {day.correct_answers} correct
                  </span>

                  <span>
                    {Math.round(day.accuracy)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="rounded-lg border p-2">
            {icon}
          </div>

          <span className="text-xl font-bold">
            {value}
          </span>
        </div>

        <p className="mt-4 text-sm font-medium">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

function Info({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border p-5">
      <Badge variant="outline">
        {number}
      </Badge>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function normalizePractice(
  item: any,
): PracticeSet {
  return {
    practice_set_id:
      item.practice_set_id,
    practice_date:
      item.practice_date,
    exam: item.exam,
    title: item.title,
    description:
      item.description ?? null,
    target_questions: Number(
      item.target_questions ?? 0,
    ),
    duration_minutes:
      item.duration_minutes == null
        ? null
        : Number(item.duration_minutes),
    difficulty:
      item.difficulty ?? null,
    attempt_status:
      item.attempt_status ??
      "NOT_STARTED",
    started_at:
      item.started_at ?? null,
    completed_at:
      item.completed_at ?? null,
    questions_attempted: Number(
      item.questions_attempted ?? 0,
    ),
    correct_answers: Number(
      item.correct_answers ?? 0,
    ),
    total_questions: Number(
      item.total_questions ?? 0,
    ),
    time_spent_seconds: Number(
      item.time_spent_seconds ?? 0,
    ),
    question_count: Number(
      item.question_count ?? 0,
    ),
  };
}

function calculateCurrentStreak(
  history: StreakDay[],
) {
  if (history.length === 0) {
    return 0;
  }

  const completedDates = new Set(
    history
      .filter(
        (item) =>
          item.status === "COMPLETED",
      )
      .map(
        (item) =>
          item.practice_date,
      ),
  );

  let streak = 0;

  const date = new Date();

  while (true) {
    const key = date
      .toISOString()
      .slice(0, 10);

    if (!completedDates.has(key)) {
      break;
    }

    streak += 1;

    date.setUTCDate(
      date.getUTCDate() - 1,
    );
  }

  return streak;
}

function formatDate(value: string) {
  const date = new Date(
    `${value}T00:00:00`,
  );

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}