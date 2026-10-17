import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
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
  "/_authenticated/jee-predictor/scholarship-checker",
)({
  component: ScholarshipChecker,
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
  eligibility_match: string;
};

function ScholarshipChecker() {
  const [year, setYear] = React.useState("2026");
  const [category, setCategory] = React.useState("");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [search, setSearch] = React.useState("");

  const results = useQuery({
    queryKey: [
      "jee-scholarship-checker",
      year,
      category,
      type,
      state,
      program,
      institute,
      search,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_scholarship_eligibility",
        {
          _year: Number(year),
          _category: category || null,
          _institute_type: type || null,
          _state: state || null,
          _program: program.trim() || null,
          _institute_search:
            institute.trim() || null,
          _search: search.trim() || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as Scholarship[];
    },
    staleTime: 60_000,
  });

  const rows = results.data ?? [];

  const matches = rows.filter(
    (row) => row.eligibility_match === "CATEGORY_MATCH",
  );

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
            <CheckCircle2 className="h-4 w-4" />
            Eligibility checker
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            JEE Scholarship Eligibility Checker
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Enter your basic details to filter the scholarship
            records available in JEE Prep Hub.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
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
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  Select category
                </option>
                <option value="OPEN">OPEN</option>
                <option value="GEN-EWS">GEN-EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Program / branch..."
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />

              <Input
                placeholder="Institute..."
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
                placeholder="Search scholarship..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {category && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />

                <div>
                  <p className="font-semibold">
                    Category filter
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Showing scholarship records matching{" "}
                    {category}, where the dataset contains
                    category information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Matching records"
                value={matches.length}
              />

              <Stat
                label="Records requiring review"
                value={
                  rows.filter(
                    (row) =>
                      row.eligibility_match ===
                      "REVIEW_REQUIRED",
                  ).length
                }
              />

              <Stat
                label="Institutes"
                value={
                  new Set(
                    rows.map((row) => row.institute_name),
                  ).size
                }
              />
            </div>
          </CardContent>
        </Card>

        {results.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Checking available scholarships...
            </CardContent>
          </Card>
        )}

        {results.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to check scholarship data.
            </CardContent>
          </Card>
        )}

        {!results.isLoading &&
          !results.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No matching records
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  There are no sourced scholarship records for
                  these filters yet.
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
              A category match is only a dataset-level match. It
              does not independently verify income limits,
              academic requirements, domicile, disability status,
              documentation or other conditions that may appear in
              the scholarship's official rules. Check the source
              before applying.
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
  const categoryMatch =
    scholarship.eligibility_match === "CATEGORY_MATCH";

  return (
    <Card
      className={
        categoryMatch
          ? "border-primary/50"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {categoryMatch ? (
                <Badge>
                  Category match
                </Badge>
              ) : (
                <Badge variant="outline">
                  Review eligibility
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
              Reported benefit
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

        <div className="space-y-4">
          {scholarship.eligibility && (
            <Info
              label="Eligibility information"
              value={scholarship.eligibility}
            />
          )}

          {scholarship.category && (
            <Info
              label="Recorded category"
              value={scholarship.category}
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
              label="Application method"
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
                "Verify source"}
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