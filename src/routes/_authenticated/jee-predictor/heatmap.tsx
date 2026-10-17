import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Flame,
  RefreshCw,
} from "lucide-react";
import {
  Link,
  createFileRoute,
} from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type HeatStatus =
  | "RED"
  | "ORANGE"
  | "YELLOW"
  | "GREEN"
  | "GREY";

type Chapter = {
  id: string;
  subject: string;
  chapter_code: string | null;
  chapter_name: string;
  chapter_order: number;
  topic_count: number;
  backlog_count: number;
  revision_due_count: number;
  unresolved_mistake_count: number;
  heat_status: HeatStatus;
};

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/heatmap",
)({
  component: SyllabusHeatmapPage,
});

function SyllabusHeatmapPage() {
  const [exam, setExam] = useState<
    "JEE_MAIN" | "JEE_ADVANCED"
  >("JEE_MAIN");

  const [chapters, setChapters] = useState<Chapter[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const loadHeatmap = async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await (
      supabase as any
    ).rpc("get_jee_syllabus_heatmap", {
      _exam: exam,
    });

    if (rpcError) {
      setError(rpcError.message);
      setChapters([]);
      setLoading(false);
      return;
    }

    if (!data?.success) {
      setError(
        data?.message ??
          "Unable to load syllabus heatmap.",
      );
      setChapters([]);
      setLoading(false);
      return;
    }

    setChapters(data.chapters ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadHeatmap();
  }, [exam]);

  const stats = useMemo(() => {
    return {
      red: chapters.filter(
        (c) => c.heat_status === "RED",
      ).length,

      orange: chapters.filter(
        (c) => c.heat_status === "ORANGE",
      ).length,

      yellow: chapters.filter(
        (c) => c.heat_status === "YELLOW",
      ).length,

      green: chapters.filter(
        (c) => c.heat_status === "GREEN",
      ).length,
    };
  }, [chapters]);

  const subjects = [
    "PHYSICS",
    "CHEMISTRY",
    "MATHEMATICS",
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
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
                <Flame className="h-5 w-5" />

                <h1 className="text-2xl font-bold">
                  Syllabus Heatmap
                </h1>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                See where your preparation needs attention.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={loadHeatmap}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              exam === "JEE_MAIN"
                ? "default"
                : "outline"
            }
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
            onClick={() =>
              setExam("JEE_ADVANCED")
            }
          >
            JEE Advanced
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
          <HeatStat
            label="Needs Immediate Attention"
            value={stats.red}
            status="RED"
          />

          <HeatStat
            label="Backlog Pressure"
            value={stats.orange}
            status="ORANGE"
          />

          <HeatStat
            label="Revision Due"
            value={stats.yellow}
            status="YELLOW"
          />

          <HeatStat
            label="Currently Clear"
            value={stats.green}
            status="GREEN"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Chapter Map
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Building your syllabus heatmap...
              </div>
            ) : chapters.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10" />

                <h2 className="text-lg font-semibold">
                  No syllabus data available
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  There is currently no active syllabus
                  data for this exam.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {subjects.map((subject) => {
                  const subjectChapters =
                    chapters.filter(
                      (chapter) =>
                        chapter.subject === subject,
                    );

                  if (
                    subjectChapters.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <section key={subject}>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                          {formatSubject(subject)}
                        </h2>

                        <span className="text-sm text-muted-foreground">
                          {subjectChapters.length} chapters
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {subjectChapters.map(
                          (chapter) => (
                            <ChapterHeatCard
                              key={chapter.id}
                              chapter={chapter}
                            />
                          ),
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Heatmap Legend
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <LegendItem
                status="RED"
                label="Needs attention"
                description="Repeated unresolved mistakes"
              />

              <LegendItem
                status="ORANGE"
                label="Backlog pressure"
                description="Multiple pending backlog items"
              />

              <LegendItem
                status="YELLOW"
                label="Revision due"
                description="Pending revision task"
              />

              <LegendItem
                status="GREEN"
                label="Clear"
                description="No current issue detected"
              />

              <LegendItem
                status="GREY"
                label="No activity"
                description="No active topic data"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChapterHeatCard({
  chapter,
}: {
  chapter: Chapter;
}) {
  return (
    <Card
      className={`border-l-4 ${getStatusBorder(
        chapter.heat_status,
      )}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {chapter.chapter_code && (
              <p className="text-xs text-muted-foreground">
                {chapter.chapter_code}
              </p>
            )}

            <h3 className="mt-1 font-semibold leading-snug">
              {chapter.chapter_name}
            </h3>
          </div>

          <Badge
            variant={getBadgeVariant(
              chapter.heat_status,
            )}
          >
            {formatStatus(
              chapter.heat_status,
            )}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Metric
            value={chapter.topic_count}
            label="Topics"
          />

          <Metric
            value={chapter.backlog_count}
            label="Backlog"
          />

          <Metric
            value={
              chapter.unresolved_mistake_count
            }
            label="Mistakes"
          />
        </div>

        {chapter.revision_due_count > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {chapter.revision_due_count} revision{" "}
            {chapter.revision_due_count === 1
              ? "task"
              : "tasks"}{" "}
            due
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function Metric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="font-semibold">
        {value}
      </p>

      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function HeatStat({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: HeatStatus;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${getStatusDot(
              status,
            )}`}
          />

          <div>
            <p className="text-sm text-muted-foreground">
              {label}
            </p>

            <p className="mt-1 text-2xl font-bold">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendItem({
  status,
  label,
  description,
}: {
  status: HeatStatus;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${getStatusDot(
          status,
        )}`}
      />

      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function formatSubject(subject: string) {
  switch (subject) {
    case "PHYSICS":
      return "Physics";

    case "CHEMISTRY":
      return "Chemistry";

    case "MATHEMATICS":
      return "Mathematics";

    default:
      return subject;
  }
}

function formatStatus(status: HeatStatus) {
  switch (status) {
    case "RED":
      return "Attention";

    case "ORANGE":
      return "Backlog";

    case "YELLOW":
      return "Revision";

    case "GREEN":
      return "Clear";

    default:
      return "No Activity";
  }
}

function getStatusDot(status: HeatStatus) {
  switch (status) {
    case "RED":
      return "bg-red-500";

    case "ORANGE":
      return "bg-orange-500";

    case "YELLOW":
      return "bg-yellow-500";

    case "GREEN":
      return "bg-green-500";

    default:
      return "bg-muted-foreground";
  }
}

function getStatusBorder(status: HeatStatus) {
  switch (status) {
    case "RED":
      return "border-l-red-500";

    case "ORANGE":
      return "border-l-orange-500";

    case "YELLOW":
      return "border-l-yellow-500";

    case "GREEN":
      return "border-l-green-500";

    default:
      return "border-l-muted-foreground";
  }
}

function getBadgeVariant(
  status: HeatStatus,
) {
  switch (status) {
    case "RED":
      return "destructive" as const;

    case "GREEN":
      return "default" as const;

    default:
      return "outline" as const;
  }
}
<Link
  to="/jee-predictor/heatmap"
  className="group block rounded-xl border bg-card p-5 transition-colors hover:bg-accent"
>
  <div className="flex items-center gap-3">
    <div className="rounded-lg bg-primary/10 p-3">
      <Flame className="h-6 w-6 text-primary" />
    </div>

    <div>
      <h3 className="font-semibold">
        Syllabus Heatmap
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        See which chapters need attention, revision,
        or backlog cleanup.
      </p>
    </div>
  </div>
</Link>