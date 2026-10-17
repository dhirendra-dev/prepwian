import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
  IndianRupee,
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
  "/_authenticated/jee-predictor/roi",
)({
  component: ROICalculator,
});

type ROIInput = {
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string | null;
  fee_records: number;
  fee_total: number | null;
  placement_records: number;
  average_package: number | null;
  median_package: number | null;
  highest_package: number | null;
  placement_rate: number | null;
  source_count: number;
};

function ROICalculator() {
  const [year, setYear] = React.useState("2026");
  const [institute, setInstitute] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");

  const [selected, setSelected] =
    React.useState<ROIInput | null>(null);

  const [personalCost, setPersonalCost] =
    React.useState("");

  const data = useQuery({
    queryKey: [
      "jee-roi-inputs",
      year,
      institute,
      program,
      type,
      state,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_roi_inputs",
        {
          _year: Number(year),
          _institute_search:
            institute.trim() || null,
          _program_search:
            program.trim() || null,
          _institute_type: type || null,
          _state: state || null,
          _limit: 200,
        },
      );

      if (error) throw error;

      return (data ?? []) as ROIInput[];
    },
  });

  const rows = data.data ?? [];

  const displayedCost =
    personalCost.trim() !== ""
      ? Number(personalCost)
      : selected?.fee_total ?? null;

  const averagePackage = selected?.average_package ?? null;

  const simpleRatio =
    displayedCost &&
    displayedCost > 0 &&
    averagePackage !== null
      ? averagePackage / displayedCost
      : null;

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
            <Calculator className="h-4 w-4" />
            JEE ROI calculator
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College ROI Calculator
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Compare reported education cost with reported placement
            metrics. This is a simple financial comparison, not a
            prediction of your future salary or a college ranking.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find a college or program</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setSelected(null);
                }}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setSelected(null);
                }}
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
                onChange={(e) => {
                  setState(e.target.value);
                  setSelected(null);
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search institute..."
                  value={institute}
                  onChange={(e) => {
                    setInstitute(e.target.value);
                    setSelected(null);
                  }}
                />
              </div>

              <Input
                placeholder="Program / branch..."
                value={program}
                onChange={(e) => {
                  setProgram(e.target.value);
                  setSelected(null);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {data.isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading available data...
            </CardContent>
          </Card>
        )}

        {!data.isLoading &&
          !data.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Calculator className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No matching records
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Verified fee and placement records have not
                  been imported for these filters yet.
                </p>
              </CardContent>
            </Card>
          )}

        {rows.length > 0 && !selected && (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((row) => (
              <Card
                key={`${row.institute_name}-${row.program_name}`}
                className="cursor-pointer transition hover:shadow-md"
                onClick={() => setSelected(row)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {row.institute_type && (
                          <Badge variant="outline">
                            {row.institute_type}
                          </Badge>
                        )}

                        {row.program_name && (
                          <Badge variant="secondary">
                            {row.program_name}
                          </Badge>
                        )}
                      </div>

                      <h2 className="mt-3 font-semibold">
                        {row.institute_name}
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {[
                          row.city,
                          row.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <Calculator className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MiniMetric
                      label="Reported cost"
                      value={formatINR(row.fee_total)}
                    />

                    <MiniMetric
                      label="Average package"
                      value={formatINR(
                        row.average_package,
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selected && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      {selected.institute_name}
                    </CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.program_name ||
                        "Institute-level data"}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                  >
                    Change
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Metric
                    label="Reported fee"
                    value={formatINR(
                      selected.fee_total,
                    )}
                  />

                  <Metric
                    label="Average package"
                    value={formatINR(
                      selected.average_package,
                    )}
                  />

                  <Metric
                    label="Median package"
                    value={formatINR(
                      selected.median_package,
                    )}
                  />

                  <Metric
                    label="Placement rate"
                    value={
                      selected.placement_rate === null
                        ? "Not available"
                        : `${selected.placement_rate}%`
                    }
                  />
                </div>

                <div className="rounded-2xl border p-5">
                  <h2 className="font-semibold">
                    Your cost assumption
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    You can replace the imported fee with your own
                    estimated total cost.
                  </p>

                  <div className="mt-4 max-w-md">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Total cost in ₹"
                      value={personalCost}
                      onChange={(e) =>
                        setPersonalCost(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        Cost used
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {formatINR(displayedCost)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        Average reported package
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {formatINR(averagePackage)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Simple package-to-cost ratio
                    </p>

                    <p className="mt-2 text-4xl font-bold">
                      {simpleRatio === null
                        ? "Not available"
                        : `${simpleRatio.toFixed(2)}×`}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      This calculation divides the reported average
                      package by the selected cost. It is not an
                      investment return calculation and does not
                      account for taxes, living expenses, loans,
                      interest, salary growth, placement probability,
                      or individual outcomes.
                    </p>
                  </CardContent>
                </Card>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">
                    Data coverage
                  </p>

                  <p className="mt-1 font-semibold">
                    {selected.source_count} source
                    {selected.source_count === 1
                      ? ""
                      : "s"} available
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.fee_records} fee records and{" "}
                    {selected.placement_records} placement
                    records were found for this selection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Reported packages are not guaranteed salaries, and
              the calculator should not be interpreted as a promise
              of financial return. Verify the underlying fee and
              placement reports before using the figures for an
              admission decision.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
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
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function MiniMetric({
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

function formatINR(value: number | null) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}