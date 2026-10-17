import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  ExternalLink,
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
  "/_authenticated/jee-predictor/living-costs",
)({
  component: LivingCostExplorer,
});

type LivingCost = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  cost_type: string;
  amount: number | null;
  currency: string;
  frequency: string | null;
  category: string | null;
  description: string | null;
  source_url: string | null;
  source_label: string | null;
};

function LivingCostExplorer() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [costType, setCostType] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [institute, setInstitute] = React.useState("");

  const costs = useQuery({
    queryKey: [
      "jee-living-costs",
      year,
      type,
      state,
      costType,
      category,
      institute,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_living_cost_explorer",
        {
          _year: Number(year),
          _institute_type: type || null,
          _state: state || null,
          _institute_search:
            institute.trim() || null,
          _cost_type: costType || null,
          _category: category || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as LivingCost[];
    },
    staleTime: 60_000,
  });

  const rows = costs.data ?? [];

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
            <BedDouble className="h-4 w-4" />
            JEE living-cost explorer
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Hostel & Living Cost Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore sourced hostel, mess and living-cost records
            associated with JEE institutes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={costType}
                onChange={(e) =>
                  setCostType(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All cost types</option>
                <option value="HOSTEL">Hostel</option>
                <option value="MESS">Mess</option>
                <option value="FOOD">Food</option>
                <option value="ACCOMMODATION">
                  Accommodation
                </option>
                <option value="TRANSPORT">
                  Transport
                </option>
                <option value="OTHER">Other</option>
              </select>

              <Input
                placeholder="Category..."
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Cost records"
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
                label="Cost categories"
                value={
                  new Set(
                    rows.map((row) => row.cost_type),
                  ).size
                }
              />
            </div>
          </CardContent>
        </Card>

        {costs.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading living-cost records...
            </CardContent>
          </Card>
        )}

        {costs.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load living-cost data.
            </CardContent>
          </Card>
        )}

        {!costs.isLoading &&
          !costs.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <IndianRupee className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No living-cost records available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Verified hostel and living-cost data has not
                  been imported for the selected filters yet.
                  JEE Prep Hub will not invent these figures.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((row) => (
            <LivingCostCard
              key={row.id}
              row={row}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Hostel, mess and living expenses can vary by room
              type, academic year, campus rules, personal spending
              and local prices. Treat the displayed figures as
              sourced records rather than a guaranteed total cost
              of living.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LivingCostCard({
  row,
}: {
  row: LivingCost;
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
                {formatLabel(row.cost_type)}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {row.institute_name}
            </CardTitle>
          </div>

          <BedDouble className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {[row.city, row.state]
            .filter(Boolean)
            .join(", ") ||
            "Location not available"}
        </p>

        <div className="rounded-2xl border p-5">
          <p className="text-xs text-muted-foreground">
            {formatLabel(row.cost_type)}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatAmount(row.amount, row.currency)}
          </p>

          {row.frequency && (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatLabel(row.frequency)}
            </p>
          )}
        </div>

        {row.category && (
          <Badge variant="outline">
            {formatLabel(row.category)}
          </Badge>
        )}

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

function formatAmount(
  amount: number | null,
  currency: string,
) {
  if (amount === null) return "Not specified";

  if (currency === "INR") {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }

  return `${currency} ${Number(
    amount,
  ).toLocaleString("en-IN")}`;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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