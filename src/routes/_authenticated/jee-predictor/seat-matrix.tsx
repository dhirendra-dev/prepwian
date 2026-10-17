import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Filter,
  MapPin,
  Search,
  Users,
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
  "/_authenticated/jee-predictor/seat-matrix",
)({
  component: SeatMatrixExplorer,
});

type SeatRow = {
  id: string;
  year: number;
  counselling: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  program_code: string | null;
  category: string | null;
  quota: string | null;
  gender: string | null;
  seat_type: string | null;
  seats: number | null;
  source_url: string | null;
  source_label: string | null;
};

function SeatMatrixExplorer() {
  const [year, setYear] = React.useState("2026");
  const [instituteType, setInstituteType] =
    React.useState("");
  const [state, setState] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [instituteSearch, setInstituteSearch] =
    React.useState("");

  const seatMatrix = useQuery({
    queryKey: [
      "jee-seat-matrix",
      year,
      instituteType,
      state,
      category,
      search,
      instituteSearch,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_seat_matrix",
        {
          _year: Number(year),
          _counselling: "JOSAA",
          _institute_type:
            instituteType || null,
          _state: state || null,
          _category: category || null,
          _quota: null,
          _program_search:
            search.trim() || null,
          _institute_search:
            instituteSearch.trim() || null,
          _limit: 200,
        },
      );

      if (error) throw error;

      return (data ?? []) as SeatRow[];
    },
    staleTime: 60_000,
  });

  const rows = seatMatrix.data ?? [];

  const totalSeats = rows.reduce(
    (sum, row) => sum + (row.seats ?? 0),
    0,
  );

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
            <Users className="h-4 w-4" />
            JoSAA counselling data
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Seat Matrix Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore seat availability by institute, program,
            category, quota and other JoSAA seat-matrix fields.
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
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                  value={instituteType}
                  onChange={(e) =>
                    setInstituteType(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    All institutes
                  </option>
                  <option value="IIT">IIT</option>
                  <option value="NIT">NIT</option>
                  <option value="IIIT">IIIT</option>
                  <option value="GFTI">GFTI</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All categories</option>
                  <option value="OPEN">OPEN</option>
                  <option value="EWS">EWS</option>
                  <option value="OBC-NCL">
                    OBC-NCL
                  </option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
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
                <Label>Institute</Label>

                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    className="pl-9"
                    placeholder="IIT Bombay"
                    value={instituteSearch}
                    onChange={(e) =>
                      setInstituteSearch(
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Program / Branch</Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    className="pl-9"
                    placeholder="Computer Science"
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

        {!seatMatrix.isLoading &&
          !seatMatrix.isError &&
          rows.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Records"
                value={rows.length}
              />

              <StatCard
                label="Seats in results"
                value={totalSeats}
              />

              <StatCard
                label="Institutes"
                value={
                  new Set(
                    rows.map(
                      (row) => row.institute_name,
                    ),
                  ).size
                }
              />
            </div>
          )}

        {seatMatrix.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading JoSAA seat matrix...
            </CardContent>
          </Card>
        )}

        {seatMatrix.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load the seat matrix.
            </CardContent>
          </Card>
        )}

        {!seatMatrix.isLoading &&
          !seatMatrix.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No seat-matrix records found
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  The selected dataset may not have been imported
                  yet, or the current filters returned no records.
                </p>
              </CardContent>
            </Card>
          )}

        {rows.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">
              Seat records
            </h2>

            <div className="grid gap-4">
              {rows.map((row) => (
                <SeatCard
                  key={row.id}
                  row={row}
                />
              ))}
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Seat counts are displayed only from imported JoSAA
              seat-matrix records. The explorer does not estimate
              seats or imply that a particular seat will be available
              during counselling.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SeatCard({
  row,
}: {
  row: SeatRow;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {row.institute_type && (
                <Badge variant="outline">
                  {row.institute_type}
                </Badge>
              )}

              {row.category && (
                <Badge variant="secondary">
                  {row.category}
                </Badge>
              )}

              {row.quota && (
                <Badge variant="outline">
                  {row.quota}
                </Badge>
              )}

              {row.gender && (
                <Badge variant="outline">
                  {row.gender}
                </Badge>
              )}
            </div>

            <CardTitle className="mt-3">
              {row.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {row.program_name}
            </p>
          </div>

          <div className="rounded-xl border px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Seats
            </p>

            <p className="text-2xl font-bold">
              {row.seats ?? "—"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {(row.city || row.state) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[row.city, row.state]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}

          {row.seat_type && (
            <span>
              Seat type: {row.seat_type}
            </span>
          )}

          <span>
            JoSAA {row.year}
          </span>
        </div>

        {row.source_url && (
          <a
            href={row.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            Official source
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-2xl font-bold">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}