import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
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
  "/_authenticated/jee-predictor/marks-percentile",
)({
  component: MarksPercentileAnalyzer,
});

type Model = {
  id: string;
  exam: string;
  year: number;
  metric: string;
  category: string | null;
  candidates_count: number | null;
  model_data: Record<string, unknown>;
  source_url: string | null;
  source_label: string | null;
  notes: string | null;
};

function MarksPercentileAnalyzer() {
  const [marks, setMarks] = React.useState("");

  const models = useQuery({
    queryKey: ["jee-marks-percentile-models", "JEE_MAIN", 2026],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_percentile_marks_models",
        {
          _exam: "JEE_MAIN",
          _year: 2026,
          _category: null,
        },
      );

      if (error) throw error;

      return (data ?? []) as Model[];
    },
    staleTime: 5 * 60_000,
  });

  const percentileModel = models.data?.find(
    (model) => model.metric === "MARKS_TO_PERCENTILE",
  );

  const rankModel = models.data?.find(
    (model) => model.metric === "PERCENTILE_TO_RANK",
  );

  const numericMarks = Number(marks);
  const validMarks =
    marks !== "" &&
    Number.isFinite(numericMarks) &&
    numericMarks >= 0 &&
    numericMarks <= 300;

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
            <Calculator className="h-4 w-4" />
            JEE Main 2026
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Percentile ↔ Marks Analyzer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore the relationship between JEE Main marks,
            percentile and estimated rank using published
            historical models.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter your marks</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="marks">
                JEE Main marks
              </Label>

              <Input
                id="marks"
                type="number"
                min={0}
                max={300}
                placeholder="Example: 180"
                value={marks}
                onChange={(event) =>
                  setMarks(event.target.value)
                }
              />

              <p className="text-xs text-muted-foreground">
                Enter a value from 0 to 300.
              </p>
            </div>

            {validMarks && (
              <div className="rounded-xl border p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-medium">
                      Marks entered: {numericMarks}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      A marks → percentile conversion will appear
                      here once an actual 2026 marks-percentile
                      dataset is imported.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <ModelStatus
            title="Marks → Percentile"
            available={!!percentileModel}
            model={percentileModel}
          />

          <ModelStatus
            title="Percentile → Rank"
            available={!!rankModel}
            model={rankModel}
          />
        </div>

        {rankModel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Available Rank Model
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  JEE Main {rankModel.year}
                </Badge>

                {rankModel.category && (
                  <Badge variant="outline">
                    {rankModel.category}
                  </Badge>
                )}

                {rankModel.candidates_count && (
                  <Badge variant="outline">
                    {rankModel.candidates_count.toLocaleString()} candidates
                  </Badge>
                )}
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {rankModel.notes ??
                  "This is an estimate based on the stored model and is not an official NTA rank conversion table."}
              </p>

              {rankModel.source_url && (
                <a
                  href={rankModel.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline underline-offset-4"
                >
                  View source
                </a>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Percentile is not the same as percentage marks. NTA
              calculates percentile using its examination
              methodology, so a fixed marks-to-percentile formula
              should not be presented as an official conversion.
              This tool will only display a marks-to-percentile
              result after a corresponding dataset has been added.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ModelStatus({
  title,
  available,
  model,
}: {
  title: string;
  available: boolean;
  model?: Model;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <Badge variant={available ? "default" : "secondary"}>
          {available ? "Dataset available" : "Dataset pending"}
        </Badge>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {available
            ? model?.source_label ??
              "A prediction model is currently available."
            : "No verified dataset has been imported for this conversion yet."}
        </p>
      </CardContent>
    </Card>
  );
}