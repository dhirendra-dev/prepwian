import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/nit-iiit-gfti",
)({
  component: NitIiitGftiPredictor,
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
  gender: string | null;
  round: number;
  opening_rank: number | null;
  closing_rank: number | null;
  official_url: string | null;
  fit: string;
};

const categories = [
  ["OPEN", "OPEN / CRL"],
  ["EWS", "EWS"],
  ["OBC-NCL", "OBC-NCL"],
  ["SC", "SC"],
  ["ST", "ST"],
];

const instituteTypes = [
  ["", "All NIT / IIIT / GFTI"],
  ["NIT", "NIT"],
  ["IIIT", "IIIT"],
  ["GFTI", "GFTI"],
];

function NitIiitGftiPredictor() {
  const [rank, setRank] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [instituteType, setInstituteType] = React.useState("");
  const [state, setState] = React.useState("");
  const [program, setProgram] = React.useState("");

  const numericRank = Number(rank);

  const query = useQuery({
    queryKey: [
      "jee-nit-iiit-gfti-predictor",
      numericRank,
      category,
      round,
      instituteType,
      state,
      program,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_nit_iiit_gfti_predictions",
        {
          _rank: numericRank,
          _year: 2026,
          _counselling: "JOSAA",
          _category: category,
          _quota: null,
          _round: Number(round),
          _institute_type: instituteType || null,
          _state: state.trim() || null,
          _program_search: program.trim() || null,
          _limit: 100,
        },
      );

      if (error) throw error;
      return (data ?? []) as Result[];
    },
    enabled: numericRank > 0,
    staleTime: 60_000,
  });

  const results = query.data ?? [];

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
            JoSAA 2026
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            NIT / IIIT / GFTI Predictor
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Explore historical JoSAA closing ranks for NITs, IIITs and
            Other-GFTIs based on your JEE rank.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Prediction filters
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="rank">JEE Rank</Label>
                <Input
                  id="rank"
                  type="number"
                  min="1"
                  placeholder="Example: 12000"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Institute type</Label>
                <select
                  id="type"
                  value={instituteType}
                  onChange={(e) => setInstituteType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {instituteTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round">JoSAA Round</Label>
                <select
                  id="round"
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      Round {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Example: Assam"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Branch</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="program"
                    className="pl-9"
                    placeholder="CSE, ECE..."
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!rank && (
          <Card>
            <CardContent className="flex min-h-[280px] items-center justify-center text-center">
              <div className="max-w-md space-y-3">
                <Target className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="text-xl font-semibold">
                  Enter your JEE rank
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your historical NIT, IIIT and GFTI matches will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {query.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Searching historical JoSAA cutoffs...
            </CardContent>
          </Card>
        )}

        {query.isError && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium text-destructive">
                Unable to load predictions.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please try again.
              </p>
            </CardContent>
          </Card>
        )}

        {!query.isLoading &&
          rank &&
          !query.isError &&
          results.length === 0 && (
            <Card>
              <CardContent className="flex min-h-[280px] items-center justify-center text-center">
                <div className="max-w-md space-y-3">
                  <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">
                    No historical matches found
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Try changing the institute type, category, round,
                    state or branch.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {results.length > 0 && (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Historical matches
                </h2>
                <p className="text-sm text-muted-foreground">
                  Rank #{numericRank.toLocaleString()} · {results.length}{" "}
                  results
                </p>
              </div>

              <Badge variant="secondary">
                {results.length} matches
              </Badge>
            </div>

            <div className="grid gap-4">
              {results.map((item) => (
                <ResultCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Target className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-2">
                <p className="font-medium">
                  Important
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  These are historical cutoff comparisons, not admission
                  guarantees. Actual seat allotment depends on the official
                  JoSAA counselling process, seat availability, category,
                  quota, gender pool and other applicable rules.
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
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {item.institute_type || "Institute"}
              </Badge>

              {item.fit === "Within historical range" && (
                <Badge>Within historical range</Badge>
              )}

              {item.fit === "Near historical range" && (
                <Badge variant="secondary">
                  Near historical range
                </Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold md:text-xl">
                {item.institute_name}
              </h3>

              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {item.program_name}
              </p>
            </div>

            {(item.city || item.state) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[item.city, item.state].filter(Boolean).join(", ")}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Category: {item.category}</span>
              {item.quota && <span>• Quota: {item.quota}</span>}
              {item.gender && <span>• Gender: {item.gender}</span>}
              <span>• Round {item.round}</span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-[280px]">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Opening
              </p>
              <p className="mt-1 text-xl font-bold">
                {item.opening_rank
                  ? `#${item.opening_rank.toLocaleString()}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Closing
              </p>
              <p className="mt-1 text-xl font-bold">
                {item.closing_rank
                  ? `#${item.closing_rank.toLocaleString()}`
                  : "—"}
              </p>
            </div>
          </div>

          {item.official_url && (
            <Button asChild variant="outline" size="sm">
              <a
                href={item.official_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}