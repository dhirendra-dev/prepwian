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
  "/_authenticated/jee-predictor/cutoffs",
)({
  component: CutoffExplorer,
});

type Cutoff = {
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
};

function CutoffExplorer() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [instituteType, setInstituteType] = React.useState("");
  const [state, setState] = React.useState("");
  const [year, setYear] = React.useState("2026");

  const cutoffs = useQuery({
    queryKey: [
      "jee-cutoff-explorer",
      year,
      category,
      round,
      instituteType,
      state,
      search,
    ],

    queryFn: async () => {
      let query = supabase
        .from("jee_cutoff_data")
        .select(`
          id,
          year,
          category,
          quota,
          gender,
          round,
          opening_rank,
          closing_rank,
          program_name,
          program_code,
          jee_institutes!inner(
            institute_name,
            institute_type,
            state,
            city,
            official_url
          )
        `)
        .eq("year", Number(year))
        .eq("counselling", "JOSAA")
        .eq("category", category)
        .eq("round", Number(round))
        .order("closing_rank", {
          ascending: true,
          nullsFirst: false,
        })
        .limit(200);

      const { data, error } = await query;

      if (error) throw error;

      const rows = (data ?? []) as any[];

      const filtered = rows.filter((row) => {
        const institute = row.jee_institutes;

        const matchesType =
          !instituteType ||
          institute?.institute_type === instituteType;

        const matchesState =
          !state.trim() ||
          institute?.state
            ?.toLowerCase()
            .includes(state.trim().toLowerCase());

        const term = search.trim().toLowerCase();

        const matchesSearch =
          !term ||
          institute?.institute_name
            ?.toLowerCase()
            .includes(term) ||
          row.program_name
            ?.toLowerCase()
            .includes(term);

        return (
          matchesType &&
          matchesState &&
          matchesSearch
        );
      });

      return filtered.map((row) => ({
        id: row.id,
        institute_name:
          row.jee_institutes?.institute_name ?? "Unknown",
        institute_type:
          row.jee_institutes?.institute_type ?? null,
        state:
          row.jee_institutes?.state ?? null,
        city:
          row.jee_institutes?.city ?? null,
        program_name: row.program_name,
        program_code: row.program_code,
        category: row.category,
        quota: row.quota,
        gender: row.gender,
        round: row.round,
        opening_rank: row.opening_rank,
        closing_rank: row.closing_rank,
        official_url:
          row.jee_institutes?.official_url ?? null,
      })) as Cutoff[];
    },

    staleTime: 60_000,
  });

  const results = cutoffs.data ?? [];

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
            <Filter className="h-4 w-4" />
            JoSAA OR / CR
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Cutoff Explorer
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Search historical JoSAA opening and closing ranks by
            institute, branch, category, round and state.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search cutoffs</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="search">
                  Institute or branch
                </Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="search"
                    className="pl-9"
                    placeholder="IIT Bombay / Computer Science..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">
                  Year
                </Label>

                <select
                  id="year"
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category
                </Label>

                <select
                  id="category"
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
                <Label htmlFor="round">
                  Round
                </Label>

                <select
                  id="round"
                  value={round}
                  onChange={(e) =>
                    setRound(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      Round {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Institute type
                </Label>

                <select
                  id="type"
                  value={instituteType}
                  onChange={(e) =>
                    setInstituteType(e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    All
                  </option>
                  <option value="IIT">IIT</option>
                  <option value="NIT">NIT</option>
                  <option value="IIIT">IIIT</option>
                  <option value="GFTI">GFTI</option>
                </select>
              </div>
            </div>

            <div className="mt-5 max-w-sm space-y-2">
              <Label htmlFor="state">
                State
              </Label>

              <Input
                id="state"
                placeholder="Example: Assam"
                value={state}
                onChange={(e) =>
                  setState(e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Opening & Closing Ranks
            </h2>

            <p className="text-sm text-muted-foreground">
              {results.length} records loaded
            </p>
          </div>

          <Badge variant="secondary">
            {year} · Round {round}
          </Badge>
        </div>

        {cutoffs.isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading cutoff data...
            </CardContent>
          </Card>
        )}

        {cutoffs.isError && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium text-destructive">
                Unable to load cutoff data.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Check that the JoSAA dataset has been imported.
              </p>
            </CardContent>
          </Card>
        )}

        {!cutoffs.isLoading &&
          !cutoffs.isError &&
          results.length === 0 && (
            <Card>
              <CardContent className="flex min-h-[280px] items-center justify-center text-center">
                <div className="max-w-md space-y-3">
                  <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                  <h2 className="text-xl font-semibold">
                    No cutoff records found
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Try changing your filters. If this is the
                    first deployment, the official JoSAA OR/CR
                    dataset must be imported first.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {results.length > 0 && (
          <div className="grid gap-4">
            {results.map((item) => (
              <CutoffCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Filter className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-medium">
                  About cutoff data
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Opening and closing ranks are historical counselling
                  data. They should not be interpreted as a guarantee
                  of future admission.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CutoffCard({
  item,
}: {
  item: Cutoff;
}) {
  return (
    <Card>
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
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

            <h3 className="mt-3 text-lg font-bold">
              {item.institute_name}
            </h3>

            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {item.program_name}
            </p>

            {(item.city || item.state) && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[item.city, item.state]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                Round {item.round}
              </span>

              {item.quota && (
                <span>
                  Quota: {item.quota}
                </span>
              )}

              {item.gender && (
                <span>
                  Gender: {item.gender}
                </span>
              )}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-[300px]">
            <RankBox
              label="Opening Rank"
              value={item.opening_rank}
            />

            <RankBox
              label="Closing Rank"
              value={item.closing_rank}
            />
          </div>

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

function RankBox({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value !== null
          ? `#${value.toLocaleString()}`
          : "—"}
      </p>
    </div>
  );
}