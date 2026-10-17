import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Info,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/advanced",
)({
  component: JEEAdvancedRankEstimator,
});

const categories = [
  { value: "OPEN", label: "OPEN / CRL" },
  { value: "OBC-NCL", label: "OBC-NCL" },
  { value: "GEN-EWS", label: "GEN-EWS" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "CRL-PwD", label: "CRL-PwD" },
  { value: "OBC-NCL-PwD", label: "OBC-NCL-PwD" },
  { value: "GEN-EWS-PwD", label: "GEN-EWS-PwD" },
  { value: "SC-PwD", label: "SC-PwD" },
  { value: "ST-PwD", label: "ST-PwD" },
  { value: "PC", label: "Preparatory Course" },
];

function JEEAdvancedRankEstimator() {
  const [marks, setMarks] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");

  const numericMarks = Number(marks);

  const prediction = useQuery({
    queryKey: ["jee-advanced-rank-estimate", numericMarks, category],
    queryFn: async () => {
      if (!marks || Number.isNaN(numericMarks)) return null;

      const { data, error } = await (supabase as any).rpc(
        "get_jee_advanced_rank_estimate",
        {
          _marks: numericMarks,
          _category: category,
        },
      );

      if (error) throw error;
      return data;
    },
    enabled:
      marks !== "" &&
      numericMarks >= 0 &&
      numericMarks <= 360,
  });

  const result = prediction.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/jee-predictor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              JEE Predictor
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Trophy className="h-4 w-4" />
            JEE Advanced 2026
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Advanced Rank Estimator
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Enter your expected JEE Advanced score to get an indicative
            Common Rank List estimate and check the qualifying threshold for
            your category.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Enter your score</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="marks">
                  JEE Advanced marks
                </Label>

                <Input
                  id="marks"
                  type="number"
                  min="0"
                  max="360"
                  step="1"
                  placeholder="Example: 180"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                />

                <p className="text-xs text-muted-foreground">
                  Maximum aggregate score: 360
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category / Rank List
                </Label>

                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0" />

                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Important
                    </p>

                    <p className="text-xs leading-5 text-muted-foreground">
                      JEE Advanced rank depends on the actual marks
                      distribution and tie-breaking rules. This tool gives
                      an indicative estimate, not a guaranteed rank.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {prediction.isLoading && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Calculating your estimate...
                </CardContent>
              </Card>
            )}

            {!prediction.isLoading && !result && (
              <Card>
                <CardContent className="flex min-h-[300px] items-center justify-center text-center">
                  <div className="max-w-md space-y-3">
                    <Target className="mx-auto h-10 w-10 text-muted-foreground" />

                    <h2 className="text-xl font-semibold">
                      Enter your marks
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      Your estimated JEE Advanced rank and qualifying status
                      will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && result.success && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      {result.qualifies ? (
                        <CheckCircle2 className="h-7 w-7" />
                      ) : (
                        <XCircle className="h-7 w-7" />
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Qualifying status
                        </p>

                        <h2 className="text-2xl font-bold">
                          {result.qualifies
                            ? "Qualifying threshold cleared"
                            : "Below qualifying threshold"}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Your marks
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {result.marks}/360
                        </p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Required aggregate
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {result.qualifying_marks}
                        </p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Subject minimum
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {result.minimum_subject_marks}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.qualifies && result.estimated_rank && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Estimated CRL Rank
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="text-5xl font-bold tracking-tight">
                        #{result.estimated_rank.toLocaleString()}
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Indicative range:{" "}
                        <span className="font-medium text-foreground">
                          #{result.range_low.toLocaleString()} – #
                          {result.range_high.toLocaleString()}
                        </span>
                      </p>

                      <div className="mt-6 rounded-xl border bg-muted/40 p-4">
                        <p className="text-sm leading-6 text-muted-foreground">
                          {result.note}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!result.qualifies && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                        <p className="font-semibold">
                          Rank estimate unavailable
                        </p>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {result.note}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {result && !result.success && (
              <Card>
                <CardContent className="py-10 text-center text-destructive">
                  {result.message}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Methodology & source</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The qualifying thresholds are based on the official JEE
              Advanced 2026 Results press release.
            </p>

            <p>
              The rank estimate uses 2026 post-result marks/rank anchors and
              piecewise interpolation. It is an estimate and should not be
              treated as an official rank conversion.
            </p>

            <p>
              Final rank depends on the actual candidate score distribution,
              ties and the official rank-list process.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}