import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
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
  "/_authenticated/jee-predictor/campus",
)({
  component: CampusExplorer,
});

type Institute = {
  id: string;
  institute_code: string | null;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  official_url: string | null;
  program_count: number;
  cutoff_record_count: number;
  fee_record_count: number;
  placement_record_count: number;
};

function CampusExplorer() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [search, setSearch] = React.useState("");

  const institutes = useQuery({
    queryKey: [
      "jee-campus-explorer",
      year,
      type,
      state,
      search,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_campus_explorer",
        {
          _year: Number(year),
          _institute_type: type || null,
          _state: state || null,
          _search: search.trim() || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as Institute[];
    },
    staleTime: 60_000,
  });

  const rows = institutes.data ?? [];

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
            <MapPin className="h-4 w-4" />
            JEE campus explorer
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College Location & Campus Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore JEE institutes by location and see which
            admission, fee and placement datasets are available.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find an institute</CardTitle>
          </CardHeader>

          <CardContent>
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

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Institute, code or city..."
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
              <Stat
                label="Institutes"
                value={rows.length}
              />

              <Stat
                label="With official websites"
                value={
                  rows.filter(
                    (row) => !!row.official_url,
                  ).length
                }
              />

              <Stat
                label="States represented"
                value={
                  new Set(
                    rows
                      .map((row) => row.state)
                      .filter(Boolean),
                  ).size
                }
              />
            </div>
          </CardContent>
        </Card>

        {institutes.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading institutes...
            </CardContent>
          </Card>
        )}

        {institutes.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load institute data.
            </CardContent>
          </Card>
        )}

        {!institutes.isLoading &&
          !institutes.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No institutes available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  The institute directory has not been populated
                  for these filters yet.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((institute) => (
            <InstituteCard
              key={institute.id}
              institute={institute}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Location information comes from the PREPWIAN
              institute directory. Official websites are provided
              as navigation links where available. No campus
              facilities or rankings are inferred from location
              alone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InstituteCard({
  institute,
}: {
  institute: Institute;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {institute.institute_type && (
                <Badge variant="outline">
                  {institute.institute_type}
                </Badge>
              )}

              {institute.institute_code && (
                <Badge variant="secondary">
                  {institute.institute_code}
                </Badge>
              )}
            </div>

            <CardTitle className="mt-3">
              {institute.institute_name}
            </CardTitle>
          </div>

          <MapPin className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />

            <div>
              <p className="font-medium">
                {[institute.city, institute.state]
                  .filter(Boolean)
                  .join(", ") ||
                  "Location not available"}
              </p>

              {institute.state && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {institute.state}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <DataCount
            label="Cutoffs"
            value={institute.cutoff_record_count}
          />

          <DataCount
            label="Fees"
            value={institute.fee_record_count}
          />

          <DataCount
            label="Placements"
            value={institute.placement_record_count}
          />
        </div>

        {institute.official_url && (
          <Button asChild size="sm" variant="outline">
            <a
              href={institute.official_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Official website
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DataCount({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-3 text-center">
      <p className="text-lg font-bold">
        {Number(value).toLocaleString()}
      </p>

      <p className="text-xs text-muted-foreground">
        {label}
      </p>
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