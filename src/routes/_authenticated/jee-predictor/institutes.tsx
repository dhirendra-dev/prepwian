import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Search,
  SlidersHorizontal,
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
  "/_authenticated/jee-predictor/institutes",
)({
  component: InstituteDirectory,
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
  cutoff_count: number;
  seat_record_count: number;
};

function InstituteDirectory() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [search, setSearch] = React.useState("");

  const institutes = useQuery({
    queryKey: [
      "jee-institute-directory",
      year,
      type,
      state,
      search,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_institute_directory",
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
        <Button asChild variant="ghost" size="sm">
          <Link to="/jee-predictor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            JEE Predictor
          </Link>
        </Button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Building2 className="h-4 w-4" />
            JoSAA institute directory
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            IIT, NIT, IIIT & GFTI Directory
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Search institutes, locations and the JEE data available
            for each institute in PREPWIAN.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Search directory
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Year</Label>

                <select
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Institute type</Label>

                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    All types
                  </option>
                  <option value="IIT">IIT</option>
                  <option value="NIT">NIT</option>
                  <option value="IIIT">IIIT</option>
                  <option value="GFTI">GFTI</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>State</Label>

                <Input
                  placeholder="Example: Assam"
                  value={state}
                  onChange={(e) =>
                    setState(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Search</Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    className="pl-9"
                    placeholder="IIT Bombay..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {institutes.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading institute directory...
            </CardContent>
          </Card>
        )}

        {institutes.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load the institute directory.
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
                  No institutes found
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  The institute dataset may not have been imported
                  yet, or your filters returned no records.
                </p>
              </CardContent>
            </Card>
          )}

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Institutes
                </h2>

                <p className="text-sm text-muted-foreground">
                  {rows.length} results
                </p>
              </div>

              <Badge variant="secondary">
                JoSAA {year}
              </Badge>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {rows.map((institute) => (
                <InstituteCard
                  key={institute.id}
                  institute={institute}
                />
              ))}
            </div>
          </>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Program, cutoff and seat counts represent records
              currently imported into PREPWIAN. A missing count
              does not mean the institute itself lacks those
              programs or seats.
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
    <Card className="transition-shadow hover:shadow-md">
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

          <Building2 className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {(institute.city || institute.state) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />

            {[institute.city, institute.state]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <DataBox
            label="Programs"
            value={institute.program_count}
          />

          <DataBox
            label="Cutoffs"
            value={institute.cutoff_count}
          />

          <DataBox
            label="Seat records"
            value={institute.seat_record_count}
          />
        </div>

        <div className="flex flex-wrap gap-2">
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

          <Button asChild size="sm">
            <Link to="/jee-predictor/college">
              View predictor
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DataBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-3 text-center">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}