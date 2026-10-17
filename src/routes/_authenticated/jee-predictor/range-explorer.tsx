import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Filter,
  MapPin,
  Search,
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute(
  "/_authenticated/jee-predictor/range-explorer",
)({
  component: RangeExplorer,
});

type Result = {
  id: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  program_name: string;
  category: string;
  quota: string | null;
  round: number;
  opening_rank: number;
  closing_rank: number;
  rank_gap: number | null;
  range_status: string;
  official_url: string | null;
};

function RangeExplorer() {
  const [rank, setRank] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [instituteType, setInstituteType] =
    React.useState("");
  const [state, setState] = React.useState("");
  const [search, setSearch] = React.useState("");

  const numericRank = Number(rank);

  const validRank =
    rank !== "" &&
    Number.isInteger(numericRank) &&
    numericRank > 0;

  const results = useQuery({
    queryKey: [
      "jee-cutoff-range-analysis",
      numericRank,
      category,
      round,
      instituteType,
      state,
      search,
    ],
    enabled: validRank,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_cutoff_range_analysis",
        {
          _rank: numericRank,
          _year: 2026,
          _counselling: "JOSAA",
          _category: category,
          _quota: null,
          _round: Number(round),
          _institute_type:
            instituteType || null,
          _state: state || null,
          _program_search:
            search.trim() || null,
          _limit: 100,
        },
      );

      if (error) throw error;

      return (data ?? []) as Result[];
    },
    staleTime: 60_000,
  });

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
            <Target className="h-4 w-4" />
            Historical rank analysis
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Cutoff & College Range Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Enter a rank and explore JoSAA historical cutoff
            ranges for institutes and programs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search parameters
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rank">
                  JEE Rank
                </Label>

                <Input
                  id="rank"
                  type="number"
                  min={1}
                  placeholder="Example: 5000"
                  value={rank}
                  onChange={(e) =>
                    setRank(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="OPEN">
                    OPEN / CRL
                  </option>
                  <option value="EWS">EWS</option>
                  <option value="OBC-NCL">
                    OBC-NCL
                  </option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>JoSAA Round</Label>

                <select
                  value={round}
                  onChange={(e) =>
                    setRound(e.target.value)
                  }
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
                <Label>Institute type</Label>

                <select
                  value={instituteType}
                  onChange={(e) =>
                    setInstituteType(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All institutes</option>
                  <option value="IIT">IIT</option>
                  <option value="NIT">NIT</option>
                  <option value="IIIT">IIIT</option>
                  <option value="GFTI">GFTI</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>State</Label>

                <Input
                  placeholder="Example: Assam"
                  value={state}
                  onChange={(e) =>
                    setState(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Institute / Branch</Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    className="pl-9"
                    placeholder="IIT Bombay / CSE"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!validRank && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="mx-auto h-10 w-10 text-muted-foreground" />

              <p className="mt-4 font-medium">
                Enter your JEE rank to explore historical ranges.
              </p>
            </CardContent>
          </Card>
        )}

        {validRank && results.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Searching historical cutoff data...
            </CardContent>
          </Card>
        )}

        {results.isError && (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              Unable to load cutoff data.
            </CardContent>
          </Card>
        )}

        {validRank &&
          !results.isLoading &&
          !results.isError &&
          results.data?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="font-medium">
                  No historical records found.
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  This may mean the relevant JoSAA dataset has
                  not been imported yet or your filters returned
                  no records.
                </p>
              </CardContent>
            </Card>
          )}

        {results.data && results.data.length > 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">
                Historical matches
              </h2>

              <p className="text-sm text-muted-foreground">
                Rank #{numericRank.toLocaleString()} · JoSAA 2026
              </p>
            </div>

            <div className="grid gap-5">
              {results.data.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  rank={numericRank}
                />
              ))}
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              This tool compares your rank with historical opening
              and closing ranks. Being inside a historical range
              does not guarantee admission because seat availability,
              category, quota, gender, round, preferences and future
              cutoff movement can differ.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultCard({
  item,
  rank,
}: {
  item: Result;
  rank: number;
}) {
  const inside =
    rank >= item.opening_rank &&
    rank <= item.closing_rank;

  const betterThanOpening =
    rank < item.opening_rank;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

              <Badge variant="outline">
                Round {item.round}
              </Badge>
            </div>

            <CardTitle className="mt-3">
              {item.institute_name}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {item.program_name}
            </p>
          </div>

          <Badge>
            {inside
              ? "Inside historical range"
              : betterThanOpening
                ? "Better than historical opening"
                : "Outside historical range"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
              Your rank
            </p>

            <p className="mt-1 text-xl font-bold">
              #{rank.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
              Historical opening
            </p>

            <p className="mt-1 text-xl font-bold">
              #{item.opening_rank.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
              Historical closing
            </p>

            <p className="mt-1 text-xl font-bold">
              #{item.closing_rank.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {(item.city || item.state) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[item.city, item.state]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}

          {item.quota && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {item.quota}
            </span>
          )}
        </div>

        {item.official_url && (
          <a
            href={item.official_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            Institute website
          </a>
        )}
      </CardContent>
    </Card>
  );
}