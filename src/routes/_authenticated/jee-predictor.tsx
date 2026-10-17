import * as React from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Info,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/jee-predictor")({
  head: () => ({
    meta: [
      { property: "og:title", content: "JEE Predictor — PREPWIAN" },
      { property: "og:description", content: "Estimate your JEE Main rank from your NTA percentile and explore your preparation targets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "JEE Predictor — PREPWIAN" },
      { name: "twitter:description", content: "Estimate your JEE Main rank from your NTA percentile and explore your preparation targets." },

      { title: "JEE Predictor — PREPWIAN" },
      {
        name: "description",
        content:
          "Estimate your JEE Main rank from your NTA percentile and explore your preparation targets.",
      },
    ],
  }),
  component: JEEPredictorPage,
});

type PredictionModel = {
  exam: string;
  year: number;
  metric: string;
  category: string | null;
  candidates_count: number;
  model_data: {
    method?: string;
    candidate_count?: number;
    formula?: string;
  };
  source_url: string | null;
  source_label: string | null;
  notes: string | null;
};

function JEEPredictorPage() {
  const childMatches = useChildMatches();
  const [percentile, setPercentile] = React.useState("");

  const model = useQuery({
    queryKey: ["jee-prediction-model", "JEE_MAIN", 2026],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jee_prediction_models")
        .select(
          "exam,year,metric,category,candidates_count,model_data,source_url,source_label,notes",
        )
        .eq("exam", "JEE_MAIN")
        .eq("year", 2026)
        .eq("metric", "PERCENTILE_TO_RANK")
        .eq("category", "ALL")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      return data as PredictionModel | null;
    },
    staleTime: 10 * 60 * 1000,
  });

  const value = Number(percentile);

  const validPercentile =
    Number.isFinite(value) && value >= 0 && value <= 100;

  let estimatedRank: number | null = null;

  if (validPercentile && model.data?.candidates_count) {
    if (value === 100) {
      estimatedRank = 1;
    } else {
      estimatedRank =
        Math.ceil(
          ((100 - value) / 100) * model.data.candidates_count,
        ) + 1;
    }
  }

  const rankRange =
    estimatedRank !== null
      ? {
          lower: Math.max(
            1,
            Math.floor(estimatedRank * 0.9),
          ),
          upper: Math.ceil(estimatedRank * 1.1),
        }
      : null;
if (childMatches.length > 0) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
}
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <section className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                JEE Intelligence
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                JEE Predictor
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Estimate your JEE Main rank from your NTA percentile and
                understand where your current performance stands.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-7 w-7" />
            </div>
          </div>
        </section>

        {/* Predictor */}
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calculator className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-display text-xl font-bold">
                  JEE Main Rank Predictor
                </h2>
                <p className="text-xs text-muted-foreground">
                  Paper 1 · B.E./B.Tech.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <label
                htmlFor="percentile"
                className="text-sm font-semibold"
              >
                Enter your NTA percentile
              </label>

              <div className="relative mt-2">
                <input
                  id="percentile"
                  type="number"
                  min="0"
                  max="100"
                  step="0.0000001"
                  value={percentile}
                  onChange={(event) =>
                    setPercentile(event.target.value)
                  }
                  placeholder="e.g. 98.5421"
                  className="h-14 w-full rounded-2xl border border-border bg-background px-4 pr-12 text-lg font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  %
                </span>
              </div>

              {percentile && !validPercentile && (
                <p className="mt-2 text-xs font-medium text-destructive">
                  Enter a percentile between 0 and 100.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-muted/50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <p className="text-xs leading-5 text-muted-foreground">
                  This tool provides an estimated rank range based on
                  historical/official candidate-count data. It is not an
                  official NTA rank calculator.
                </p>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-[2rem] border border-border/60 bg-primary p-6 text-primary-foreground shadow-soft sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75">
              Estimated result
            </p>

            {estimatedRank !== null ? (
              <>
                <div className="mt-6">
                  <p className="text-sm opacity-80">
                    Approximate AIR
                  </p>

                  <p className="mt-1 font-display text-5xl font-bold tracking-tight">
                    #{estimatedRank.toLocaleString("en-IN")}
                  </p>
                </div>

                {rankRange && (
                  <div className="mt-6 rounded-2xl bg-white/10 p-4">
                    <p className="text-xs opacity-75">
                      Indicative range
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      #{rankRange.lower.toLocaleString("en-IN")} — #
                      {rankRange.upper.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Based on {model.data?.candidates_count.toLocaleString(
                      "en-IN",
                    )} unique candidates
                  </span>
                </div>
              </>
            ) : (
              <div className="mt-8">
                <p className="text-2xl font-bold">
                  Enter your percentile
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 opacity-80">
                  Your estimated rank and indicative range will appear
                  here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* What next */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              More tools
            </p>

            <h2 className="mt-1 font-display text-2xl font-bold">
              Continue your JEE analysis
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ToolCard
              icon={TrendingUp}
              title="College Predictor"
              description="Find institutes and branches using your rank."
              comingSoon
            />

            <ToolCard
              icon={Target}
              title="Branch Explorer"
              description="Explore historical opening and closing ranks."
              comingSoon
            />

            <ToolCard
              icon={Calculator}
              title="Cutoff Explorer"
              description="Compare JoSAA cutoff data by year and round."
              comingSoon
            />
          </div>
        </section>

        {/* Methodology */}
        <section className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div>
              <h3 className="font-semibold">
                About this prediction
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The current model uses the total unique candidates who
                appeared across both JEE Main 2026 sessions as its
                candidate-count basis. Actual NTA rank assignment can
                differ because of the official percentile, tie-breaking
                and ranking methodology.
              </p>

              {model.data?.source_label && (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Source: {model.data.source_label}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ToolCard({
  icon: Icon,
  title,
  description,
  comingSoon,
}: {
  icon: typeof Target;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        {comingSoon && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Coming soon
          </span>
        )}
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>

      <p className="mt-1 text-sm leading-5 text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
        Planned
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
