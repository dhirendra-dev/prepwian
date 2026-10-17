import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { requireFullAdmin } from "@/lib/admin-guard";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ArrowLeft, BarChart3, Eye, Search, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/search-analytics")({
  head: () => ({
    meta: [{ title: "Search Analytics — Admin" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },
  component: SearchAnalytics,
});

type SearchRow = {
  query: string;
  searches: number;
  unique_visitors: number;
  last_searched_at: string;
};

type Metrics = {
  total_searches: number;
  unique_queries: number;
  unique_visitors: number;
  searches_24h: number;
};

type AnalyticsRpcClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

function SearchAnalytics() {
  const queryClient = useQueryClient();
  const analyticsRpc = supabase as unknown as AnalyticsRpcClient;
  const rows = useQuery({
    queryKey: ["admin-search-analytics", "rows"],
    queryFn: async () => {
      const { data, error } = await analyticsRpc.rpc("admin_search_query_analytics", {
        p_days: 30,
        p_limit: 100,
      });
      if (error) throw error;
      return (data ?? []) as SearchRow[];
    },
    refetchInterval: 15_000,
  });
  const metrics = useQuery({
    queryKey: ["admin-search-analytics", "metrics"],
    queryFn: async () => {
      const { data, error } = await analyticsRpc.rpc("admin_search_query_metrics", {
        p_days: 30,
      });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as Metrics | null;
    },
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-search-analytics-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "search_query_events" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin-search-analytics"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const summary = metrics.data;
  const cards = [
    { label: "Searches · 30 days", value: summary?.total_searches ?? 0, icon: Search },
    { label: "Searches · last 24h", value: summary?.searches_24h ?? 0, icon: Activity },
    { label: "Unique queries", value: summary?.unique_queries ?? 0, icon: BarChart3 },
    { label: "Anonymous visitors", value: summary?.unique_visitors ?? 0, icon: Users },
  ];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Center
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">Search analytics</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  What students are looking for in the last 30 days.
                </p>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live · updates
            automatically
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <section
                key={card.label}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums">
                  {card.value.toLocaleString()}
                </p>
              </section>
            );
          })}
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold">Top searches</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Aggregated submitted searches. No IP address or device fingerprint is stored.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> 30-day window
            </span>
          </div>
          {rows.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading search activity…</p>
          ) : rows.error ? (
            <p className="p-6 text-sm text-destructive">
              Could not load search analytics. Check that the latest Supabase migration has been
              applied.
            </p>
          ) : rows.data?.length ? (
            <div className="divide-y divide-border/60">
              {rows.data.map((row, index) => (
                <div
                  key={row.query}
                  className="grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.query}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Last searched{" "}
                      {new Date(row.last_searched_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className="text-right">
                    <strong className="block text-sm tabular-nums">
                      {row.searches.toLocaleString()}
                    </strong>
                    <small className="text-[10px] text-muted-foreground">searches</small>
                  </span>
                  <span className="hidden text-right sm:block">
                    <strong className="block text-sm tabular-nums">
                      {row.unique_visitors.toLocaleString()}
                    </strong>
                    <small className="text-[10px] text-muted-foreground">visitors</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No submitted searches have been recorded yet.
            </p>
          )}
        </section>
      </main>
    </AppShell>
  );
}
