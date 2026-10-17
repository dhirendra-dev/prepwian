import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  IndianRupee,
  MapPin,
  Search,
  Trophy,
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
  "/_authenticated/jee-predictor/comparison-360",
)({
  component: CollegeComparison360,
});

type College = {
  institute_id: string;
  institute_name: string;
  institute_code: string | null;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  official_url: string | null;
  cutoff_records: number;
  fee_records: number;
  fee_total: number | null;
  placement_records: number;
  average_package: number | null;
  median_package: number | null;
  highest_package: number | null;
  placement_rate: number | null;
  living_cost_records: number;
  source_count: number;
};

function CollegeComparison360() {
  const [year, setYear] = React.useState("2026");
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");

  const [selected, setSelected] =
    React.useState<College[]>([]);

  const colleges = useQuery({
    queryKey: [
      "jee-college-comparison-360",
      year,
      search,
      type,
      state,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_college_comparison_360",
        {
          _year: Number(year),
          _institute_search: search.trim() || null,
          _institute_type: type || null,
          _state: state || null,
          _limit: 100,
        },
      );

      if (error) throw error;

      return (data ?? []) as College[];
    },
    staleTime: 60_000,
  });

  const rows = colleges.data ?? [];

  function toggleCollege(college: College) {
    setSelected((current) => {
      const exists = current.some(
        (item) => item.institute_id === college.institute_id,
      );

      if (exists) {
        return current.filter(
          (item) =>
            item.institute_id !== college.institute_id,
        );
      }

      if (current.length >= 4) return current;

      return [...current, college];
    });
  }

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
            <Trophy className="h-4 w-4" />
            JEE College 360°
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College Comparison 360°
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Compare up to four institutes across admission data,
            fees, reported placement outcomes, living-cost
            records, location and source coverage.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find colleges</CardTitle>
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
                  placeholder="Institute or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selected.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>
                  Selected ({selected.length}/4)
                </CardTitle>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected([])}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                {selected.map((college) => (
                  <button
                    key={college.institute_id}
                    type="button"
                    onClick={() => toggleCollege(college)}
                    className="rounded-xl border p-4 text-left transition hover:bg-muted"
                  >
                    <p className="font-semibold">
                      {college.institute_name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        college.city,
                        college.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {colleges.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading institutes...
            </CardContent>
          </Card>
        )}

        {colleges.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load comparison data.
            </CardContent>
          </Card>
        )}

        {!colleges.isLoading &&
          !colleges.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No institute records available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  The institute directory has not been populated
                  for these filters yet.
                </p>
              </CardContent>
            </Card>
          )}

        {rows.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((college) => {
              const isSelected = selected.some(
                (item) =>
                  item.institute_id === college.institute_id,
              );

              return (
                <Card
                  key={college.institute_id}
                  className={
                    isSelected
                      ? "border-primary"
                      : undefined
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {college.institute_type && (
                            <Badge variant="outline">
                              {college.institute_type}
                            </Badge>
                          )}

                          {college.institute_code && (
                            <Badge variant="secondary">
                              {college.institute_code}
                            </Badge>
                          )}
                        </div>

                        <h2 className="mt-3 font-semibold">
                          {college.institute_name}
                        </h2>

                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[
                            college.city,
                            college.state,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={
                          isSelected
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          toggleCollege(college)
                        }
                        disabled={
                          !isSelected &&
                          selected.length >= 4
                        }
                      >
                        {isSelected
                          ? "Selected"
                          : "Compare"}
                      </Button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MiniMetric
                        label="Fee records"
                        value={college.fee_records}
                      />

                      <MiniMetric
                        label="Cutoff records"
                        value={college.cutoff_records}
                      />

                      <MiniMetric
                        label="Placement records"
                        value={college.placement_records}
                      />

                      <MiniMetric
                        label="Living records"
                        value={college.living_cost_records}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selected.length >= 2 && (
          <ComparisonTable colleges={selected} />
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              This comparison displays available records side by
              side. It does not assign an overall score, rank the
              institutes, or declare one college better than
              another.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComparisonTable({
  colleges,
}: {
  colleges: College[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>360° Comparison</CardTitle>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b p-3 text-left">
                Metric
              </th>

              {colleges.map((college) => (
                <th
                  key={college.institute_id}
                  className="border-b p-3 text-left"
                >
                  {college.institute_name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <CompareRow
              label="Type"
              colleges={colleges}
              value={(c) => c.institute_type || "—"}
            />

            <CompareRow
              label="Location"
              colleges={colleges}
              value={(c) =>
                [c.city, c.state]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />

            <CompareRow
              label="Fee records"
              colleges={colleges}
              value={(c) =>
                Number(c.fee_records).toLocaleString()
              }
            />

            <CompareRow
              label="Reported fee total"
              colleges={colleges}
              value={(c) =>
                formatINR(c.fee_total)
              }
            />

            <CompareRow
              label="Average package"
              colleges={colleges}
              value={(c) =>
                formatINR(c.average_package)
              }
            />

            <CompareRow
              label="Median package"
              colleges={colleges}
              value={(c) =>
                formatINR(c.median_package)
              }
            />

            <CompareRow
              label="Highest package"
              colleges={colleges}
              value={(c) =>
                formatINR(c.highest_package)
              }
            />

            <CompareRow
              label="Placement rate"
              colleges={colleges}
              value={(c) =>
                c.placement_rate === null
                  ? "Not available"
                  : `${c.placement_rate}%`
              }
            />

            <CompareRow
              label="Cutoff records"
              colleges={colleges}
              value={(c) =>
                Number(
                  c.cutoff_records,
                ).toLocaleString()
              }
            />

            <CompareRow
              label="Living-cost records"
              colleges={colleges}
              value={(c) =>
                Number(
                  c.living_cost_records,
                ).toLocaleString()
              }
            />

            <CompareRow
              label="Source records"
              colleges={colleges}
              value={(c) =>
                Number(c.source_count).toLocaleString()
              }
            />

            <tr>
              <td className="border-b p-3 font-medium">
                Official website
              </td>

              {colleges.map((college) => (
                <td
                  key={college.institute_id}
                  className="border-b p-3"
                >
                  {college.official_url ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <a
                        href={college.official_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  ) : (
                    "Not available"
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CompareRow({
  label,
  colleges,
  value,
}: {
  label: string;
  colleges: College[];
  value: (college: College) => string;
}) {
  return (
    <tr>
      <td className="border-b p-3 font-medium">
        {label}
      </td>

      {colleges.map((college) => (
        <td
          key={college.institute_id}
          className="border-b p-3"
        >
          {value(college)}
        </td>
      ))}
    </tr>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {Number(value).toLocaleString()}
      </p>
    </div>
  );
}

function formatINR(value: number | null) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}