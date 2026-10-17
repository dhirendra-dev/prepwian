import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/study-planner",
)({
  component: StudyPlanner,
});

type StudyPlan = {
  id: string;
  plan_date: string;
  title: string;
  target_hours: number;
  notes: string | null;
};

type StudyTask = {
  id: string;
  plan_id: string;
  subject: string;
  title: string;
  chapter_id: string | null;
  topic_id: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  planned_minutes: number;
  completed_minutes: number;
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "SKIPPED";
  notes: string | null;
  task_order: number;
};

const SUBJECTS = [
  "PHYSICS",
  "CHEMISTRY",
  "MATHEMATICS",
  "OTHER",
];

function StudyPlanner() {
  const [selectedDate, setSelectedDate] =
    React.useState(getToday());

  const [plan, setPlan] =
    React.useState<StudyPlan | null>(null);

  const [tasks, setTasks] =
    React.useState<StudyTask[]>([]);

  const [loading, setLoading] =
    React.useState(true);

  const [saving, setSaving] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const [showPlanForm, setShowPlanForm] =
    React.useState(false);

  const [showTaskForm, setShowTaskForm] =
    React.useState(false);

  const [planForm, setPlanForm] =
    React.useState({
      title: "Daily Study Plan",
      targetHours: "6",
      notes: "",
    });

  const [taskForm, setTaskForm] =
    React.useState({
      subject: "PHYSICS",
      title: "",
      priority: "MEDIUM",
      plannedMinutes: "60",
      notes: "",
    });

  const loadPlan = React.useCallback(
    async () => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } =
        await (supabase as any).rpc(
          "get_jee_study_plan",
          {
            _plan_date: selectedDate,
          },
        );

      if (rpcError) {
        console.error(rpcError);
        setError(rpcError.message);
        setPlan(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      setPlan(
        data?.plan
          ? {
              ...data.plan,
              target_hours: Number(
                data.plan.target_hours ?? 0,
              ),
            }
          : null,
      );

      setTasks(
        (data?.tasks ?? []).map(
          (task: any) => ({
            ...task,
            planned_minutes: Number(
              task.planned_minutes ?? 0,
            ),
            completed_minutes: Number(
              task.completed_minutes ?? 0,
            ),
            task_order: Number(
              task.task_order ?? 0,
            ),
          }),
        ),
      );

      setLoading(false);
    },
    [selectedDate],
  );

  React.useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const createPlan = async () => {
    setSaving(true);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "create_jee_study_plan",
        {
          _plan_date: selectedDate,
          _title:
            planForm.title.trim() ||
            "Daily Study Plan",
          _target_hours: Number(
            planForm.targetHours || 0,
          ),
          _notes:
            planForm.notes.trim() ||
            null,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to create study plan.",
      );
      setSaving(false);
      return;
    }

    setShowPlanForm(false);
    await loadPlan();
    setSaving(false);
  };

  const addTask = async () => {
    if (!plan) {
      setError(
        "Create the study plan first.",
      );
      return;
    }

    if (!taskForm.title.trim()) {
      setError(
        "Enter a study task title.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "add_jee_study_task",
        {
          _plan_id: plan.id,
          _subject: taskForm.subject,
          _title: taskForm.title.trim(),
          _chapter_id: null,
          _topic_id: null,
          _priority: taskForm.priority,
          _planned_minutes: Number(
            taskForm.plannedMinutes || 0,
          ),
          _notes:
            taskForm.notes.trim() ||
            null,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to add study task.",
      );
      setSaving(false);
      return;
    }

    setTaskForm({
      subject: "PHYSICS",
      title: "",
      priority: "MEDIUM",
      plannedMinutes: "60",
      notes: "",
    });

    setShowTaskForm(false);
    await loadPlan();
    setSaving(false);
  };

  const updateTask = async (
    task: StudyTask,
    status: StudyTask["status"],
  ) => {
    setSaving(true);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "update_jee_study_task",
        {
          _task_id: task.id,
          _status: status,
          _completed_minutes:
            status === "COMPLETED"
              ? task.planned_minutes
              : task.completed_minutes,
          _priority: null,
          _notes: null,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to update study task.",
      );
      setSaving(false);
      return;
    }

    await loadPlan();
    setSaving(false);
  };

  const totalMinutes =
    tasks.reduce(
      (sum, task) =>
        sum + task.planned_minutes,
      0,
    );

  const completedMinutes =
    tasks.reduce(
      (sum, task) =>
        sum + task.completed_minutes,
      0,
    );

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "COMPLETED",
    ).length;

  const progress =
    totalMinutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (completedMinutes /
              totalMinutes) *
              100,
          ),
        );

  const targetMinutes =
    (plan?.target_hours ?? 0) * 60;

  const targetProgress =
    targetMinutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (completedMinutes /
              targetMinutes) *
              100,
          ),
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

        <div>
          <Badge variant="outline">
            JEE Study System
          </Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            Personal Study Planner
          </h1>

          <p className="mt-3 max-w-3xl text-muted-foreground">
            Plan your own daily JEE study work and track
            what you actually complete.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Planning date
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />

                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) =>
                      setSelectedDate(
                        e.target.value,
                      )
                    }
                    className="w-auto"
                  />
                </div>
              </div>

              <Button
                onClick={() =>
                  setShowPlanForm(
                    (current) => !current,
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {plan
                  ? "Edit Daily Plan"
                  : "Create Daily Plan"}
              </Button>
            </div>

            {showPlanForm && (
              <div className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-2">
                <Input
                  placeholder="Plan title"
                  value={planForm.title}
                  onChange={(e) =>
                    setPlanForm(
                      (current) => ({
                        ...current,
                        title:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Target hours"
                  value={planForm.targetHours}
                  onChange={(e) =>
                    setPlanForm(
                      (current) => ({
                        ...current,
                        targetHours:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Textarea
                  className="md:col-span-2"
                  placeholder="Notes for today's plan..."
                  value={planForm.notes}
                  onChange={(e) =>
                    setPlanForm(
                      (current) => ({
                        ...current,
                        notes:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Button
                  disabled={saving}
                  onClick={createPlan}
                >
                  {saving
                    ? "Saving..."
                    : "Save Daily Plan"}
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

        {loading && (
          <Card>
            <CardContent className="flex min-h-48 items-center justify-center text-muted-foreground">
              Loading your study plan...
            </CardContent>
          </Card>
        )}

        {!loading && !plan && (
          <Card>
            <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
              <Target className="h-10 w-10 text-muted-foreground" />

              <h2 className="mt-4 text-xl font-semibold">
                No study plan yet
              </h2>

              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Create today's plan and then add the
                Physics, Chemistry and Mathematics tasks
                you want to complete.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && plan && (
          <>
            {/* Plan overview */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      {plan.title}
                    </CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDisplayDate(
                        plan.plan_date,
                      )}
                    </p>
                  </div>

                  <Badge>
                    Target:{" "}
                    {plan.target_hours} hours
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {plan.notes && (
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {plan.notes}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricCard
                    icon={
                      <Clock3 className="h-5 w-5" />
                    }
                    label="Planned"
                    value={`${Math.round(
                      totalMinutes / 60,
                    )}h ${totalMinutes % 60}m`}
                  />

                  <MetricCard
                    icon={
                      <CheckCircle2 className="h-5 w-5" />
                    }
                    label="Completed"
                    value={`${Math.round(
                      completedMinutes / 60,
                    )}h ${completedMinutes % 60}m`}
                  />

                  <MetricCard
                    icon={
                      <Target className="h-5 w-5" />
                    }
                    label="Tasks Complete"
                    value={`${completedTasks}/${tasks.length}`}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Daily target progress
                    </span>

                    <span className="font-semibold">
                      {targetProgress}%
                    </span>
                  </div>

                  <Progress
                    value={targetProgress}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Task completion
                    </span>

                    <span className="font-semibold">
                      {progress}%
                    </span>
                  </div>

                  <Progress
                    value={progress}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add task */}
            <Card>
              <CardContent className="p-5">
                <Button
                  variant={
                    showTaskForm
                      ? "secondary"
                      : "default"
                  }
                  onClick={() =>
                    setShowTaskForm(
                      (current) => !current,
                    )
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Study Task
                </Button>

                {showTaskForm && (
                  <div className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-2">
                    <select
                      value={
                        taskForm.subject
                      }
                      onChange={(e) =>
                        setTaskForm(
                          (current) => ({
                            ...current,
                            subject:
                              e.target.value,
                          }),
                        )
                      }
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      {SUBJECTS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        ),
                      )}
                    </select>

                    <select
                      value={
                        taskForm.priority
                      }
                      onChange={(e) =>
                        setTaskForm(
                          (current) => ({
                            ...current,
                            priority:
                              e.target.value,
                          }),
                        )
                      }
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="LOW">
                        Low Priority
                      </option>

                      <option value="MEDIUM">
                        Medium Priority
                      </option>

                      <option value="HIGH">
                        High Priority
                      </option>
                    </select>

                    <Input
                      placeholder="What will you study?"
                      value={taskForm.title}
                      onChange={(e) =>
                        setTaskForm(
                          (current) => ({
                            ...current,
                            title:
                              e.target.value,
                          }),
                        )
                      }
                    />

                    <Input
                      type="number"
                      min="0"
                      placeholder="Planned minutes"
                      value={
                        taskForm.plannedMinutes
                      }
                      onChange={(e) =>
                        setTaskForm(
                          (current) => ({
                            ...current,
                            plannedMinutes:
                              e.target.value,
                          }),
                        )
                      }
                    />

                    <Textarea
                      className="md:col-span-2"
                      placeholder="Optional task notes..."
                      value={taskForm.notes}
                      onChange={(e) =>
                        setTaskForm(
                          (current) => ({
                            ...current,
                            notes:
                              e.target.value,
                          }),
                        )
                      }
                    />

                    <Button
                      disabled={saving}
                      onClick={addTask}
                    >
                      {saving
                        ? "Adding..."
                        : "Add Task"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Today's Tasks
                  </CardTitle>

                  <Badge variant="outline">
                    {tasks.length} tasks
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {tasks.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center text-center">
                    <Clock3 className="h-9 w-9 text-muted-foreground" />

                    <p className="mt-3 text-sm text-muted-foreground">
                      No study tasks added yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map(
                      (task) => (
                        <StudyTaskCard
                          key={task.id}
                          task={task}
                          saving={saving}
                          onUpdate={
                            updateTask
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StudyTaskCard({
  task,
  saving,
  onUpdate,
}: {
  task: StudyTask;
  saving: boolean;
  onUpdate: (
    task: StudyTask,
    status: StudyTask["status"],
  ) => Promise<void>;
}) {
  const completed =
    task.status === "COMPLETED";

  const progress =
    task.planned_minutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (task.completed_minutes /
              task.planned_minutes) *
              100,
          ),
        );

  return (
    <div
      className={`rounded-xl border p-4 ${
        completed
          ? "bg-muted/20"
          : ""
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {task.subject}
            </Badge>

            <Badge variant="outline">
              {task.priority}
            </Badge>

            <Badge
              variant={
                completed
                  ? "default"
                  : task.status ===
                      "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
              }
            >
              {formatTaskStatus(
                task.status,
              )}
            </Badge>
          </div>

          <h3 className="mt-3 font-semibold">
            {task.title}
          </h3>

          {task.notes && (
            <p className="mt-1 text-sm text-muted-foreground">
              {task.notes}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Progress
              className="max-w-md flex-1"
              value={progress}
            />

            <span className="text-xs text-muted-foreground">
              {task.completed_minutes}/
              {task.planned_minutes} min
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!completed && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  onUpdate(
                    task,
                    "IN_PROGRESS",
                  )
                }
              >
                Start
              </Button>

              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  onUpdate(
                    task,
                    "COMPLETED",
                  )
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete
              </Button>
            </>
          )}

          {completed && (
            <Badge>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Done
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
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

function formatTaskStatus(
  status: StudyTask["status"],
) {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "IN_PROGRESS":
      return "In Progress";

    case "COMPLETED":
      return "Completed";

    case "SKIPPED":
      return "Skipped";

    default:
      return status;
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
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}