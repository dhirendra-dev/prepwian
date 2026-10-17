import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Filter,
  RefreshCcw,
  Save,
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
  "/_authenticated/jee-predictor/mistake-book",
)({
  component: MistakeBook,
});

type MistakeType =
  | "CONCEPTUAL"
  | "CALCULATION"
  | "SILLY"
  | "FORMULA"
  | "MISREAD"
  | "GUESS";

type Mistake = {
  id: string;
  question_id: string | null;
  subject: string;
  chapter_id: string | null;
  topic_id: string | null;
  mistake_type: MistakeType;
  learning_note: string | null;
  correct_approach: string | null;
  resolved: boolean;
  reattempt_count: number;
  last_reattempted_at: string | null;
  created_at: string;
  updated_at: string;
  question_text?: string | null;
  chapter_name?: string | null;
  topic_name?: string | null;
};

type Stats = {
  total: number;
  unresolved: number;
  resolved: number;
  conceptual: number;
  calculation: number;
  silly: number;
  formula: number;
  misread: number;
  guess: number;
};

const MISTAKE_TYPES: {
  value: MistakeType;
  label: string;
}[] = [
  { value: "CONCEPTUAL", label: "Conceptual" },
  { value: "CALCULATION", label: "Calculation" },
  { value: "SILLY", label: "Silly Mistake" },
  { value: "FORMULA", label: "Formula" },
  { value: "MISREAD", label: "Misread" },
  { value: "GUESS", label: "Wrong Guess" },
];

const SUBJECTS = [
  "ALL",
  "PHYSICS",
  "CHEMISTRY",
  "MATHEMATICS",
];

