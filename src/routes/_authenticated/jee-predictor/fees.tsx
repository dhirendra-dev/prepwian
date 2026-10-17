import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
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
  "/_authenticated/jee-predictor/fees",
)({
  component: FeeExplorer,
});

type Fee = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string | null;
  program_code: string | null;
  category: string | null;
  quota: string | null;
  fee_type: string;
  amount: number | null;
  currency: string;
  frequency: string | null;
  description: string | null;
  source_url: string | null;
  source_label: string | null;
};

function FeeExplorer() {
  const [year, setYear] = React.useState("2026");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [feeType, setFeeType] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [program, setProgram] = React.useState("");

  const fees = useQuery({
    queryKey: [
      "jee-fee-explorer",
      year,
      type,
      state,
      category,
      feeType,
      institute,
      program,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_fee_explorer",
        {
          _year: Number(year),
          _counselling: "JOSAA",
          _institute_type: type || null,
          _state: state || null,
          _category: category || null,
          _institute_search:
            institute.trim() || null,
          _program_search:
            program.trim() || null,
          _fee_type: feeType || null,
          _limit: 300,
        },
      );

      if (error) throw error;

      return (data ?? []) as Fee[];
    },
    staleTime: 60_000,
  });

  const rows = fees.data ?? [];

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
            <IndianRupee className="h-4 w-4" />
            JEE fee explorer
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College Cost & Fee Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore fee records imported into JEE Prep Hub and
            review their source information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
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
                value={feeType}
                onChange={(e) =>
                  setFeeType(e.target.value)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All fee types</option>
                <option value="TUITION">Tuition</option>
                <option value="HOSTEL">Hostel</option>
                <option value="EXAM">Exam</option>
                <option value="ADMISSION">Admission</option>
                <option value="OTHER">Other</option>
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
                label="Fee records"
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

        {fees.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading fee records...
            </CardContent>
          </Card>
        )}

        {fees.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load fee data.
            </CardContent>
          </Card>
        )}

        {!fees.isLoading &&
          !fees.isError &&
          rows.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <IndianRupee className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No fee records available
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Verified fee data has not been imported for the
                  selected filters yet. We won't display invented
                  fee figures.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((fee) => (
            <FeeCard key={fee.id} fee={fee} />
          ))}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Fees can vary by institute, category, academic year,
              program and applicable rules. Treat these as
              sourced records, not a universal estimate of total
              education cost. Verify the latest fee structure with
              the institute or official counselling authority.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeeCard({ fee }: { fee: Fee }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {fee.institute_type && (
                <Badge variant="outline">
                  {fee.institute_type}
                </Badge>
              )}

              {fee.fee_type && (
                <Badge variant="secondary">
                  {fee.fee_type}
                </Badge>
              )}
            </div>

            <CardTitle className="mt-3">
              {fee.institute_name}
            </CardTitle>

            {fee.program_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {fee.program_name}
              </p>
            )}
          </div>

          <IndianRupee className="h-6 w-6 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {(fee.city || fee.state) && (
          <p className="text-sm text-muted-foreground">
            {[fee.city, fee.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        <div className="rounded-2xl border p-5">
          <p className="text-xs text-muted-foreground">
            {fee.fee_type}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {fee.amount === null
              ? "Not specified"
              : `${fee.currency} ${Number(
                  fee.amount,
                ).toLocaleString("en-IN")}`}
          </p>

          {fee.frequency && (
            <p className="mt-1 text-sm text-muted-foreground">
              {fee.frequency}
            </p>
          )}
        </div>

        {fee.category && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Category: {fee.category}
            </Badge>

            {fee.quota && (
              <Badge variant="outline">
                Quota: {fee.quota}
              </Badge>
            )}
          </div>
        )}

        {fee.description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {fee.description}
          </p>
        )}

        {fee.source_url && (
          <Button asChild size="sm" variant="outline">
            <a
              href={fee.source_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {fee.source_label || "View source"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
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