import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  Search,
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
  "/_authenticated/jee-predictor/placements",
)({
  component: PlacementExplorer,
});

type PlacementRow = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string | null;
  program_code: string | null;
  metric: string;
  value: number | null;
  unit: string | null;
  batch_label: string | null;
  description: string | null;
  source_url: string | null;
  source_label: string | null;
};

function PlacementExplorer() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [metric, setMetric] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [program, setProgram] = React.useState("");

  const placements = useQuery({
    queryKey: [
      "jee-placement-explorer",
      year,
      type,
      state,
      metric,
      institute,
      program,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_placement_explorer",
        {
          _year: Number(year),
          _institute_type: type || null,
          _state: state || null,
          _institute_search:
            institute.trim() || null,
          _program_search:
            program.trim() || null,
          _metric: metric || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as PlacementRow[];
    },
    staleTime: 60_000,
  });

  const rows = placements.data ?? [];

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
            <BriefcaseBusiness className="h-4 w-4" />
            JEE placement explorer
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College ROI & Placement Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore source-backed placement and career outcome
            records for JEE institutes and programs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

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

              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All metrics</option>
                <option value="AVERAGE_PACKAGE">
                  Average package
                </option>
                <option value="MEDIAN_PACKAGE">
                  Median package
                </option>
                <option value="HIGHEST_PACKAGE">
                  Highest package
                </option>
                <option value="PLACEMENT_RATE">
                  Placement rate
                </option>
                <option value="STUDENTS_PLACED">
                  Students placed
                </option>
                <option value="COMPANIES">
                  Companies
                </option>
              </select>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input
                placeholder="State..."
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

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
                  placeholder="Search program..."
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
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Records"
                value={rows.length}
              />

              <Stat
                label="Institutes"
                value={
                  new Set(
                    rows.map((row) => row.institute_name),
                  ).size
                }
              />

              <Stat
                label="Programs"
                value={
                  new Set(
                    rows
                      .map((row) => row.program_name)
                      .filter(Boolean),
                  ).size
                }
              />
            </div>
          </CardContent>
        </Card>

        {placements.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading placement records...
            </CardContent>
          </Card>
        )}

        {placements.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load placement data.
            </CardContent>
          </Card>
        )}

        {!placements.isLoading &&
          !placements.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No placement records available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Verified placement data has not been imported
                  for the selected filters yet. JEE Prep Hub
                  won't display invented placement figures.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((row) => (
            <PlacementCard
              key={row.id}
              row={row}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Placement outcomes can vary by year, branch,
              graduating batch, eligibility, recruiting
              conditions and reporting methodology. Always check
              the original institute or official source before
              making an admission decision.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlacementCard({
  row,
}: {
  row: PlacementRow;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {row.institute_type && (
                <Badge variant="outline">
                  {row.institute_type}
                </Badge>
              )}

              <Badge variant="secondary">
                {formatMetric(row.metric)}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {row.institute_name}
            </CardTitle>

            {row.program_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {row.program_name}
              </p>
            )}
          </div>

          <BriefcaseBusiness className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {(row.city || row.state) && (
          <p className="text-sm text-muted-foreground">
            {[row.city, row.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        <div className="rounded-2xl border p-5">
          <p className="text-xs text-muted-foreground">
            {formatMetric(row.metric)}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatValue(row.value, row.unit)}
          </p>

          {row.batch_label && (
            <p className="mt-1 text-sm text-muted-foreground">
              {row.batch_label}
            </p>
          )}
        </div>

        {row.description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {row.description}
          </p>
        )}

        {row.source_url && (
          <Button asChild size="sm" variant="outline">
            <a
              href={row.source_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {row.source_label || "View source"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatMetric(metric: string) {
  return metric
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(
  value: number | null,
  unit: string | null,
) {
  if (value === null) return "Not specified";

  if (unit?.toLowerCase() === "inr") {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  if (unit) {
    return `${Number(value).toLocaleString("en-IN")} ${unit}`;
  }

  return Number(value).toLocaleString("en-IN");
}

function Stat({
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