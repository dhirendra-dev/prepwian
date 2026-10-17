import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { getTestPointsLeaderboard, type TestRankRow } from "@/lib/scheduled-tests.functions";
import { GlassSurface } from "@/components/GlassSurface";
import { Podium } from "@/components/progress/Podium";

export const Route = createFileRoute("/tests/leaderboard/")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Test Series Ranking — JEE Prep Hub" },
      { name: "twitter:description", content: "See who leads on total test points across all JEE mock tests." },

      { title: "Test Series Ranking — Points Leaderboard | JEE Prep Hub" },
      { name: "description", content: "Overall Test Series ranking for JEE Prep Hub: total points earned across every CBT mock test, tests attempted and average accuracy." },
      { property: "og:title", content: "Test Series Ranking — JEE Prep Hub" },
      { property: "og:description", content: "See who leads on total test points across all JEE mock tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestRanks,
});

function TestRanks() {
  const fn = useServerFn(getTestPointsLeaderboard);
  const { data, isLoading } = useQuery({ queryKey: ["test-points-lb"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h1 className="font-display text-xl font-bold sm:text-2xl">Test Series ranking</h1>
          </div>
          <Link to="/tests" className="text-xs text-muted-foreground hover:underline">← Test Series</Link>
        </div>

        <GlassSurface className="overflow-hidden">
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-warning/40 bg-warning/10 text-warning">
              <Trophy className="h-7 w-7" />
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold">Leaderboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See where you stand among {(data?.rows ?? []).length.toLocaleString()} ranked aspirants
            </p>
            {data?.myRank && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2">
                <span className="font-display text-xl font-bold text-primary">#{data.myRank}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your rank</span>
              </div>
            )}
          </div>
          <div className="border-t border-border/60 px-3 py-5">
            <Podium
              entries={(data?.rows ?? []).slice(0, 3).map((r: TestRankRow) => ({
                userId: r.user_id,
                name: r.full_name ?? r.username ?? "Aspirant",
                avatarUrl: r.avatar_url,
                value: Number(r.total_points).toFixed(0),
                valueLabel: "points",
              }))}
            />
          </div>
        </GlassSurface>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top scorers overall</CardTitle>
              <p className="text-xs text-muted-foreground">Best score per test, summed across all tests.</p>
            </CardHeader>
            <CardContent className="p-0">
              {(data?.rows ?? []).length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No test submissions yet.</div>
              ) : (
                <ul className="divide-y">
                  {(data?.rows ?? []).map((row: TestRankRow, i: number) => (
                    <li key={row.user_id} className="flex items-center gap-3 p-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white dark:bg-slate-600" : i === 2 ? "bg-orange-400 text-white" : "bg-muted"}`}>
                        {i + 1}
                      </div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={row.avatar_url ?? undefined} />
                        <AvatarFallback>{(row.full_name ?? "U").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{row.full_name ?? row.username ?? "Aspirant"}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.tests_attempted} test{row.tests_attempted === 1 ? "" : "s"} · {Number(row.avg_accuracy).toFixed(1)}% accuracy
                        </div>
                      </div>
                      <div className="text-right text-sm font-bold">{Number(row.total_points).toFixed(0)} pts</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
