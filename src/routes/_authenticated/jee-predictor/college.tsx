import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
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

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/jee-predictor/college")({
  head: () => ({
    meta: [
      { title: "JEE College Predictor — JEE Prep Hub" },
      {
        name: "description",
        content:
          "Explore JEE college and branch possibilities using rank and historical JoSAA cutoff data.",
      },
    ],
  }),
  component: CollegePredictorPage,
});

type CollegeResult = {
  id: string;
  year: number;
  counselling: string;
  institute_name: string;
  institute_type: string | null;
  state: string | null;
  city: string | null;
  official_url: string | null;
  program_name: string;
  program_code: string | null;
  category: string;
  quota: string | null;
  gender: string | null;
  round: number;
  opening_rank: number | null;
  closing_rank: number | null;
};

const CATEGORIES = [
  { value: "OPEN", label: "OPEN" },
  { value: "EWS", label: "GEN-EWS" },
  { value: "OBC-NCL", label: "OBC-NCL" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
];

const ROUNDS = [1, 2, 3, 4, 5];

function CollegePredictorPage() {
  const [rank, setRank] = React.useState("");
  const [category, setCategory] = React.useState("OPEN");
  const [round, setRound] = React.useState("5");
  const [search, setSearch] = React.useState("");
  const [state, setState] = React.useState("");

  const numericRank = Number(rank);

  const validRank =
    Number.isInteger(numericRank) && numericRank > 0;

  const results = useQuery({
    queryKey: [
      "jee-college-predictor",
      numericRank,
      category,
      round,
      search,
      state,
    ],
    enabled: validRank,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_jee_college_predictions",
        {
          _rank: numericRank,
          _year: 2026,
          _counselling: "JOSAA",
          _category: category,
          _quota: null,
          _round: Number(round),
          _program_search: search.trim() || null,
          _state: state || null,
          _limit: 100,
        },
      );

      if (error) throw error;

      return (data ?? []) as CollegeResult[];
    },
    staleTime: 60_000,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <section className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <a
                href="/jee-predictor"
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                JEE Predictor
              </a>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="font-display text-3xl font-bold">
                    College Predictor
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Explore institutes and branches around your rank.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              JoSAA 2026 · Round {round}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />

            <h2 className="font-semibold">
              Your admission profile
            </h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="JEE Main rank">
              <input
                type="number"
                min="1"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="e.g. 25000"
                className="h-12 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="JoSAA round">
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ROUNDS.map((item) => (
                  <option key={item} value={item}>
                    Round {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Institute / branch">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="CSE, NIT, IIT..."
                  className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </Field>
          </div>

          <div className="mt-4 max-w-sm">
            <Field label="State">
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Optional — e.g. Assam"
                className="h-12 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>

          <div className="mt-5 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            Entering a rank is required. Results are based on the
            historical cutoff records available in JEE Prep Hub and
            should not be treated as a guaranteed allotment.
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Results
              </p>

              <h2 className="mt-1 font-display text-2xl font-bold">
                Possible colleges & branches
              </h2>
            </div>

            {results.data && (
              <span className="text-xs text-muted-foreground">
                {results.data.length} result
                {results.data.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {!validRank ? (
            <EmptyState
              icon={Target}
              title="Enter your rank"
              description="Add your JEE Main rank above to explore historical college and branch possibilities."
            />
          ) : results.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-2xl border border-border/60 bg-card"
                />
              ))}
            </div>
          ) : results.isError ? (
            <EmptyState
              icon={Target}
              title="Could not load predictions"
              description="Please try again. If the problem continues, the prediction dataset or database function may need attention."
            />
          ) : results.data?.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No matching records yet"
              description="The predictor is ready, but this rank/category combination does not currently have matching cutoff data in the JEE Prep Hub dataset."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.data?.map((item) => (
                <CollegeCard
                  key={item.id}
                  item={item}
                  userRank={numericRank}
                />
              ))}
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <section className="rounded-[2rem] border border-border/60 bg-card p-5 shadow-soft">
          <p className="text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">
              Important:
            </strong>{" "}
            Historical opening/closing ranks describe previous
            counselling outcomes. They do not guarantee admission in
            a future round. Actual allocation depends on the applicable
            year's seat matrix, candidate preferences, category,
            quota, eligibility, business rules and other counselling
            conditions.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}

function CollegeCard({
  item,
  userRank,
}: {
  item: CollegeResult;
  userRank: number;
}) {
  const closing = item.closing_rank ?? 0;
  const opening = item.opening_rank ?? 0;

  let fit = "Historical match";

  if (closing > 0 && userRank <= closing) {
    const distance = closing - userRank;

    if (distance > closing * 0.35) {
      fit = "Within historical closing range";
    } else {
      fit = "Near historical closing rank";
    }
  }

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            {item.institute_type || "Institute"}
          </span>

          <h3 className="mt-1 font-display text-lg font-bold leading-snug">
            {item.institute_name}
          </h3>
        </div>

        {item.official_url && (
          <a
            href={item.official_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${item.institute_name} official website`}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 p-3">
        <p className="text-sm font-semibold leading-5">
          {item.program_name}
        </p>

        {item.program_code && (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {item.program_code}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Opening
          </p>

          <p className="mt-1 font-semibold">
            {opening
              ? opening.toLocaleString("en-IN")
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Closing
          </p>

          <p className="mt-1 font-semibold">
            {closing
              ? closing.toLocaleString("en-IN")
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {item.state && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {item.state}
          </span>
        )}

        {item.quota && (
          <span className="rounded-full bg-muted px-2 py-1">
            {item.quota}
          </span>
        )}

        <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
          {fit}
        </span>
      </div>
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-border/60 bg-card p-10 text-center shadow-soft">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}