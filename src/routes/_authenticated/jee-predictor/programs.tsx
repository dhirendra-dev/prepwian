import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
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
  "/_authenticated/jee-predictor/programs",
)({
  component: ProgramExplorer,
});

type Program = {
  institute_id: string;
  institute_name: string;
  institute_code: string | null;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  official_url: string | null;
  program_name: string;
  program_code: string | null;
  category_count: number;
  cutoff_record_count: number;
  min_opening_rank: number | null;
  max_closing_rank: number | null;
  source_count: number;
};

function ProgramExplorer() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [program, setProgram] = React.useState("");

  const programs = useQuery({
    queryKey: [
      "jee-academic-program-explorer",
      year,
      type,
      state,
      category,
      institute,
      program,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_academic_program_explorer",
        {
          _year: Number(year),
          _counselling: "JOSAA",
          _institute_type: type || null,
          _state: state || null,
          _institute_search:
            institute.trim() || null,
          _program_search:
            program.trim() || null,
          _category: category || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as Program[];
    },
    staleTime: 60_000,
  });

  const rows = programs.data ?? [];

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
            <BookOpen className="h-4 w-4" />
            JEE academic programs
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Academic Program Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Browse branches and academic programs linked to
            institute and counselling records.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find a program</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
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

              <Input
                placeholder="State..."
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All categories</option>
                <option value="OPEN">OPEN</option>
                <option value="GEN-EWS">GEN-EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search institute or city..."
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
                  placeholder="Search branch / program..."
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
                label="Programs"
                value={rows.length}
              />

              <Stat
                label="Institutes"
                value={
                  new Set(
                    rows.map((row) => row.institute_id),
                  ).size
                }
              />

              <Stat
                label="Source-backed programs"
                value={
                  rows.filter(
                    (row) => Number(row.source_count) > 0,
                  ).length
                }
              />
            </div>
          </CardContent>
        </Card>

        {programs.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading academic programs...
            </CardContent>
          </Card>
        )}

        {programs.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load program data.
            </CardContent>
          </Card>
        )}

        {!programs.isLoading &&
          !programs.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No program records available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  The cutoff/program dataset has not been populated
                  for these filters yet.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((row) => (
            <ProgramCard
              key={`${row.institute_id}-${row.program_name}-${row.program_code ?? ""}`}
              program={row}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Opening and closing ranks shown here are summaries
              of the available cutoff records, not a guarantee of
              admission. Always check the relevant counselling
              round, category, quota and seat type.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProgramCard({
  program,
}: {
  program: Program;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {program.institute_type && (
                <Badge variant="outline">
                  {program.institute_type}
                </Badge>
              )}

              {program.program_code && (
                <Badge variant="secondary">
                  {program.program_code}
                </Badge>
              )}
            </div>

            <CardTitle className="mt-3">
              {program.program_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {program.institute_name}
            </p>
          </div>

          <BookOpen className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {[program.city, program.state]
            .filter(Boolean)
            .join(", ") ||
            "Location not available"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Cutoff records"
            value={Number(
              program.cutoff_record_count,
            ).toLocaleString()}
          />

          <Metric
            label="Categories"
            value={Number(
              program.category_count,
            ).toLocaleString()}
          />

          <Metric
            label="Lowest opening rank"
            value={
              program.min_opening_rank === null
                ? "—"
                : Number(
                    program.min_opening_rank,
                  ).toLocaleString()
            }
          />

          <Metric
            label="Highest closing rank"
            value={
              program.max_closing_rank === null
                ? "—"
                : Number(
                    program.max_closing_rank,
                  ).toLocaleString()
            }
          />
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">
            Data sources
          </p>

          <p className="mt-1 font-semibold">
            {Number(program.source_count).toLocaleString()}
          </p>
        </div>

        {program.official_url && (
          <Button asChild size="sm" variant="outline">
            <a
              href={program.official_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Institute website
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
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