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
  "/_authenticated/jee-predictor/branches",
)({
  component: BranchExplorer,
});

type BranchResult = {
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
  { value: "OPEN", label: "OPEN / CRL" },
  { value: "EWS", label: "EWS" },
  { value: "OBC-NCL", label: "OBC-NCL" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
];

function BranchExplorer() {
  const [rank, setRank] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [instituteSearch, setInstituteSearch] = React.useState("");
  const [programSearch, setProgramSearch] = React.useState("");

  const numericRank = Number(rank);

  const branches = useQuery({
    queryKey: [
      "jee-branch-predictions",
      numericRank,
      category,
      round,
      instituteSearch,
      programSearch,
    ],

    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_branch_predictions",
        {
          _rank: numericRank,
          _year: 2026,
          _counselling: "JOSAA",
          _category: category,
          _quota: null,
          _round: Number(round),
          _institute_search:
            instituteSearch.trim() || null,
          _program_search:
            programSearch.trim() || null,
          _limit: 100,
        },
      );

      if (error) throw error;

      return (data ?? []) as BranchResult[];
    },

    enabled: numericRank > 0,
    staleTime: 60_000,
  });

  const results = branches.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/jee-predictor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              JEE Predictor
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Target className="h-4 w-4" />
            JoSAA 2026
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Branch Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Enter your JEE rank and explore IIT, NIT, IIIT and other
            JoSAA institutes with their historical opening and closing
            ranks.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Prediction filters
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              {/* Rank */}
              <div className="space-y-2">
                <Label htmlFor="rank">
                  JEE Rank
                </Label>

                <Input
                  id="rank"
                  type="number"
                  min="1"
                  placeholder="Example: 5000"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category
                </Label>

                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Round */}
              <div className="space-y-2">
                <Label htmlFor="round">
                  JoSAA Round
                </Label>

                <select
                  id="round"
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      Round {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Institute */}
              <div className="space-y-2">
                <Label htmlFor="institute">
                  Institute
                </Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="institute"
                    className="pl-9"
                    placeholder="IIT Bombay..."
                    value={instituteSearch}
                    onChange={(e) =>
                      setInstituteSearch(e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label htmlFor="program">
                  Branch / Program
                </Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="program"
                    className="pl-9"
                    placeholder="Computer Science..."
                    value={programSearch}
                    onChange={(e) =>
                      setProgramSearch(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {!rank && (
          <Card>
            <CardContent className="flex min-h-[300px] items-center justify-center text-center">
              <div className="max-w-md space-y-3">
                <Target className="mx-auto h-10 w-10 text-muted-foreground" />

                <h2 className="text-xl font-semibold">
                  Enter your JEE rank
                </h2>

                <p className="text-sm text-muted-foreground">
                  We'll compare your rank with historical JoSAA
                  opening and closing ranks.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {branches.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Finding matching branches...
            </CardContent>
          </Card>
        )}

        {branches.isError && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium text-destructive">
                Could not load branch predictions.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Please try again in a moment.
              </p>
            </CardContent>
          </Card>
        )}

        {!branches.isLoading &&
          rank &&
          !branches.isError &&
          results.length === 0 && (
            <Card>
              <CardContent className="flex min-h-[300px] items-center justify-center text-center">
                <div className="max-w-lg space-y-3">
                  <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                  <h2 className="text-xl font-semibold">
                    No historical matches found
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Try another round, category, institute, branch,
                    or rank.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {results.length > 0 && (
          <>
            {/* Result summary */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  Historical branch matches
                </h2>

                <p className="text-sm text-muted-foreground">
                  Showing up to {results.length} results for rank{" "}
                  <span className="font-medium text-foreground">
                    #{numericRank.toLocaleString()}
                  </span>
                </p>
              </div>

              <Badge variant="secondary">
                {results.length} results
              </Badge>
            </div>

            {/* Cards */}
            <div className="grid gap-4">
              {results.map((item) => (
                <BranchCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </>
        )}

        {/* Disclaimer */}
        <Card>
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Target className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="space-y-2">
                <p className="font-medium">
                  How to interpret these results
                </p>

                <p className="text-sm leading-6 text-muted-foreground">
                  These results compare your rank against historical
                  JoSAA opening and closing ranks. They are not a
                  guarantee of admission. Actual allotment depends on
                  the official counselling process, seat availability,
                  category, quota, gender pool, round and other
                  applicable rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BranchCard({
  item,
}: {
  item: BranchResult;
}) {
  const isWithinRange =
    item.opening_rank !== null &&
    item.closing_rank !== null &&
    item.opening_rank <= item.closing_rank;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Institute */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {item.institute_type || "Institute"}
              </Badge>

              {item.fit === "Within historical range" && (
                <Badge>
                  Within historical range
                </Badge>
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

                {[item.city, item.state]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                Category: {item.category}
              </span>

              {item.quota && (
                <span>• Quota: {item.quota}</span>
              )}

              {item.gender && (
                <span>• Gender: {item.gender}</span>
              )}

              <span>• Round {item.round}</span>
            </div>
          </div>

          {/* Ranks */}
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-[280px]">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Opening Rank
              </p>

              <p className="mt-1 text-xl font-bold">
                {item.opening_rank !== null
                  ? `#${item.opening_rank.toLocaleString()}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Closing Rank
              </p>

              <p className="mt-1 text-xl font-bold">
                {item.closing_rank !== null
                  ? `#${item.closing_rank.toLocaleString()}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Official link */}
          {item.official_url && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0"
            >
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