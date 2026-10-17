import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Target,
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
  "/_authenticated/jee-predictor/backlog",
)({
  component: BacklogManager,
});

type BacklogItem = {
  id: string;
  subject: string;
  title: string;
  chapter_id: string | null;
  chapter_name: string | null;
  topic_id: string | null;
  topic_name: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimated_minutes: number;
  completed_minutes: number;
  deadline: string | null;
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "SKIPPED";
  notes: string | null;
};

const SUBJECTS = [
  "ALL",
  "PHYSICS",
  "CHEMISTRY",
  "MATHEMATICS",
  "OTHER",
];

function BacklogManager() {
  const [items, setItems] =
    React.useState<BacklogItem[]>([]);

  const [status, setStatus] =
    React.useState("ALL");

  const [subject, setSubject] =
    React.useState("ALL");

  const [loading, setLoading] =
    React.useState(true);

  const [saving, setSaving] =
    React.useState<string | null>(null);

  const [error, setError] =
    React.useState<string | null>(null);

  const [showForm, setShowForm] =
    React.useState(false);

  const [form, setForm] = React.useState({
    subject: "PHYSICS",
    title: "",
    priority: "MEDIUM",
    estimatedMinutes: "60",
    deadline: "",
    notes: "",
  });

  const loadBacklog =
    React.useCallback(async () => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } =
        await (supabase as any).rpc(
          "get_jee_backlog",
          {
            _status:
              status === "ALL"
                ? null
                : status,
            _subject:
              subject === "ALL"
                ? null
                : subject,
            _priority: null,
          },
        );

      if (rpcError) {
        console.error(rpcError);
        setError(rpcError.message);
        setItems([]);
      } else {
        setItems(
          (data ?? []).map(
            (item: any) => ({
              ...item,
              estimated_minutes:
                Number(
                  item.estimated_minutes ??
                    0,
                ),
              completed_minutes:
                Number(
                  item.completed_minutes ??
                    0,
                ),
            }),
          ),
        );
      }

      setLoading(false);
    }, [status, subject]);

  React.useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  const addItem = async () => {
    if (!form.title.trim()) {
      setError(
        "Enter a backlog item title.",
      );
      return;
    }

    setSaving("new");
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "add_jee_backlog_item",
        {
          _subject: form.subject,
          _title: form.title.trim(),
          _chapter_id: null,
          _topic_id: null,
          _priority: form.priority,
          _estimated_minutes:
            Number(
              form.estimatedMinutes ||
                0,
            ),
          _deadline:
            form.deadline || null,
          _notes:
            form.notes.trim() ||
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
          "Unable to add backlog item.",
      );
      setSaving(null);
      return;
    }

    setForm({
      subject: "PHYSICS",
      title: "",
      priority: "MEDIUM",
      estimatedMinutes: "60",
      deadline: "",
      notes: "",
    });

    setShowForm(false);

    await loadBacklog();
    setSaving(null);
  };

  const updateStatus = async (
    item: BacklogItem,
    nextStatus: BacklogItem["status"],
  ) => {
    setSaving(item.id);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "update_jee_backlog_item",
        {
          _item_id: item.id,
          _status: nextStatus,
          _completed_minutes:
            nextStatus === "COMPLETED"
              ? item.estimated_minutes
              : item.completed_minutes,
          _priority: null,
          _deadline: null,
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
          "Unable to update backlog item.",
      );
      setSaving(null);
      return;
    }

    await loadBacklog();
    setSaving(null);
  };

  const totalMinutes =
    items.reduce(
      (sum, item) =>
        sum + item.estimated_minutes,
      0,
    );

  const completedMinutes =
    items.reduce(
      (sum, item) =>
        sum + item.completed_minutes,
      0,
    );

  const completedCount =
    items.filter(
      (item) =>
        item.status === "COMPLETED",
    ).length;

  const highPriorityCount =
    items.filter(
      (item) =>
        item.priority === "HIGH" &&
        item.status !== "COMPLETED",
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
            JEE Backlog Manager
          </h1>

          <p className="mt-3 max-w-3xl text-muted-foreground">
            Capture unfinished work, set priorities and
            steadily clear your JEE backlog.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              {[
                "ALL",
                "PENDING",
                "IN_PROGRESS",
                "COMPLETED",
                "SKIPPED",
              ].map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={
                    status === value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setStatus(value as "COMPLETED" | "IN_PROGRESS" | "PENDING" | "SKIPPED")
                  }
                >
                  {formatStatus(value as Parameters<typeof formatStatus>[0])}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(
                (value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={
                      subject === value
                        ? "secondary"
                        : "outline"
                    }
                    onClick={() =>
                      setSubject(value)
                    }
                  >
                    {value === "ALL"
                      ? "All Subjects"
                      : value}
                  </Button>
                ),
              )}
            </div>
          </CardContent>
        </Card>
        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <Target className="h-5 w-5" />
            }
            label="Backlog Items"
            value={items.length}
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
              <Clock3 className="h-5 w-5" />
            }
            label="Estimated Time"
            value={`${Math.round(
              totalMinutes / 60,
            )}h`}
          />

          <StatCard
            icon={
              <Target className="h-5 w-5" />
            }
            label="High Priority"
            value={highPriorityCount}
          />
        </div>

        {/* Overall progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Backlog Progress
              </CardTitle>

              <span className="font-semibold">
                {progress}%
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Progress value={progress} />

            <p className="mt-3 text-sm text-muted-foreground">
              {completedMinutes} of{" "}
              {totalMinutes} planned minutes completed.
            </p>
          </CardContent>
        </Card>

        {/* Add backlog item */}
        <Card>
          <CardContent className="p-5">
            <Button
              variant={
                showForm
                  ? "secondary"
                  : "default"
              }
              onClick={() =>
                setShowForm(
                  (current) => !current,
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Backlog Item
            </Button>

            {showForm && (
              <div className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-2">
                <select
                  value={form.subject}
                  onChange={(e) =>
                    setForm(
                      (current) => ({
                        ...current,
                        subject:
                          e.target.value,
                      }),
                    )
                  }
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {SUBJECTS.filter(
                    (item) =>
                      item !== "ALL",
                  ).map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm(
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
                  placeholder="What is pending?"
                  value={form.title}
                  onChange={(e) =>
                    setForm(
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
                  placeholder="Estimated minutes"
                  value={
                    form.estimatedMinutes
                  }
                  onChange={(e) =>
                    setForm(
                      (current) => ({
                        ...current,
                        estimatedMinutes:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm(
                      (current) => ({
                        ...current,
                        deadline:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Textarea
                  placeholder="Optional notes..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm(
                      (current) => ({
                        ...current,
                        notes:
                          e.target.value,
                      }),
                    )
                  }
                />

                <Button
                  disabled={saving === "new"}
                  onClick={addItem}
                >
                  {saving === "new"
                    ? "Adding..."
                    : "Add to Backlog"}
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
              Loading backlog...
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading &&
          items.length === 0 && (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  Backlog is clear
                </h2>

                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Nothing matches your current filters.
                  Add unfinished JEE work whenever you need
                  to track it.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Backlog list */}
        {!loading &&
          items.length > 0 && (
            <div className="space-y-4">
              {items.map((item) => (
                <BacklogCard
                  key={item.id}
                  item={item}
                  saving={saving === item.id}
                  onUpdate={updateStatus}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function BacklogCard({
  item,
  saving,
  onUpdate,
}: {
  item: BacklogItem;
  saving: boolean;
  onUpdate: (
    item: BacklogItem,
    status: BacklogItem["status"],
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

  const completed =
    item.status === "COMPLETED";

  const overdue =
    item.deadline &&
    !completed &&
    item.deadline <
      new Date()
        .toISOString()
        .slice(0, 10);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
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

              <Badge
                variant={
                  completed
                    ? "default"
                    : "outline"
                }
              >
                {formatStatus(
                  item.status,
                )}
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

            {item.chapter_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.chapter_name}
                {item.topic_name
                  ? ` • ${item.topic_name}`
                  : ""}
              </p>
            )}

            {item.notes && (
              <p className="mt-2 text-sm text-muted-foreground">
                {item.notes}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Progress
                className="max-w-md flex-1"
                value={progress}
              />

              <span className="text-xs text-muted-foreground">
                {item.completed_minutes}/
                {item.estimated_minutes} min
              </span>
            </div>

            {item.deadline && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Deadline:{" "}
                {formatDisplayDate(
                  item.deadline,
                )}
              </div>
            )}
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
                      item,
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
                      item,
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
      </CardContent>
    </Card>
  );
}
function StatCard({
  label,
  value,
  icon,
  helper,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  helper?: string;
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

            {helper && (
              <p className="mt-1 text-xs text-muted-foreground">
                {helper}
              </p>
            )}
          </div>

          <div className="rounded-xl border p-2.5">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatStatus(
  status: BacklogItem["status"],
) {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";

    case "COMPLETED":
      return "Completed";

    case "SKIPPED":
      return "Skipped";

    default:
      return "Pending";
  }
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