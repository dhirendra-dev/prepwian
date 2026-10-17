import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Filter,
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
  "/_authenticated/jee-predictor/cutoff-tracker",
)({
  component: CutoffTracker,
});

type Comparison = {
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  category: string;
  quota: string | null;
  round: number;
  year_2026_opening: number | null;
  year_2026_closing: number | null;
  year_2025_opening: number | null;
  year_2025_closing: number | null;
  year_2024_opening: number | null;
  year_2024_closing: number | null;
  closing_change_2026_vs_2025: number | null;
  closing_change_2025_vs_2024: number | null;
};

function CutoffTracker() {
  const [search, setSearch] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");

  const comparison = useQuery({
    queryKey: [
      "jee-cutoff-year-comparison",
      search,
      program,
      category,
      round,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_cutoff_year_comparison",
        {
          _institute_search: search.trim() || null,
          _program_search: program.trim() || null,
          _category: category,
          _round: Number(round),
          _quota: null,
          _years: [2026, 2025, 2024],
          _limit: 100,
        },
      );

      if (error) throw error;

      return (data ?? []) as Comparison[];
    },
    staleTime: 60_000,
  });

  const rows = comparison.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
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
            Previous-Year Cutoff Tracker
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Compare JoSAA closing ranks across 2026, 2025 and 2024
            to understand historical cutoff movement.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="institute">
                  Institute
                </Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="institute"
                    className="pl-9"
                    placeholder="IIT Bombay..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">
                  Branch
                </Label>

                <Input
                  id="program"
                  placeholder="Computer Science..."
                  value={program}
                  onChange={(e) =>
                    setProgram(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category
                </Label>

                <select
                  id="category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="OPEN">
                    OPEN / CRL
                  </option>
                  <option value="EWS">EWS</option>
                  <option value="OBC-NCL">
                    OBC-NCL
                  </option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round">
                  JoSAA Round
                </Label>

                <select
                  id="round"
                  value={round}
                  onChange={(e) =>
                    setRound(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      Round {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {comparison.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Comparing historical cutoffs...
            </CardContent>
          </Card>
        )}

        {comparison.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load historical cutoff data.
            </CardContent>
          </Card>
        )}

        {!comparison.isLoading &&
          !comparison.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="font-medium">
                  No comparison records found.
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  The relevant yearly cutoff datasets may not have
                  been imported yet.
                </p>
              </CardContent>
            </Card>
          )}

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Historical cutoff movement
                </h2>

                <p className="text-sm text-muted-foreground">
                  {rows.length} records
                </p>
              </div>

              <Badge variant="secondary">
                2024 → 2026
              </Badge>
            </div>

            <div className="grid gap-5">
              {rows.map((row, index) => (
                <ComparisonCard
                  key={`${row.institute_name}-${row.program_name}-${index}`}
                  row={row}
                />
              ))}
            </div>
          </>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              A positive closing-rank change means the numerical
              closing rank increased compared with the previous year;
              a negative value means it decreased. Historical movement
              does not establish what a future cutoff will be.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComparisonCard({
  row,
}: {
  row: Comparison;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {row.institute_type && (
                <Badge variant="outline">
                  {row.institute_type}
                </Badge>
              )}

              <Badge variant="secondary">
                {row.category}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {row.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {row.program_name}
            </p>
          </div>

          <Badge variant="outline">
            Round {row.round}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <YearBox
            year="2026"
            opening={row.year_2026_opening}
            closing={row.year_2026_closing}
          />

          <YearBox
            year="2025"
            opening={row.year_2025_opening}
            closing={row.year_2025_closing}
          />

          <YearBox
            year="2024"
            opening={row.year_2024_opening}
            closing={row.year_2024_closing}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChangeBox
            label="2026 vs 2025"
            value={row.closing_change_2026_vs_2025}
          />

          <ChangeBox
            label="2025 vs 2024"
            value={row.closing_change_2025_vs_2024}
          />
        </div>

        {(row.city || row.state) && (
          <p className="text-xs text-muted-foreground">
            {[row.city, row.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function YearBox({
  year,
  opening,
  closing,
}: {
  year: string;
  opening: number | null;
  closing: number | null;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">{year}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Opening
          </p>

          <p className="mt-1 font-bold">
            {formatRank(opening)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Closing
          </p>

          <p className="mt-1 font-bold">
            {formatRank(closing)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChangeBox({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-medium">Not available</p>
      </div>
    );
  }

  const positive = value > 0;
  const negative = value < 0;

  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {positive && (
          <ArrowUp className="h-4 w-4" />
        )}

        {negative && (
          <ArrowDown className="h-4 w-4" />
        )}

        <span className="font-bold">
          {value > 0 ? "+" : ""}
          {value.toLocaleString()}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Closing-rank difference
      </p>
    </div>
  );
}

function formatRank(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `#${value.toLocaleString()}`;
}