function MistakeBook() {
  const [mistakes, setMistakes] = React.useState<Mistake[]>([]);
  const [stats, setStats] = React.useState<Stats>({
    total: 0,
    unresolved: 0,
    resolved: 0,
    conceptual: 0,
    calculation: 0,
    silly: 0,
    formula: 0,
    misread: 0,
    guess: 0,
  });

  const [subject, setSubject] = React.useState("ALL");
  const [mistakeType, setMistakeType] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [showResolved, setShowResolved] = React.useState(true);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: mistakeData, error: mistakeError } =
        await (supabase as any)
          .from("jee_mistake_book")
          .select(`
            id,
            question_id,
            subject,
            chapter_id,
            topic_id,
            mistake_type,
            learning_note,
            correct_approach,
            resolved,
            reattempt_count,
            last_reattempted_at,
            created_at,
            updated_at,
            jee_pyq_questions (
              question_text
            ),
            jee_syllabus_chapters (
              chapter_name
            ),
            jee_syllabus_topics (
              topic_name
            )
          `)
          .order("updated_at", {
            ascending: false,
          });

      if (mistakeError) {
        throw mistakeError;
      }

      const normalized: Mistake[] = (
        mistakeData ?? []
      ).map((item: any) => ({
        ...item,
        question_text:
          item.jee_pyq_questions?.question_text ?? null,
        chapter_name:
          item.jee_syllabus_chapters?.chapter_name ?? null,
        topic_name:
          item.jee_syllabus_topics?.topic_name ?? null,
      }));

      setMistakes(normalized);

      const { data: statsData, error: statsError } =
        await (supabase as any).rpc(
          "get_jee_mistake_stats",
        );

      if (statsError) {
        throw statsError;
      }

      setStats(
        statsData ?? {
          total: 0,
          unresolved: 0,
          resolved: 0,
          conceptual: 0,
          calculation: 0,
          silly: 0,
          formula: 0,
          misread: 0,
          guess: 0,
        },
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ??
          "Unable to load your mistake book.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const updateMistake = async (
    id: string,
    changes: {
      mistakeType?: MistakeType;
      learningNote?: string;
      correctApproach?: string;
      resolved?: boolean;
    },
  ) => {
    setSaving(id);
    setError(null);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "update_jee_mistake",
        {
          _mistake_id: id,
          _mistake_type:
            changes.mistakeType ?? null,
          _learning_note:
            changes.learningNote ?? null,
          _correct_approach:
            changes.correctApproach ?? null,
          _resolved:
            changes.resolved ?? null,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to save mistake.",
      );
      setSaving(null);
      return;
    }

    await loadData();
    setSaving(null);
  };

  const reattempt = async (
    id: string,
  ) => {
    setSaving(id);

    const { data, error: rpcError } =
      await (supabase as any).rpc(
        "reattempt_jee_mistake",
        {
          _mistake_id: id,
        },
      );

    if (
      rpcError ||
      data?.success === false
    ) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to record reattempt.",
      );
      setSaving(null);
      return;
    }

    await loadData();
    setSaving(null);
  };

  const filteredMistakes =
    mistakes.filter((mistake) => {
      if (
        subject !== "ALL" &&
        mistake.subject !== subject
      ) {
        return false;
      }

      if (
        mistakeType !== "ALL" &&
        mistake.mistake_type !== mistakeType
      ) {
        return false;
      }

      if (
        !showResolved &&
        mistake.resolved
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search
          .trim()
          .toLowerCase();

        const text = [
          mistake.question_text,
          mistake.chapter_name,
          mistake.topic_name,
          mistake.learning_note,
          mistake.correct_approach,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!text.includes(q)) {
          return false;
        }
      }

      return true;
    });

  const unresolvedPercent =
    stats.total === 0
      ? 0
      : Math.round(
          (stats.unresolved /
            stats.total) *
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
        <div>
          <Badge variant="outline">
            JEE Study System
          </Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            Mistake Book
          </h1>

          <p className="mt-3 max-w-3xl text-muted-foreground">
            Turn your mistakes into revision material.
            Track why you got a question wrong and
            revisit it until the mistake is resolved.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Mistakes"
            value={stats.total}
            icon={
              <CircleAlert className="h-5 w-5" />
            }
          />

          <StatCard
            label="Unresolved"
            value={stats.unresolved}
            icon={
              <BookOpen className="h-5 w-5" />
            }
          />

          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <StatCard
            label="Reattempts"
            value={mistakes.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.reattempt_count ?? 0,
                ),
              0,
            )}
            icon={
              <RefreshCcw className="h-5 w-5" />
            }
          />
        </div>

        {/* Resolution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Mistake Resolution
              </CardTitle>

              <span className="text-sm font-semibold">
                {stats.resolved}/{stats.total}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Progress
              value={
                stats.total === 0
                  ? 0
                  : 100 -
                    unresolvedPercent
              }
            />

            <div className="mt-3 text-sm text-muted-foreground">
              {stats.resolved} mistakes resolved,
              {" "}
              {stats.unresolved} still need revision.
            </div>
          </CardContent>
        </Card>

        {/* Mistake distribution */}
        <Card>
          <CardHeader>
            <CardTitle>
              Mistake Pattern
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Pattern
                label="Conceptual"
                value={stats.conceptual}
              />
              <Pattern
                label="Calculation"
                value={stats.calculation}
              />
              <Pattern
                label="Silly"
                value={stats.silly}
              />
              <Pattern
                label="Formula"
                value={stats.formula}
              />
              <Pattern
                label="Misread"
                value={stats.misread}
              />
              <Pattern
                label="Wrong Guess"
                value={stats.guess}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Mistakes
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Search chapter, topic or note..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

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

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={
                  mistakeType === "ALL"
                    ? "secondary"
                    : "outline"
                }
                onClick={() =>
                  setMistakeType("ALL")
                }
              >
                All Types
              </Button>

              {MISTAKE_TYPES.map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={
                    mistakeType === item.value
                      ? "secondary"
                      : "outline"
                  }
                  onClick={() =>
                    setMistakeType(
                      item.value,
                    )
                  }
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <Button
              size="sm"
              variant={
                showResolved
                  ? "outline"
                  : "default"
              }
              onClick={() =>
                setShowResolved(
                  (current) => !current,
                )
              }
            >
              {showResolved
                ? "Showing Resolved"
                : "Hide Resolved"}
            </Button>
          </CardContent>
        </Card>

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
            <CardContent className="flex min-h-40 items-center justify-center text-muted-foreground">
              Loading your mistake book...
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading &&
          filteredMistakes.length === 0 && (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No mistakes found
                </h2>

                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Mistakes you save from your JEE
                  practice will appear here.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Mistake list */}
        {!loading &&
          filteredMistakes.length > 0 && (
            <div className="space-y-4">
              {filteredMistakes.map(
                (mistake) => (
                  <MistakeCard
                    key={mistake.id}
                    mistake={mistake}
                    saving={
                      saving === mistake.id
                    }
                    onUpdate={updateMistake}
                    onReattempt={reattempt}
                  />
                ),
              )}
            </div>
          )}
      </div>
    </div>
  );
}

