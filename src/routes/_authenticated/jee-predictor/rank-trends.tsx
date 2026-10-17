import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Minus,
  Search,
  TrendingUp,
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
  "/_authenticated/jee-predictor/rank-trends",
)({
  component: RankTrends,
});

type Trend = {
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  category: string;
  quota: string | null;
  round: number | null;
  closing_2026: number | null;
  closing_2025: number | null;
  closing_2024: number | null;
  change_2026_vs_2025: number | null;
  change_2025_vs_2024: number | null;
  change_2026_vs_2024: number | null;
  available_years: number;
};

function RankTrends() {
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [institute, setInstitute] = React.useState("");
  const [program, setProgram] = React.useState("");

  const trends = useQuery({
    queryKey: [
      "jee-rank-trends",
      category,
      round,
      institute,
      program,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_rank_trend",
        {
          _institute_search:
            institute.trim() || null,
          _program_search:
            program.trim() || null,
          _category: category,
          _round: Number(round),
          _quota: null,
          _years: [2026, 2025, 2024],
          _limit: 200,
        },
      );

      if (error) throw error;

      return (data ?? []) as Trend[];
    },
    staleTime: 60_000,
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

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <TrendingUp className="h-4 w-4" />
            Historical analysis
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Rank Trends
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Track how historical closing ranks moved across
            2024, 2025 and 2026.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="OPEN">OPEN</option>
                <option value="GEN-EWS">GEN-EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>

              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {[1, 2, 3, 4, 5].map((item) => (
                  <option key={item} value={item}>
                    Round {item}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search institute..."
                  value={institute}
                  onChange={(e) =>
                    setInstitute(e.target.value)
                  }
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search branch..."
                  value={program}
                  onChange={(e) =>
                    setProgram(e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <Summary
                label="Records"
                value={trends.data?.length ?? 0}
              />

              <Summary
                label="2026 data"
                value={
                  trends.data?.filter(
                    (x) => x.closing_2026 !== null,
                  ).length ?? 0
                }
              />

              <Summary
                label="2025 data"
                value={
                  trends.data?.filter(
                    (x) => x.closing_2025 !== null,
                  ).length ?? 0
                }
              />

              <Summary
                label="2024 data"
                value={
                  trends.data?.filter(
                    (x) => x.closing_2024 !== null,
                  ).length ?? 0
                }
              />
            </div>
          </CardContent>
        </Card>

        {trends.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading historical rank movement...
            </CardContent>
          </Card>
        )}

        {trends.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load historical rank data.
            </CardContent>
          </Card>
        )}

        {!trends.isLoading &&
          !trends.isError &&
          (trends.data ?? []).length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No historical data found
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  The required cutoff data may not have been
                  imported yet, or the selected filters returned
                  no records.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {(trends.data ?? []).map((item, index) => (
            <TrendCard
              key={`${item.institute_name}-${item.program_name}-${index}`}
              item={item}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              A positive closing-rank change means the numerical
              closing rank increased compared with the previous
              year. A negative change means it decreased. Historical
              movement describes past data and does not predict a
              future cutoff.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendCard({ item }: { item: Trend }) {
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

              <Badge variant="outline">
                {item.available_years}/3 years
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {item.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {item.program_name}
            </p>

            {(item.city || item.state) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {[item.city, item.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <YearValue
            year="2026"
            value={item.closing_2026}
          />

          <YearValue
            year="2025"
            value={item.closing_2025}
          />

          <YearValue
            year="2024"
            value={item.closing_2024}
          />
        </div>

        <div className="space-y-3">
          <ChangeRow
            label="2026 vs 2025"
            value={item.change_2026_vs_2025}
          />

          <ChangeRow
            label="2025 vs 2024"
            value={item.change_2025_vs_2024}
          />

          <ChangeRow
            label="2026 vs 2024"
            value={item.change_2026_vs_2024}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function YearValue({
  year,
  value,
}: {
  year: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border p-3 text-center">
      <p className="text-xs text-muted-foreground">
        {year}
      </p>

      <p className="mt-1 font-bold">
        {value?.toLocaleString() ?? "—"}
      </p>
    </div>
  );
}

function ChangeRow({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>

        <span className="text-sm text-muted-foreground">
          Insufficient data
        </span>
      </div>
    );
  }

  const Icon =
    value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />

        {value > 0 ? "+" : ""}
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}