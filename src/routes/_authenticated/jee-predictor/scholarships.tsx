import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
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
  "/_authenticated/jee-predictor/scholarships",
)({
  component: ScholarshipExplorer,
});

type Scholarship = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  scholarship_name: string;
  scholarship_type: string;
  eligibility: string | null;
  category: string | null;
  benefit_amount: number | null;
  benefit_currency: string;
  benefit_frequency: string | null;
  tuition_waiver_percent: number | null;
  applicable_programs: string | null;
  application_method: string | null;
  application_deadline: string | null;
  description: string | null;
  source_url: string | null;
  source_label: string | null;
};

function ScholarshipExplorer() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [scholarshipType, setScholarshipType] =
    React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [search, setSearch] = React.useState("");

  const scholarships = useQuery({
    queryKey: [
      "jee-scholarship-explorer",
      year,
      type,
      state,
      category,
      scholarshipType,
      institute,
      search,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_scholarship_explorer",
        {
          _year: Number(year),
          _institute_type: type || null,
          _state: state || null,
          _institute_search:
            institute.trim() || null,
          _category: category || null,
          _scholarship_type:
            scholarshipType || null,
          _search: search.trim() || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as Scholarship[];
    },
    staleTime: 60_000,
  });

  const rows = scholarships.data ?? [];

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
            <GraduationCap className="h-4 w-4" />
            JEE scholarship explorer
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Scholarships & Fee Waivers
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Find sourced scholarship and fee-concession
            information associated with JEE institutes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search scholarships</CardTitle>
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

              <Input
                placeholder="Institute..."
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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

              <select
                value={scholarshipType}
                onChange={(e) =>
                  setScholarshipType(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  All scholarship types
                </option>
                <option value="SCHOLARSHIP">
                  Scholarship
                </option>
                <option value="FEE_WAIVER">
                  Fee waiver
                </option>
                <option value="FREESHIP">
                  Freeship
                </option>
                <option value="FINANCIAL_AID">
                  Financial aid
                </option>
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search scholarship or eligibility..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
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
                label="Scholarships"
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
                label="With sources"
                value={
                  rows.filter(
                    (row) => !!row.source_url,
                  ).length
                }
              />
            </div>
          </CardContent>
        </Card>

        {scholarships.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading scholarship records...
            </CardContent>
          </Card>
        )}

        {scholarships.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load scholarship data.
            </CardContent>
          </Card>
        )}

        {!scholarships.isLoading &&
          !scholarships.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No scholarship records available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Verified scholarship and fee-waiver records have
                  not been imported for these filters yet.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((row) => (
            <ScholarshipCard
              key={row.id}
              scholarship={row}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Eligibility, benefit amounts and deadlines can change
              between academic years. Always verify the current
              rules and application process from the original
              institute or scholarship authority.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScholarshipCard({
  scholarship,
}: {
  scholarship: Scholarship;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {scholarship.institute_type && (
                <Badge variant="outline">
                  {scholarship.institute_type}
                </Badge>
              )}

              <Badge variant="secondary">
                {formatLabel(
                  scholarship.scholarship_type,
                )}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {scholarship.scholarship_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {scholarship.institute_name}
            </p>
          </div>

          <GraduationCap className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {scholarship.benefit_amount !== null && (
          <div className="rounded-2xl border p-5">
            <p className="text-xs text-muted-foreground">
              Benefit
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatAmount(
                scholarship.benefit_amount,
                scholarship.benefit_currency,
              )}
            </p>

            {scholarship.benefit_frequency && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatLabel(
                  scholarship.benefit_frequency,
                )}
              </p>
            )}
          </div>
        )}

        {scholarship.tuition_waiver_percent !== null && (
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
              Tuition waiver
            </p>

            <p className="mt-1 text-2xl font-bold">
              {scholarship.tuition_waiver_percent}%
            </p>
          </div>
        )}

        <div className="space-y-3">
          {scholarship.category && (
            <Info
              label="Category"
              value={scholarship.category}
            />
          )}

          {scholarship.eligibility && (
            <Info
              label="Eligibility"
              value={scholarship.eligibility}
            />
          )}

          {scholarship.applicable_programs && (
            <Info
              label="Applicable programs"
              value={scholarship.applicable_programs}
            />
          )}

          {scholarship.application_method && (
            <Info
              label="Application"
              value={scholarship.application_method}
            />
          )}

          {scholarship.application_deadline && (
            <Info
              label="Deadline"
              value={scholarship.application_deadline}
            />
          )}
        </div>

        {scholarship.description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {scholarship.description}
          </p>
        )}

        {scholarship.source_url && (
          <Button asChild size="sm" variant="outline">
            <a
              href={scholarship.source_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {scholarship.source_label ||
                "View official source"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6">
        {value}
      </p>
    </div>
  );
}

function formatAmount(
  amount: number,
  currency: string,
) {
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