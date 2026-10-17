import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Search,
  Sparkles,
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

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/recommendations",
)({
  component: Recommendations,
});

type Recommendation = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  program_code: string | null;
  category: string;
  quota: string | null;
  round: number | null;
  opening_rank: number | null;
  closing_rank: number | null;
  rank_gap: number | null;
  fit_status: string;
  official_url: string | null;
  source_url: string | null;
};

function Recommendations() {
  const [rank, setRank] = React.useState("");
  const [year, setYear] = React.useState("2026");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [submitted, setSubmitted] = React.useState<number | null>(
    null,
  );

  const recommendations = useQuery({
    queryKey: [
      "jee-recommendations",
      submitted,
      year,
      category,
      round,
      type,
      state,
      program,
    ],
    enabled: submitted !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_recommendations",
        {
          _rank: submitted,
          _year: Number(year),
          _category: category,
          _round: Number(round),
          _institute_type: type || null,
          _state: state || null,
          _program_search: program.trim() || null,
          _max_results: 50,
        },
      );

      if (error) throw error;

      return (data ?? []) as Recommendation[];
    },
  });

  const generate = () => {
    const value = Number(rank);

    if (!Number.isInteger(value) || value <= 0) {
      return;
    }

    setSubmitted(value);
  };

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

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Sparkles className="h-4 w-4" />
            JEE shortlist workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College & Branch Recommendations
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Enter your rank and preferences to generate a
            structured shortlist from historical JoSAA cutoff
            records.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your preferences</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  JEE rank
                </label>

                <Input
                  type="number"
                  min="1"
                  placeholder="Example: 25000"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Year
                </label>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="GEN-EWS">GEN-EWS</option>
                  <option value="OBC-NCL">OBC-NCL</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  JoSAA round
                </label>

                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((item) => (
                    <option key={item} value={item}>
                      Round {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All institute types</option>
                <option value="IIT">IIT</option>
                <option value="NIT">NIT</option>
                <option value="IIIT">IIIT</option>
                <option value="GFTI">GFTI</option>
              </select>

              <Input
                placeholder="State (optional)"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Branch, e.g. CSE"
                  value={program}
                  onChange={(e) =>
                    setProgram(e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={!rank}
              className="w-full md:w-auto"
            >
              <Target className="mr-2 h-4 w-4" />
              Generate shortlist
            </Button>
          </CardContent>
        </Card>

        {submitted !== null && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-medium">
                    Historical shortlist for rank{" "}
                    {submitted.toLocaleString()}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {category} · JoSAA {year} · Round {round}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recommendations.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Building your historical shortlist...
            </CardContent>
          </Card>
        )}

        {recommendations.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to generate the shortlist.
            </CardContent>
          </Card>
        )}

        {submitted !== null &&
          !recommendations.isLoading &&
          !recommendations.isError &&
          (recommendations.data ?? []).length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No matching historical records
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Try a broader branch search, another institute
                  type, category or round. If the official cutoff
                  dataset has not been imported yet, results will
                  also be empty.
                </p>
              </CardContent>
            </Card>
          )}

        {(recommendations.data ?? []).length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Suggested historical matches
                </h2>

                <p className="text-sm text-muted-foreground">
                  {recommendations.data?.length ?? 0} records
                </p>
              </div>

              <Badge variant="secondary">
                Historical data
              </Badge>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {(recommendations.data ?? []).map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              These suggestions are generated from historical
              opening and closing ranks. They are not an admission
              prediction, probability, guarantee, or official
              counselling recommendation. Always verify the current
              year's official JoSAA information before making
              choices.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecommendationCard({
  item,
}: {
  item: Recommendation;
}) {
  const inside =
    item.fit_status === "Inside historical range";

  const near =
    item.fit_status === "Near historical closing range";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {item.institute_type && (
                <Badge variant="outline">
                  {item.institute_type}
                </Badge>
              )}

              <Badge variant="secondary">
                {item.category}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {item.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {item.program_name}
            </p>
          </div>

          <Sparkles className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <Badge
          variant={
            inside
              ? "default"
              : near
                ? "secondary"
                : "outline"
          }
        >
          {item.fit_status}
        </Badge>

        {(item.city || item.state) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />

            {[item.city, item.state]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <RankBox
            label="Opening rank"
            value={item.opening_rank}
          />

          <RankBox
            label="Closing rank"
            value={item.closing_rank}
          />
        </div>

        {item.rank_gap !== null && (
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              Closing-rank difference
            </p>

            <p className="mt-1 font-semibold">
              {item.rank_gap > 0 ? "+" : ""}
              {item.rank_gap.toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {item.official_url && (
            <Button asChild size="sm" variant="outline">
              <a
                href={item.official_url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Institute website
              </a>
            </Button>
          )}

          {item.source_url && (
            <Button asChild size="sm" variant="ghost">
              <a
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RankBox({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value?.toLocaleString() ?? "—"}
      </p>
    </div>
  );
}