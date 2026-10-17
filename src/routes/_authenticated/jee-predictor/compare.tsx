import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
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
  "/_authenticated/jee-predictor/compare",
)({
  component: BranchComparison,
});

type Branch = {
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
  fit?: string | null;
  official_url: string | null;
};

function BranchComparison() {
  const [rank, setRank] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Branch[]>([]);

  const numericRank = Number(rank);

  const results = useQuery({
    queryKey: [
      "jee-branch-comparison",
      numericRank,
      category,
      round,
      search,
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
          _institute_search: search.trim() || null,
          _program_search: null,
          _limit: 50,
        },
      );

      if (error) throw error;

      return (data ?? []) as Branch[];
    },

    enabled: numericRank > 0,
    staleTime: 60_000,
  });

  const addBranch = (branch: Branch) => {
    if (selected.some((item) => item.id === branch.id)) {
      return;
    }

    if (selected.length >= 4) {
      return;
    }

    setSelected((prev) => [...prev, branch]);
  };

  const removeBranch = (id: string) => {
    setSelected((prev) =>
      prev.filter((item) => item.id !== id),
    );
  };

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
            <BarChart3 className="h-4 w-4" />
            JEE 2026
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Branch Comparison
          </h1>

          <p className="max-w-3xl text-muted-foreground">
            Compare up to four IIT, NIT, IIIT or GFTI branches using
            historical JoSAA opening and closing ranks.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find branches to compare</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
                  onChange={(e) =>
                    setRank(e.target.value)
                  }
                />
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
                  <option value="EWS">
                    EWS
                  </option>
                  <option value="OBC-NCL">
                    OBC-NCL
                  </option>
                  <option value="SC">
                    SC
                  </option>
                  <option value="ST">
                    ST
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round">
                  JoSAA Round
                </Label>

                <select
                  id="round"
                  value={round}
                  onChange={(e) =>
                    setRound(e.target.value)
                  }
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

              <div className="space-y-2">
                <Label htmlFor="search">
                  Search institute
                </Label>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="search"
                    className="pl-9"
                    placeholder="IIT Bombay..."
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

        {selected.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  Comparison
                </CardTitle>

                <Badge variant="secondary">
                  {selected.length}/4 selected
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-medium">
                        Metric
                      </th>

                      {selected.map((branch) => (
                        <th
                          key={branch.id}
                          className="min-w-[220px] p-3 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">
                                {branch.institute_name}
                              </p>

                              <p className="mt-1 text-xs font-normal text-muted-foreground">
                                {branch.program_name}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeBranch(branch.id)
                              }
                              aria-label="Remove branch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <ComparisonRow
                      label="Opening Rank"
                      values={selected.map((item) =>
                        formatRank(item.opening_rank),
                      )}
                    />

                    <ComparisonRow
                      label="Closing Rank"
                      values={selected.map((item) =>
                        formatRank(item.closing_rank),
                      )}
                    />

                    <ComparisonRow
                      label="Category"
                      values={selected.map(
                        (item) => item.category,
                      )}
                    />

                    <ComparisonRow
                      label="Quota"
                      values={selected.map(
                        (item) => item.quota || "—",
                      )}
                    />

                    <ComparisonRow
                      label="Round"
                      values={selected.map((item) =>
                        String(item.round),
                      )}
                    />

                    <ComparisonRow
                      label="Location"
                      values={selected.map((item) =>
                        [item.city, item.state]
                          .filter(Boolean)
                          .join(", ") || "—",
                      )}
                    />

                    <tr className="border-b">
                      <td className="p-3 font-medium">
                        Official
                      </td>

                      {selected.map((item) => (
                        <td
                          key={item.id}
                          className="p-3"
                        >
                          {item.official_url ? (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <a
                                href={item.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open
                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Available branches
              </h2>

              <p className="text-sm text-muted-foreground">
                Select up to four branches.
              </p>
            </div>
          </div>

          {!rank && (
            <Card>
              <CardContent className="flex min-h-[220px] items-center justify-center text-center">
                <div className="max-w-md space-y-3">
                  <Building2 className="mx-auto h-9 w-9 text-muted-foreground" />

                  <h3 className="text-lg font-semibold">
                    Enter your rank first
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    We'll load historical branches that can be
                    compared.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {results.isLoading && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Loading branches...
              </CardContent>
            </Card>
          )}

          {results.isError && (
            <Card>
              <CardContent className="py-10 text-center text-destructive">
                Unable to load branches.
              </CardContent>
            </Card>
          )}

          {!results.isLoading &&
            rank &&
            !results.isError &&
            results.data?.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No matching historical branches found.
                </CardContent>
              </Card>
            )}

          <div className="grid gap-3">
            {results.data?.map((branch) => {
              const alreadySelected = selected.some(
                (item) => item.id === branch.id,
              );

              return (
                <Card key={branch.id}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {branch.institute_type ||
                            "Institute"}
                        </Badge>

                        {branch.fit ===
                          "Within historical range" && (
                          <Badge>
                            Historical match
                          </Badge>
                        )}
                      </div>

                      <h3 className="mt-2 font-semibold">
                        {branch.institute_name}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {branch.program_name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>
                          Opening:{" "}
                          {formatRank(
                            branch.opening_rank,
                          )}
                        </span>

                        <span>
                          Closing:{" "}
                          {formatRank(
                            branch.closing_rank,
                          )}
                        </span>

                        <span>
                          Round {branch.round}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        addBranch(branch)
                      }
                      disabled={
                        alreadySelected ||
                        selected.length >= 4
                      }
                      className="shrink-0"
                    >
                      {alreadySelected ? (
                        "Selected"
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Compare
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Comparison uses historical JoSAA opening and closing
              ranks. It does not guarantee admission or determine
              future counselling outcomes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <tr className="border-b">
      <td className="p-3 font-medium">
        {label}
      </td>

      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="p-3"
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function formatRank(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `#${value.toLocaleString()}`;
}