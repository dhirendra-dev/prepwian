import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  RotateCcw,
  Save,
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/syllabus",
)({
  component: SyllabusTracker,
});

type Topic = {
  id: string;
  name: string;
  order: number;
};

type Chapter = {
  chapter_id: string;
  exam: string;
  subject: string;
  chapter_code: string | null;
  chapter_name: string;
  chapter_order: number;
  description: string | null;
  topics: Topic[];
  status: "NOT_STARTED" | "LEARNING" | "COMPLETED" | "REVISED";
  progress_percent: number;
  notes: string | null;
  last_studied_at: string | null;
};

const SUBJECTS = [
  { key: "ALL", label: "All Subjects" },
  { key: "PHYSICS", label: "Physics" },
  { key: "CHEMISTRY", label: "Chemistry" },
  { key: "MATHEMATICS", label: "Mathematics" },
];

const STATUS_OPTIONS = [
  {
    value: "NOT_STARTED",
    label: "Not Started",
  },
  {
    value: "LEARNING",
    label: "Learning",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "REVISED",
    label: "Revised",
  },
] as const;

function SyllabusTracker() {
  const [exam, setExam] = React.useState("BOTH");
  const [subject, setSubject] = React.useState("ALL");
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadSyllabus = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await (supabase as any).rpc(
      "get_jee_syllabus",
      {
        _exam: exam,
        _subject: subject === "ALL" ? null : subject,
      },
    );

    if (rpcError) {
      console.error(rpcError);
      setError(rpcError.message);
      setChapters([]);
      setLoading(false);
      return;
    }

    const normalized = ((data ?? []) as any[]).map((item) => ({
      ...item,
      topics: Array.isArray(item.topics) ? item.topics : [],
      progress_percent: Number(item.progress_percent ?? 0),
    }));

    setChapters(normalized);
    setLoading(false);
  }, [exam, subject]);

  React.useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  const updateChapter = async (
    chapter: Chapter,
    status: Chapter["status"],
    progressPercent: number,
    notes = chapter.notes ?? "",
  ) => {
    setSaving(chapter.chapter_id);
    setError(null);

    const { data, error: rpcError } = await (supabase as any).rpc(
      "upsert_jee_syllabus_progress",
      {
        _chapter_id: chapter.chapter_id,
        _status: status,
        _progress_percent: progressPercent,
        _notes: notes,
      },
    );

    if (rpcError || data?.success === false) {
      setError(
        rpcError?.message ??
          data?.message ??
          "Unable to save progress.",
      );
      setSaving(null);
      return;
    }

    setChapters((current) =>
      current.map((item) =>
        item.chapter_id === chapter.chapter_id
          ? {
              ...item,
              status,
              progress_percent: progressPercent,
              notes,
              last_studied_at: new Date().toISOString(),
            }
          : item,
      ),
    );

    setSaving(null);
  };

  const totalChapters = chapters.length;

  const completedChapters = chapters.filter(
    (chapter) =>
      chapter.status === "COMPLETED" ||
      chapter.status === "REVISED",
  ).length;

  const revisedChapters = chapters.filter(
    (chapter) => chapter.status === "REVISED",
  ).length;

  const learningChapters = chapters.filter(
    (chapter) => chapter.status === "LEARNING",
  ).length;

  const overallProgress =
    totalChapters === 0
      ? 0
      : Math.round(
          chapters.reduce(
            (sum, chapter) => sum + chapter.progress_percent,
            0,
          ) / totalChapters,
        );

  const subjectStats = SUBJECTS.filter(
    (item) => item.key !== "ALL",
  ).map((item) => {
    const subjectChapters = chapters.filter(
      (chapter) => chapter.subject === item.key,
    );

    const progress =
      subjectChapters.length === 0
        ? 0
        : Math.round(
            subjectChapters.reduce(
              (sum, chapter) => sum + chapter.progress_percent,
              0,
            ) / subjectChapters.length,
          );

    return {
      ...item,
      count: subjectChapters.length,
      progress,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Hero */}
        <div className="space-y-4">
          <Badge variant="outline">
            JEE Study System
          </Badge>

          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              JEE Syllabus Tracker
            </h1>

            <p className="mt-3 max-w-3xl text-muted-foreground">
              Track every chapter of your JEE preparation,
              from first learning to final revision.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={exam === "BOTH" ? "default" : "outline"}
                onClick={() => setExam("BOTH")}
              >
                Main + Advanced
              </Button>

              <Button
                variant={exam === "JEE_MAIN" ? "default" : "outline"}
                onClick={() => setExam("JEE_MAIN")}
              >
                JEE Main
              </Button>

              <Button
                variant={
                  exam === "JEE_ADVANCED"
                    ? "default"
                    : "outline"
                }
                onClick={() => setExam("JEE_ADVANCED")}
              >
                JEE Advanced
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((item) => (
                <Button
                  key={item.key}
                  size="sm"
                  variant={
                    subject === item.key
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() => setSubject(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Overall Progress"
            value={`${overallProgress}%`}
            description={`${totalChapters} chapters`}
          />

          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Completed"
            value={String(completedChapters)}
            description="Completed or revised"
          />

          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Learning"
            value={String(learningChapters)}
            description="Currently studying"
          />

          <StatCard
            icon={<RotateCcw className="h-5 w-5" />}
            label="Revised"
            value={String(revisedChapters)}
            description="Revision completed"
          />
        </div>

        {/* Overall progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preparation Progress</CardTitle>

              <span className="text-sm font-semibold">
                {overallProgress}%
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Progress value={overallProgress} />

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {subjectStats.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {item.label}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {item.progress}%
                    </span>
                  </div>

                  <Progress
                    value={item.progress}
                    className="mt-3"
                  />

                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.count} chapters
                  </p>
                </div>
              ))}
            </div>
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
              Loading your JEE syllabus...
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && chapters.length === 0 && (
          <Card>
            <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />

              <h2 className="mt-4 text-xl font-semibold">
                Syllabus data is not available yet
              </h2>

              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                The tracker is ready, but no syllabus chapters
                have been imported into the database yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Chapters */}
        {!loading && chapters.length > 0 && (
          <div className="space-y-4">
            {chapters.map((chapter) => {
              const isExpanded =
                expanded === chapter.chapter_id;

              return (
                <ChapterCard
                  key={chapter.chapter_id}
                  chapter={chapter}
                  expanded={isExpanded}
                  saving={
                    saving === chapter.chapter_id
                  }
                  onToggle={() =>
                    setExpanded(
                      isExpanded
                        ? null
                        : chapter.chapter_id,
                    )
                  }
                  onUpdate={updateChapter}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterCard({
  chapter,
  expanded,
  saving,
  onToggle,
  onUpdate,
}: {
  chapter: Chapter;
  expanded: boolean;
  saving: boolean;
  onToggle: () => void;
  onUpdate: (
    chapter: Chapter,
    status: Chapter["status"],
    progress: number,
    notes?: string,
  ) => Promise<void>;
}) {
  const [notes, setNotes] = React.useState(
    chapter.notes ?? "",
  );

  React.useEffect(() => {
    setNotes(chapter.notes ?? "");
  }, [chapter.notes]);

  const statusInfo = getStatusInfo(chapter.status);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 shrink-0">
              {chapter.status === "REVISED" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : chapter.status === "COMPLETED" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : chapter.status === "LEARNING" ? (
                <Clock3 className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {chapter.chapter_code && (
                  <Badge variant="outline">
                    {chapter.chapter_code}
                  </Badge>
                )}

                <Badge variant="secondary">
                  {chapter.subject}
                </Badge>

                <Badge variant="outline">
                  {statusInfo.label}
                </Badge>
              </div>

              <h2 className="mt-3 text-lg font-semibold">
                {chapter.chapter_name}
              </h2>

              {chapter.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {chapter.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Progress
                  value={chapter.progress_percent}
                  className="flex-1"
                />

                <span className="w-12 text-right text-sm font-semibold">
                  {chapter.progress_percent}%
                </span>
              </div>
            </div>

            <ChevronDown
              className={`mt-1 h-5 w-5 shrink-0 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="border-t bg-muted/20 p-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Topics */}
            <div>
              <h3 className="font-semibold">
                Topics
              </h3>

              {chapter.topics.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {chapter.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center gap-3 rounded-lg border bg-background p-3"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground" />

                      <span className="text-sm">
                        {topic.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No topic-level data has been added for this
                  chapter yet.
                </p>
              )}

              <div className="mt-6">
                <label className="text-sm font-medium">
                  Personal notes
                </label>

                <Textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Add something you want to remember about this chapter..."
                  className="mt-2 min-h-28"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium">
                  Chapter status
                </p>

                <div className="mt-3 grid gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        chapter.status === option.value
                          ? "default"
                          : "outline"
                      }
                      className="justify-start"
                      disabled={saving}
                      onClick={() => {
                        const progress =
                          option.value === "NOT_STARTED"
                            ? 0
                            : option.value === "LEARNING"
                              ? Math.max(
                                  25,
                                  chapter.progress_percent,
                                )
                              : option.value ===
                                  "COMPLETED"
                                ? 100
                                : 100;

                        onUpdate(
                          chapter,
                          option.value,
                          progress,
                          notes,
                        );
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Progress
                  </p>

                  <span className="text-sm text-muted-foreground">
                    {chapter.progress_percent}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={chapter.progress_percent}
                  onChange={(e) => {
                    const value = Number(
                      e.target.value,
                    );

                    let status: Chapter["status"] =
                      "LEARNING";

                    if (value === 0) {
                      status = "NOT_STARTED";
                    } else if (value === 100) {
                      status = "COMPLETED";
                    }

                    onUpdate(
                      chapter,
                      status,
                      value,
                      notes,
                    );
                  }}
                  className="mt-4 w-full"
                  disabled={saving}
                />
              </div>

              <Button
                className="w-full"
                disabled={saving}
                onClick={() =>
                  onUpdate(
                    chapter,
                    chapter.status,
                    chapter.progress_percent,
                    notes,
                  )
                }
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Progress"}
              </Button>

              {chapter.last_studied_at && (
                <p className="text-center text-xs text-muted-foreground">
                  Last studied{" "}
                  {new Date(
                    chapter.last_studied_at,
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
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

<p className="mt-4 font-medium">{label}</p>

<p className="mt-1 text-xs text-muted-foreground">
  {description}
</p>
</CardContent>
</Card>
);
}

function getStatusInfo(
  status: Chapter["status"],
) {
  switch (status) {
    case "LEARNING":
      return {
        label: "Learning",
      };

    case "COMPLETED":
      return {
        label: "Completed",
      };

    case "REVISED":
      return {
        label: "Revised",
      };

    default:
      return {
        label: "Not Started",
      };
  }
}