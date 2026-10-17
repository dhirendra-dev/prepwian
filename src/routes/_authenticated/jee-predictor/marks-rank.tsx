import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Info,
  Search,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/marks-rank",
)({
  component: MarksRankAnalyzer,
});

type Model = {
  id: string;
  exam: string;
  year: number;
  metric: string;
  category: string | null;
  candidates_count: number | null;
  model_data: Record<string, any>;
  source_url: string | null;
  source_label: string | null;
  notes: string | null;
};

function MarksRankAnalyzer() {
  const [exam, setExam] = React.useState("JEE_MAIN");
  const [year, setYear] = React.useState("2026");
  const [marks, setMarks] = React.useState("");

  const models = useQuery({
    queryKey: ["jee-marks-rank-models", exam, year],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_marks_rank_models",
        {
          _exam: exam,
          _year: Number(year),
          _category: null,
        },
      );

      if (error) throw error;

      return (data ?? []) as Model[];
    },
    staleTime: 5 * 60_000,
  });

  const marksModel = models.data?.find(
    (model) => model.metric === "MARKS_TO_RANK",
  );

  const percentileModel = models.data?.find(
    (model) => model.metric === "PERCENTILE_TO_RANK",
  );

  const numericMarks = Number(marks);

  const maxMarks = exam === "JEE_ADVANCED" ? 360 : 300;

  const validMarks =
    marks !== "" &&
    Number.isFinite(numericMarks) &&
    numericMarks >= 0 &&
    numericMarks <= maxMarks;

  const estimate = validMarks
    ? estimateFromModel(marksModel, numericMarks)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jee-predictor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            JEE Predictor
          </Link>
        </Button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <BarChart3 className="h-4 w-4" />
            Historical analysis
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Marks ↔ Rank Analyzer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore how marks have historically corresponded to
            estimated ranks in JEE Main and JEE Advanced.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analysis inputs</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Exam</Label>

                <select
                  value={exam}
                  onChange={(e) => {
                    setExam(e.target.value);
                    setMarks("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="JEE_MAIN">
                    JEE Main
                  </option>

                  <option value="JEE_ADVANCED">
                    JEE Advanced
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>

                <select
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setMarks("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marks">
                  Marks
                </Label>

                <Input
                  id="marks"
                  type="number"
                  min={0}
                  max={maxMarks}
                  placeholder={`0–${maxMarks}`}
                  value={marks}
                  onChange={(e) =>
                    setMarks(e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {validMarks && marksModel && estimate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Estimated historical rank
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-2xl border p-6">
                <p className="text-sm text-muted-foreground">
                  {numericMarks} marks
                </p>

                <p className="mt-2 text-4xl font-bold">
                  #{estimate.rank.toLocaleString()}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Indicative range:{" "}
                  {estimate.low.toLocaleString()}–
                  {estimate.high.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {exam === "JEE_MAIN"
                    ? "JEE Main"
                    : "JEE Advanced"}
                </Badge>

                <Badge variant="outline">
                  {year}
                </Badge>

                <Badge variant="outline">
                  Historical estimate
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {!models.isLoading && !marksModel && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium">
                No marks-to-rank model is available
                for this selection yet.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Import a verified historical dataset before
                displaying an estimate.
              </p>
            </CardContent>
          </Card>
        )}

        {models.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load the prediction model.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Methodology
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {marksModel ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {marksModel.category && (
                    <Badge variant="outline">
                      {marksModel.category}
                    </Badge>
                  )}

                  {marksModel.candidates_count && (
                    <Badge variant="outline">
                      {marksModel.candidates_count.toLocaleString()} candidates
                    </Badge>
                  )}
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {marksModel.notes ??
                    "The displayed rank is an estimate based on the stored historical model, not an official rank issued by NTA or the examination authority."}
                </p>

                {marksModel.source_label && (
                  <p className="text-sm font-medium">
                    Source: {marksModel.source_label}
                  </p>
                )}

                {marksModel.source_url && (
                  <a
                    href={marksModel.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline underline-offset-4"
                  >
                    View source
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No verified marks-to-rank dataset is currently
                available for this exam and year.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Historical marks-to-rank relationships can change
              between years because candidate counts, difficulty,
              normalization and examination patterns can change.
              This analyzer should therefore be treated as an
              estimate rather than a guaranteed rank.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function estimateFromModel(
  model: Model | undefined,
  marks: number,
) {
  if (!model) return null;

  const anchors = Array.isArray(model.model_data?.anchors)
    ? model.model_data.anchors
    : [];

  const points = anchors
    .filter(
      (point: any) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1])),
    )
    .map((point: any) => ({
      marks: Number(point[0]),
      rank: Number(point[1]),
    }))
    .sort((a, b) => b.marks - a.marks);

  if (points.length < 2) return null;

  if (marks >= points[0].marks) {
    const rank = Math.max(1, Math.round(points[0].rank));
    return {
      rank,
      low: Math.max(1, Math.round(rank * 0.9)),
      high: Math.round(rank * 1.1),
    };
  }

  if (marks <= points[points.length - 1].marks) {
    const rank = Math.max(
      1,
      Math.round(points[points.length - 1].rank),
    );

    return {
      rank,
      low: Math.max(1, Math.round(rank * 0.9)),
      high: Math.round(rank * 1.1),
    };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const upper = points[i];
    const lower = points[i + 1];

    if (
      marks <= upper.marks &&
      marks >= lower.marks
    ) {
      const ratio =
        (marks - lower.marks) /
        (upper.marks - lower.marks);

      const rank =
        lower.rank +
        ratio * (upper.rank - lower.rank);

      const rounded = Math.max(
        1,
        Math.round(rank),
      );

      return {
        rank: rounded,
        low: Math.max(
          1,
          Math.round(rounded * 0.9),
        ),
        high: Math.round(rounded * 1.1),
      };
    }
  }

  return null;
}