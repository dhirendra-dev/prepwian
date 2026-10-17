import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Info,
  MapPin,
  Search,
  Target,
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
  "/_authenticated/jee-predictor/admission-fit",
)({
  component: AdmissionFit,
});

type Result = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  program_code: string | null;
  category: string;
  quota: string | null;
  round: number | null;
  opening_rank: number | null;
  closing_rank: number | null;
  fit_status: string;
  rank_gap: number | null;
  source_url: string | null;
};

function AdmissionFit() {
  const [rank, setRank] = React.useState("");
  const [year, setYear] = React.useState("2026");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [type, setType] = React.useState("");
  const [state, setState] = React.useState("");
  const [program, setProgram] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [submittedRank, setSubmittedRank] = React.useState<number | null>(
    null,
  );

  const results = useQuery({
    queryKey: [
      "jee-admission-fit",
      submittedRank,
      year,
      category,
      round,
      type,
      state,
      program,
      institute,
    ],
    enabled: submittedRank !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_admission_fit",
        {
          _rank: submittedRank,
          _year: Number(year),
          _counselling: "JOSAA",
          _category: category,
          _quota: null,
          _round: Number(round),
          _institute_type: type || null,
          _state: state || null,
          _program_search: program.trim() || null,
          _institute_search: institute.trim() || null,
          _limit: 200,
        },
      );

      if (error) throw error;

      return (data ?? []) as Result[];
    },
  });

  const analyze = () => {
    const value = Number(rank);

    if (!Number.isInteger(value) || value <= 0) {
      return;
    }

    setSubmittedRank(value);
  };

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
            <Target className="h-4 w-4" />
            JEE admission analysis
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Admission Fit Analyzer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Enter your rank and compare it with historical JoSAA
            opening and closing ranks.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your rank & preferences</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  JEE rank
                </label>

                <Input
                  type="number"
                  min="1"
                  placeholder="Example: 25000"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Year
                </label>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="GEN-EWS">GEN-EWS</option>
                  <option value="OBC-NCL">OBC-NCL</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  JoSAA round
                </label>

                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((item) => (
                    <option key={item} value={item}>
                      Round {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search institute"
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
                  placeholder="Search branch"
                  value={program}
                  onChange={(e) =>
                    setProgram(e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              onClick={analyze}
              disabled={!rank}
              className="w-full md:w-auto"
            >
              <Target className="mr-2 h-4 w-4" />
              Analyze historical fit
            </Button>
          </CardContent>
        </Card>

        {submittedRank !== null && (
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

              <p className="text-sm leading-6 text-muted-foreground">
                Analysis for rank{" "}
                <strong className="text-foreground">
                  {submittedRank.toLocaleString()}
                </strong>{" "}
                using {year} JoSAA historical data, Round{" "}
                {round}, category {category}.
              </p>
            </CardContent>
          </Card>
        )}

        {results.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Analyzing historical cutoff ranges...
            </CardContent>
          </Card>
        )}

        {results.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to analyze the historical data.
            </CardContent>
          </Card>
        )}

        {submittedRank !== null &&
          !results.isLoading &&
          !results.isError &&
          (results.data ?? []).length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="mt-4 text-xl font-semibold">
                  No historical records found
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing the category, round or search
                  filters.
                </p>
              </CardContent>
            </Card>
          )}

        {(results.data ?? []).length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {(results.data ?? []).map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">
                  Important
                </p>

                <p>
                  This is a historical-fit analysis, not a
                  probability model or admission guarantee.
                  Actual counselling outcomes depend on the
                  applicable year's ranks, seat availability,
                  preferences, category, quota and JoSAA rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultCard({ item }: { item: Result }) {
  const inside =
    item.fit_status === "Inside historical range";

  const near =
    item.fit_status === "Near historical closing range";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              {item.institute_type && (
                <Badge variant="outline">
                  {item.institute_type}
                </Badge>
              )}

              <Badge variant="secondary">
                {item.category}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {item.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {item.program_name}
            </p>
          </div>

          {inside ? (
            <CheckCircle2 className="h-6 w-6 shrink-0" />
          ) : (
            <Target className="h-6 w-6 shrink-0 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <Badge
          variant={
            inside
              ? "default"
              : near
                ? "secondary"
                : "outline"
          }
        >
          {item.fit_status}
        </Badge>

        {(item.city || item.state) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />

            {[item.city, item.state]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              Opening rank
            </p>

            <p className="mt-1 font-semibold">
              {item.opening_rank?.toLocaleString() ?? "—"}
            </p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              Closing rank
            </p>

            <p className="mt-1 font-semibold">
              {item.closing_rank?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>

        {item.rank_gap !== null && (
          <p className="text-xs text-muted-foreground">
            Closing-rank difference:{" "}
            {item.rank_gap > 0 ? "+" : ""}
            {item.rank_gap.toLocaleString()}
          </p>
        )}

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            View source
          </a>
        )}
      </CardContent>
    </Card>
  );
}