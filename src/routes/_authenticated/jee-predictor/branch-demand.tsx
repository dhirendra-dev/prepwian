import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
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
  "/_authenticated/jee-predictor/branch-demand",
)({
  component: BranchDemand,
});

type Branch = {
  program_name: string;
  program_code: string | null;
  institute_count: number;
  record_count: number;
  avg_closing_rank: number | null;
  best_closing_rank: number | null;
  worst_closing_rank: number | null;
  closing_rank_2026: number | null;
  closing_rank_2025: number | null;
  closing_rank_2024: number | null;
  change_2026_vs_2025: number | null;
  change_2025_vs_2024: number | null;
  available_years: number;
};

function BranchDemand() {
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [search, setSearch] = React.useState("");

  const branches = useQuery({
    queryKey: [
      "jee-branch-demand",
      category,
      round,
      type,
      state,
      search,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_branch_demand",
        {
          _year: 2026,
          _category: category,
          _round: Number(round),
          _institute_type: type || null,
          _state: state || null,
          _program_search: search.trim() || null,
          _limit: 200,
        },
      );

      if (error) throw error;

      return (data ?? []) as Branch[];
    },
    staleTime: 60_000,
  });

  const rows = branches.data ?? [];

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
            Branch analytics
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Branch Demand & Rank Movement
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore how program-level closing ranks have moved
            across the available JoSAA historical data.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
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

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All institutes</option>
                <option value="IIT">IIT</option>
                <option value="NIT">NIT</option>
                <option value="IIIT">IIIT</option>
                <option value="GFTI">GFTI</option>
              </select>

              <Input
                placeholder="State..."
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search branch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric
                label="Branches"
                value={rows.length}
              />

              <Metric
                label="Institute records"
                value={rows.reduce(
                  (sum, row) => sum + Number(row.institute_count),
                  0,
                )}
              />

              <Metric
                label="Cutoff records"
                value={rows.reduce(
                  (sum, row) => sum + Number(row.record_count),
                  0,
                )}
              />
            </div>
          </CardContent>
        </Card>

        {branches.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading branch analytics...
            </CardContent>
          </Card>
        )}

        {branches.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load branch analytics.
            </CardContent>
          </Card>
        )}

        {!branches.isLoading &&
          !branches.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No branch data found
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Historical cutoff data may not have been
                  imported yet, or the selected filters returned
                  no records.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((branch) => (
            <BranchCard
              key={`${branch.program_name}-${branch.program_code ?? ""}`}
              branch={branch}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              This dashboard describes historical cutoff records.
              It does not establish that a branch is inherently
              more desirable, nor does it predict future cutoffs
              or admission outcomes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BranchCard({ branch }: { branch: Branch }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline">
              {branch.available_years}/3 years
            </Badge>

            <CardTitle className="mt-3">
              {branch.program_name}
            </CardTitle>

            {branch.program_code && (
              <p className="mt-1 text-xs text-muted-foreground">
                {branch.program_code}
              </p>
            )}
          </div>

          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Institutes"
            value={Number(branch.institute_count)}
          />

          <Metric
            label="Records"
            value={Number(branch.record_count)}
          />

          <Metric
            label="Best closing"
            value={formatRank(branch.best_closing_rank)}
          />

          <Metric
            label="Worst closing"
            value={formatRank(branch.worst_closing_rank)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <YearBox
            year="2026"
            value={branch.closing_rank_2026}
          />

          <YearBox
            year="2025"
            value={branch.closing_rank_2025}
          />

          <YearBox
            year="2024"
            value={branch.closing_rank_2024}
          />
        </div>

        <div className="space-y-2">
          <Movement
            label="2026 vs 2025"
            value={branch.change_2026_vs_2025}
          />

          <Movement
            label="2025 vs 2024"
            value={branch.change_2025_vs_2024}
          />
        </div>

        {branch.avg_closing_rank !== null && (
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              Overall average closing rank
            </p>

            <p className="mt-1 font-semibold">
              {Math.round(
                Number(branch.avg_closing_rank),
              ).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Movement({
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

        <span className="text-xs text-muted-foreground">
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
        {Math.round(value).toLocaleString()}
      </span>
    </div>
  );
}

function YearBox({
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
        {formatRank(value)}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>
    </div>
  );
}

function formatRank(value: number | null) {
  return value === null
    ? "—"
    : Math.round(value).toLocaleString();
}