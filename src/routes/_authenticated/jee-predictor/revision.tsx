import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  Flame,
  Plus,
  RotateCcw,
  SkipForward,
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/revision",
)({
  component: RevisionSystem,
});

type RevisionTask = {
  id: string;
  chapter_id: string | null;
  chapter_name: string | null;
  topic_id: string | null;
  topic_name: string | null;
  subject: string | null;
  revision_type:
    | "CONCEPT"
    | "FORMULA"
    | "PYQ"
    | "MISTAKE";
  title: string;
  notes: string | null;
  scheduled_for: string;
  completed_at: string | null;
  revision_count: number;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
};

const REVISION_TYPES = [
  {
    value: "CONCEPT",
    label: "Concept",
  },
  {
    value: "FORMULA",
    label: "Formula",
  },
  {
    value: "PYQ",
    label: "PYQ",
  },
  {
    value: "MISTAKE",
    label: "Mistake",
  },
] as const;

const SUBJECTS = [
  "ALL",
  "PHYSICS",
  "CHEMISTRY",
  "MATHEMATICS",
];

function RevisionSystem() {
  const [tasks, setTasks] =
    React.useState<RevisionTask[]>([]);

  const [range, setRange] =
    React.useState<"TODAY" | "WEEK" | "MONTH">(
      "TODAY",
    );

  const [status, setStatus] =
    React.useState("PENDING");

  const [revisionType, setRevisionType] =
    React.useState("ALL");

  const [subject, setSubject] =
    React.useState("ALL");

  const [loading, setLoading] =
    React.useState(true);

  const [saving, setSaving] =
    React.useState<string | null>(null);

  const [error, setError] =
    React.useState<string | null>(null);

  const [showAdd, setShowAdd] =
    React.useState(false);

  const [newTask, setNewTask] = React.useState({
    chapterId: "",
    revisionType: "CONCEPT",
    title: "",
    notes: "",
    scheduledFor: getToday(),
  });

  const getDates = React.useCallback(() => {
    const today = new Date();

    const from = new Date(today);
    const to = new Date(today);

    if (range === "WEEK") {
      to.setDate(to.getDate() + 7);
    }

    if (range === "MONTH") {
      to.setDate(to.getDate() + 30);
    }

    return {
      from: formatDateForApi(from),
      to: formatDateForApi(to),
    };
  }, [range]);

  const loadTasks = React.useCallback(
    async () => {
      setLoading(true);
      setError(null);

      const { from, to } = getDates();

      const { data, error: rpcError } =
        await (supabase as any).rpc(
          "get_jee_revision_tasks",
          {
            _from_date: from,
            _to_date: to,
            _status:
              status === "ALL"
                ? null
                : status,
            _revision_type:
              revisionType === "ALL"
                ? null
                : revisionType,
          },
        );

      if (rpcError) {
        console.error(rpcError);
        setError(rpcError.message);
        setTasks([]);
      } else {
        setTasks(
          (data ?? []).map(
            (item: any) => ({
              ...item,
              revision_count: Number(
                item.revision_count ?? 0,
              ),
            }),
          ),
        );
      }

      setLoading(false);
    },
    [
      getDates,
      status,
      revisionType,
    ],
  );

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completeTask = async (
    task: RevisionTask,
  ) => {
    setSaving(task.id);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "complete_jee_revision_task",
        {
          _task_id: task.id,
          _notes: task.notes ?? null,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to complete revision.",
      );
      setSaving(null);
      return;
    }

    await loadTasks();
    setSaving(null);
  };

  const skipTask = async (
    task: RevisionTask,
  ) => {
    setSaving(task.id);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "skip_jee_revision_task",
        {
          _task_id: task.id,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to skip revision.",
      );
      setSaving(null);
      return;
    }

    await loadTasks();
    setSaving(null);
  };

  const createTask = async () => {
    if (
      !newTask.chapterId ||
      !newTask.title.trim()
    ) {
      setError(
        "Chapter ID and revision title are required.",
      );
      return;
    }

    setSaving("new");
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "create_jee_revision_task",
        {
          _chapter_id:
            newTask.chapterId,
          _topic_id: null,
          _revision_type:
            newTask.revisionType,
          _title:
            newTask.title.trim(),
          _notes:
            newTask.notes.trim() ||
            null,
          _scheduled_for:
            newTask.scheduledFor,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to create revision task.",
      );
      setSaving(null);
      return;
    }

    setNewTask({
      chapterId: "",
      revisionType: "CONCEPT",
      title: "",
      notes: "",
      scheduledFor: getToday(),
    });

    setShowAdd(false);
    await loadTasks();
    setSaving(null);
  };

  const visibleTasks = tasks.filter(
    (task) =>
      subject === "ALL" ||
      task.subject === subject,
  );

  const pendingCount =
    visibleTasks.filter(
      (task) =>
        task.status === "PENDING",
    ).length;

  const completedCount =
    visibleTasks.filter(
      (task) =>
        task.status === "COMPLETED",
    ).length;

  const skippedCount =
    visibleTasks.filter(
      (task) =>
        task.status === "SKIPPED",
    ).length;

  const total =
    visibleTasks.length;

  const completionPercent =
    total === 0
      ? 0
      : Math.round(
          (completedCount / total) *
            100,
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
              Revision System
            </h1>

            <p className="mt-3 max-w-3xl text-muted-foreground">
              Keep concepts, formulas, PYQs and mistakes
              in a structured revision queue.
            </p>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={
                  range === "TODAY"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setRange("TODAY")
                }
              >
                Today
              </Button>

              <Button
                variant={
                  range === "WEEK"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setRange("WEEK")
                }
              >
                Next 7 Days
              </Button>

              <Button
                variant={
                  range === "MONTH"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setRange("MONTH")
                }
              >
                Next 30 Days
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "PENDING",
                "COMPLETED",
                "SKIPPED",
                "ALL",
              ].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={
                    status === item
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() =>
                    setStatus(item)
                  }
                >
                  {formatStatus(item)}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "ALL",
                ...REVISION_TYPES.map(
                  (item) => item.value,
                ),
              ].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={
                    revisionType === item
                      ? "secondary"
                      : "outline"
                  }
                  onClick={() =>
                    setRevisionType(item)
                  }
                >
                  {formatRevisionType(item)}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={
                    subject === item
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setSubject(item)
                  }
                >
                  {item === "ALL"
                    ? "All Subjects"
                    : item}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <Target className="h-5 w-5" />
            }
            label="Total"
            value={total}
          />

          <StatCard
            icon={
              <Clock3 className="h-5 w-5" />
            }
            label="Pending"
            value={pendingCount}
          />

          <StatCard
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Completed"
            value={completedCount}
          />

          <StatCard
            icon={
              <Flame className="h-5 w-5" />
            }
            label="Skipped"
            value={skippedCount}
          />
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Revision Progress
              </CardTitle>

              <span className="font-semibold">
                {completionPercent}%
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Progress
              value={completionPercent}
            />

            <p className="mt-3 text-sm text-muted-foreground">
              {completedCount} of {total} revision
              tasks completed.
            </p>
          </CardContent>
        </Card>

        {/* Add task */}
        <Card>
          <CardContent className="p-5">
            <Button
              variant={
                showAdd
                  ? "secondary"
                  : "default"
              }
              onClick={() =>
                setShowAdd(
                  (current) => !current,
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Revision Task
            </Button>

            {showAdd && (
              <div className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-2">
                <Input
                  placeholder="Chapter UUID"
                  value={newTask.chapterId}
                  onChange={(e) =>
                    setNewTask(
                      (current) => ({
                        ...current,
                        chapterId:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Input
                  placeholder="Revision title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask(
                      (current) => ({
                        ...current,
                        title:
                          e.target.value,
                      }),
                    )
                  }
                />

                <select
                  value={
                    newTask.revisionType
                  }
                  onChange={(e) =>
                    setNewTask(
                      (current) => ({
                        ...current,
                        revisionType:
                          e.target.value,
                      }),
                    )
                  }
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {REVISION_TYPES.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ),
                  )}
                </select>

                <Input
                  type="date"
                  value={
                    newTask.scheduledFor
                  }
                  onChange={(e) =>
                    setNewTask(
                      (current) => ({
                        ...current,
                        scheduledFor:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Textarea
                  className="md:col-span-2"
                  placeholder="Optional revision notes..."
                  value={newTask.notes}
                  onChange={(e) =>
                    setNewTask(
                      (current) => ({
                        ...current,
                        notes:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Button
                  disabled={
                    saving === "new"
                  }
                  onClick={createTask}
                >
                  {saving === "new"
                    ? "Creating..."
                    : "Create Revision"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
            <CardContent className="flex min-h-48 items-center justify-center text-muted-foreground">
              Loading revision queue...
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading &&
          visibleTasks.length === 0 && (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <RotateCcw className="h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No revision tasks
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Your revision queue is empty for the
                  selected filters.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Task list */}
        {!loading &&
          visibleTasks.length > 0 && (
            <div className="space-y-4">
              {visibleTasks.map(
                (task) => (
                  <RevisionCard
                    key={task.id}
                    task={task}
                    saving={
                      saving === task.id
                    }
                    onComplete={
                      completeTask
                    }
                    onSkip={skipTask}
                  />
                ),
              )}
            </div>
          )}
      </div>
    </div>
  );
}

function RevisionCard({
  task,
  saving,
  onComplete,
  onSkip,
}: {
  task: RevisionTask;
  saving: boolean;
  onComplete: (
    task: RevisionTask,
  ) => Promise<void>;
  onSkip: (
    task: RevisionTask,
  ) => Promise<void>;
}) {
  const isCompleted =
    task.status === "COMPLETED";

  const isSkipped =
    task.status === "SKIPPED";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {task.subject && (
                <Badge variant="secondary">
                  {task.subject}
                </Badge>
              )}

              <Badge variant="outline">
                {formatRevisionType(
                  task.revision_type,
                )}
              </Badge>

              <Badge
                variant={
                  isCompleted
                    ? "default"
                    : isSkipped
                      ? "outline"
                      : "destructive"
                }
              >
                {formatStatus(
                  task.status,
                )}
              </Badge>
            </div>

            <h2 className="mt-3 text-lg font-semibold">
              {task.title}
            </h2>

            {task.chapter_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {task.chapter_name}
                {task.topic_name
                  ? ` • ${task.topic_name}`
                  : ""}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Scheduled:{" "}
                <strong className="text-foreground">
                  {formatDisplayDate(
                    task.scheduled_for,
                  )}
                </strong>
              </span>

              <span>
                Revisions:{" "}
                <strong className="text-foreground">
                  {task.revision_count}
                </strong>
              </span>
            </div>

            {task.notes && (
              <div className="mt-4 rounded-xl border bg-muted/20 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {task.notes}
                </p>
              </div>
            )}
          </div>

          {!isCompleted
 && (
  <div className="flex shrink-0 flex-wrap gap-2">
    <Button
      variant="outline"
      disabled={saving}
      onClick={() => onSkip(task)}
    >
      <SkipForward className="mr-2 h-4 w-4" />
      Skip
    </Button>

    <Button
      disabled={saving}
      onClick={() => onComplete(task)}
    >
      <CheckCircle2 className="mr-2 h-4 w-4" />
      {saving
        ? "Saving..."
        : "Complete"}
    </Button>
  </div>
)}
</div>
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
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="rounded-lg border p-2">
            {icon}
          </div>

          <span className="text-2xl font-bold">
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

function formatRevisionType(
  value: string,
) {
  switch (value) {
    case "CONCEPT":
      return "Concept";

    case "FORMULA":
      return "Formula";

    case "PYQ":
      return "PYQ";

    case "MISTAKE":
      return "Mistake";

    case "ALL":
      return "All Types";

    default:
      return value;
  }
}

function formatStatus(
  value: string,
) {
  switch (value) {
    case "PENDING":
      return "Pending";

    case "COMPLETED":
      return "Completed";

    case "SKIPPED":
      return "Skipped";

    case "ALL":
      return "All Status";

    default:
      return value;
  }
}

function getToday() {
  return formatDateForApi(
    new Date(),
  );
}

function formatDateForApi(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(
  value: string,
) {
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