function MistakeCard({
  mistake,
  saving,
  onUpdate,
  onReattempt,
}: {
  mistake: Mistake;
  saving: boolean;
  onUpdate: (
    id: string,
    changes: {
      mistakeType?: MistakeType;
      learningNote?: string;
      correctApproach?: string;
      resolved?: boolean;
    },
  ) => Promise<void>;
  onReattempt: (
    id: string,
  ) => Promise<void>;
}) {
  const [type, setType] =
    React.useState<MistakeType>(
      mistake.mistake_type,
    );

  const [learningNote, setLearningNote] =
    React.useState(
      mistake.learning_note ?? "",
    );

  const [correctApproach, setCorrectApproach] =
    React.useState(
      mistake.correct_approach ?? "",
    );

  React.useEffect(() => {
    setType(mistake.mistake_type);
    setLearningNote(
      mistake.learning_note ?? "",
    );
    setCorrectApproach(
      mistake.correct_approach ?? "",
    );
  }, [mistake]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {mistake.subject}
              </Badge>

              <Badge variant="outline">
                {formatMistakeType(
                  mistake.mistake_type,
                )}
              </Badge>

              {mistake.resolved && (
                <Badge>
                  Resolved
                </Badge>
              )}
            </div>

            <CardTitle className="mt-3">
              {mistake.chapter_name ??
                "Chapter not specified"}
            </CardTitle>

            {mistake.topic_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {mistake.topic_name}
              </p>
            )}
          </div>

          <Badge
            variant={
              mistake.resolved
                ? "default"
                : "destructive"
            }
          >
            {mistake.resolved
              ? "Resolved"
              : "Needs Revision"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {mistake.question_text && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Question
            </p>

            <p className="whitespace-pre-wrap text-sm leading-6">
              {mistake.question_text}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">
            Mistake type
          </label>

          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target
                  .value as MistakeType,
              )
            }
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {MISTAKE_TYPES.map(
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
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              What did I learn?
            </label>

            <Textarea
              className="mt-2 min-h-28"
              placeholder="Write what you learned from this mistake..."
              value={learningNote}
              onChange={(e) =>
                setLearningNote(
                  e.target.value,
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Correct approach
            </label>

            <Textarea
              className="mt-2 min-h-28"
              placeholder="Write the correct method or approach..."
              value={correctApproach}
              onChange={(e) =>
                setCorrectApproach(
                  e.target.value,
                )
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Reattempted{" "}
            <span className="font-semibold text-foreground">
              {mistake.reattempt_count}
            </span>{" "}
            time
            {mistake.reattempt_count === 1
              ? ""
              : "s"}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
  variant="outline"
  disabled={saving}
  onClick={() =>
    onReattempt(mistake.id)
  }
>
  <RefreshCcw className="mr-2 h-4 w-4" />
  Reattempted
</Button>

<Button
  variant="outline"
  disabled={saving}
  onClick={() =>
    onUpdate(mistake.id, {
      mistakeType: type,
      learningNote,
      correctApproach,
      resolved: mistake.resolved,
    })
  }
>
  <Save className="mr-2 h-4 w-4" />
  Save
</Button>

<Button
  disabled={saving}
  onClick={() =>
    onUpdate(mistake.id, {
      mistakeType: type,
      learningNote,
      correctApproach,
      resolved: !mistake.resolved,
    })
  }
>
  <CheckCircle2 className="mr-2 h-4 w-4" />
  {mistake.resolved
    ? "Mark Unresolved"
    : "Mark Resolved"}
</Button>
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
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
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

function Pattern({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <span className="text-sm">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

function formatMistakeType(
  type: MistakeType,
) {
  switch (type) {
    case "CONCEPTUAL":
      return "Conceptual";

    case "CALCULATION":
      return "Calculation";

    case "SILLY":
      return "Silly Mistake";

    case "FORMULA":
      return "Formula";

    case "MISREAD":
      return "Misread";

    case "GUESS":
      return "Wrong Guess";

    default:
      return type;
  }
}