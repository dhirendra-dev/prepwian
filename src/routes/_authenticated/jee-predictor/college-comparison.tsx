import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  GitCompareArrows,
  MapPin,
  Plus,
  Search,
  Trash2,
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
  "/_authenticated/jee-predictor/college-comparison",
)({
  component: CollegeComparison,
});

type College = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  official_url: string | null;
  program_name: string;
  program_code: string | null;
  category: string;
  quota: string | null;
  round: number | null;
  opening_rank: number | null;
  closing_rank: number | null;
  seat_records: number;
};

function CollegeComparison() {
  const [year, setYear] = React.useState("2026");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [instituteSearch, setInstituteSearch] = React.useState("");
  const [programSearch, setProgramSearch] = React.useState("");
  const [selected, setSelected] = React.useState<College[]>([]);

  const colleges = useQuery({
    queryKey: [
      "jee-college-comparison",
      year,
      category,
      round,
      instituteSearch,
      programSearch,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_college_comparison",
        {
          _year: Number(year),
          _counselling: "JOSAA",
          _category: category,
          _round: Number(round),
          _institute_search:
            instituteSearch.trim() || null,
          _program_search:
            programSearch.trim() || null,
          _limit: 100,
        },
      );

      if (error) throw error;

      return (data ?? []) as College[];
    },
    staleTime: 60_000,
  });

  const addCollege = (college: College) => {
    if (selected.some((item) => item.id === college.id)) {
      return;
    }

    if (selected.length >= 4) {
      return;
    }

    setSelected((current) => [...current, college]);
  };

  const removeCollege = (id: string) => {
    setSelected((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const clearAll = () => setSelected([]);

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
            <GitCompareArrows className="h-4 w-4" />
            JEE comparison
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            College Comparison
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Select up to four institute and branch choices and
            compare their available JEE data side-by-side.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find colleges</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
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
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="OPEN">OPEN</option>
                <option value="EWS">GEN-EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>

              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {[1, 2, 3, 4, 5].map((item) => (
                  <option key={item} value={item}>
                    Round {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search institute..."
                  value={instituteSearch}
                  onChange={(e) =>
                    setInstituteSearch(e.target.value)
                  }
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search branch/program..."
                  value={programSearch}
                  onChange={(e) =>
                    setProgramSearch(e.target.value)
                  }
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
                  Comparison ({selected.length}/4)
                </CardTitle>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <div
                  className="grid min-w-[900px] gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${selected.length}, minmax(220px, 1fr))`,
                  }}
                >
                  {selected.map((college) => (
                    <ComparisonCard
                      key={college.id}
                      college={college}
                      onRemove={() =>
                        removeCollege(college.id)
                      }
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Available choices
            </h2>

            <p className="text-sm text-muted-foreground">
              {colleges.data?.length ?? 0} records found
            </p>
          </div>

          <Badge variant="secondary">
            {selected.length}/4 selected
          </Badge>
        </div>

        {colleges.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading colleges...
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
          (colleges.data ?? []).length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No comparison data found
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  The required official cutoff dataset may not
                  have been imported yet, or your filters returned
                  no records.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="grid gap-4 md:grid-cols-2">
          {(colleges.data ?? []).map((college) => {
            const alreadySelected = selected.some(
              (item) => item.id === college.id,
            );

            return (
              <Card key={college.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {college.institute_type && (
                          <Badge variant="outline">
                            {college.institute_type}
                          </Badge>
                        )}

                        <Badge variant="secondary">
                          {college.category}
                        </Badge>
                      </div>

                      <h3 className="font-semibold">
                        {college.institute_name}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {college.program_name}
                      </p>

                      {(college.city || college.state) && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[college.city, college.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      disabled={
                        alreadySelected ||
                        selected.length >= 4
                      }
                      onClick={() => addCollege(college)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {alreadySelected
                        ? "Added"
                        : "Compare"}
                    </Button>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Stat
                      label="Opening rank"
                      value={
                        college.opening_rank?.toLocaleString() ??
                        "—"
                      }
                    />

                    <Stat
                      label="Closing rank"
                      value={
                        college.closing_rank?.toLocaleString() ??
                        "—"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              This comparison uses historical JEE/JoSAA records
              imported into JEE Prep Hub. Historical opening and
              closing ranks are not an admission guarantee.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComparisonCard({
  college,
  onRemove,
}: {
  college: College;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            {college.institute_type && (
              <Badge variant="outline">
                {college.institute_type}
              </Badge>
            )}

            <Badge variant="secondary">
              {college.category}
            </Badge>
          </div>

          <h3 className="mt-3 font-semibold">
            {college.institute_name}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {college.program_name}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Remove from comparison"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        <CompareRow
          label="Opening rank"
          value={
            college.opening_rank?.toLocaleString() ?? "—"
          }
        />

        <CompareRow
          label="Closing rank"
          value={
            college.closing_rank?.toLocaleString() ?? "—"
          }
        />

        <CompareRow
          label="Location"
          value={
            [college.city, college.state]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />

        <CompareRow
          label="Seat records"
          value={college.seat_records.toLocaleString()}
        />
      </div>

      {college.official_url && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-5 w-full"
        >
          <a
            href={college.official_url}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Official website
          </a>
        </Button>
      )}
    </div>
  );
}

function Stat({
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

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}

function CompareRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}