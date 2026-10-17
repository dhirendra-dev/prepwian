import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  ListChecks,
  Plus,
  Trash2,
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

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/counselling-checklist",
)({
  component: CounsellingChecklist,
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  official_url: string | null;
  status: "PENDING" | "DONE" | "SKIPPED";
};

function CounsellingChecklist() {
  const { user } = Route.useRouteContext();
  const [year, setYear] = React.useState("2026");
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] =
    React.useState("");
  const [dueAt, setDueAt] = React.useState("");

  const checklist = useQuery({
    queryKey: ["jee-counselling-checklist", year],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_counselling_checklist",
        {
          _year: Number(year),
          _counselling: "JOSAA",
        },
      );

      if (error) throw error;

      return data as {
        success: boolean;
        tasks: Task[];
      };
    },
  });

  React.useEffect(() => {
    if (checklist.data?.tasks) {
      setTasks(checklist.data.tasks);
    }
  }, [checklist.data]);

  const addTask = async () => {
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from("jee_counselling_tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description:
          description.trim() || null,
        due_at: dueAt
          ? new Date(dueAt).toISOString()
          : null,
        year: Number(year),
        counselling: "JOSAA",
      })
      .select(
        "id, title, description, due_at, official_url, status",
      )
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setTasks((current) => [...current, data as Task]);
    setTitle("");
    setDescription("");
    setDueAt("");
  };

  const updateStatus = async (
    id: string,
    status: Task["status"],
  ) => {
    const { error } = await supabase
      .from("jee_counselling_tasks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, status }
          : task,
      ),
    );
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from("jee_counselling_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setTasks((current) =>
      current.filter((task) => task.id !== id),
    );
  };

  const pending = tasks.filter(
    (task) => task.status === "PENDING",
  ).length;

  const completed = tasks.filter(
    (task) => task.status === "DONE",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <ListChecks className="h-4 w-4" />
            Counselling workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Counselling Checklist
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Keep your counselling tasks, documents, deadlines
            and completion status in one place.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="2026">JoSAA 2026</option>
                <option value="2027">JoSAA 2027</option>
                <option value="2028">JoSAA 2028</option>
              </select>

              <Badge variant="secondary">
                {pending} pending
              </Badge>

              <Badge variant="outline">
                {completed} completed
              </Badge>

              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <a
                  href="https://josaa.nic.in/schedule/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Official JoSAA schedule
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a personal task</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) =>
                  setDueAt(e.target.value)
                }
              />

              <Button
                onClick={addTask}
                disabled={!title.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add task
              </Button>
            </div>
          </CardContent>
        </Card>

        {checklist.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading checklist...
            </CardContent>
          </Card>
        )}

        {!checklist.isLoading &&
          tasks.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  Your checklist is empty
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Add your counselling tasks above.
                </p>
              </CardContent>
            </Card>
          )}

        {tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateStatus}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">
                  Important
                </p>

                <p>
                  Deadlines can change. Always verify dates and
                  instructions against the official JoSAA notices
                  and schedule before taking action.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (
    id: string,
    status: Task["status"],
  ) => void;
  onDelete: (id: string) => void;
}) {
  const done = task.status === "DONE";

  return (
    <Card className={done ? "opacity-70" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                task.id,
                done ? "PENDING" : "DONE",
              )
            }
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
            aria-label={
              done
                ? "Mark as pending"
                : "Mark as complete"
            }
          >
            {done && (
              <Check className="h-4 w-4" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-semibold ${
                  done
                    ? "line-through"
                    : ""
                }`}
              >
                {task.title}
              </h3>

              <Badge
                variant={
                  done
                    ? "secondary"
                    : "outline"
                }
              >
                {done ? "Done" : "Pending"}
              </Badge>
            </div>

            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            {task.due_at && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />

                Due{" "}
                {new Date(
                  task.due_at,
                ).toLocaleString()}
              </div>
            )}

            {task.official_url && (
              <a
                href={task.official_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center text-sm underline underline-offset-4"
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Official source
              </a>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}